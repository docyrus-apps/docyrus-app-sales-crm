'use client';

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type UIMessage } from 'ai';

export type DocyrusAgentThreadsClientParams = Record<string, string | number | boolean | null | undefined>;

export interface DocyrusAgentThreadsClient {
  get: <T = unknown>(url: string, params?: DocyrusAgentThreadsClientParams) => Promise<T>;
  post: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  delete: <T = unknown>(url: string) => Promise<T>;
}

export interface DocyrusAgentThread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  bodyText?: string;
  createdBy?: unknown;
  /** Display name resolved from the expanded `created_by` payload, when available. */
  createdByName?: string;
  /** Project the thread belongs to, when scoped to one. */
  projectId?: string | null;
}

export interface UseDocyrusAgentThreadsArgs {
  client: DocyrusAgentThreadsClient | null | undefined;
  agentId: string;
  /** Restrict list to threads owned by / shared with this user. */
  userId?: string | null;
  /** Restrict list to a specific project. */
  projectId?: string | null;
  /** Restrict list to a specific deployment. */
  deploymentId?: string | null;
  /** Optional react-query enable toggle (defaults to `!!client`). */
  enabled?: boolean;
}

export interface UseDocyrusAgentThreadsResult {
  threads: Array<DocyrusAgentThread>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  /** Fetches messages for a thread and returns them as `UIMessage[]` for `useChat.setMessages`. */
  loadMessages: (threadId: string) => Promise<Array<UIMessage>>;
  isLoadingMessages: boolean;
  renameThread: (threadId: string, subject: string) => Promise<boolean>;
  isRenaming: boolean;
  deleteThread: (threadId: string) => Promise<boolean>;
  isDeleting: boolean;
}

const THREADS_QUERY_KEY = ['docyrus-agent', 'threads'] as const;

/**
 * Lists + manages Docyrus chat threads (`thread_type: 'assistant'`) for an AI agent.
 *
 * Backend contract:
 * - List:    `GET    /v1/apps/base/data-sources/thread/items?columns=...&filters=...&orderBy=...`
 * - Rename:  `PATCH  /v1/apps/base/data-sources/thread/items/{id}` body `{ subject }`
 * - Delete:  `DELETE /v1/apps/base/data-sources/thread/items/{id}`
 * - Messages: `GET   /v1/apps/base/data-sources/message/items?columns=...&filters=...&sort=...`
 *
 * `loadMessages` returns rows shaped as `UIMessage[]` so you can hand them straight to
 * `useChat({ ... }).setMessages(...)`.
 */
export function useDocyrusAgentThreads({
  client,
  agentId,
  userId = null,
  projectId = null,
  deploymentId = null,
  enabled
}: UseDocyrusAgentThreadsArgs): UseDocyrusAgentThreadsResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => [
      ...THREADS_QUERY_KEY,
      agentId,
      deploymentId,
      projectId,
      userId
    ] as const,
    [
      agentId,
      deploymentId,
      projectId,
      userId
    ]
  );

  const listQuery = useQuery<Array<DocyrusAgentThread>, Error>({
    queryKey,
    enabled: enabled ?? !!client,
    queryFn: async () => {
      if (!client) return [];

      const agentRule = deploymentId ? { field: 'tenant_ai_agent_deployment_id', operator: '=', value: deploymentId } : { field: 'tenant_ai_agent_id', operator: '=', value: agentId };

      const rules: Array<unknown> = [agentRule, { field: 'archived', operator: '=', value: 'false' }];

      if (projectId) {
        rules.push({ field: 'tenant_ai_project_id', operator: '=', value: projectId });
      }

      if (userId) {
        rules.push({
          combinator: 'or',
          rules: [{ field: 'record_owner', operator: '=', value: userId }, { field: 'record_owner', operator: 'shared_to_me' }]
        });
      }

      const response = await client.get<unknown>('/v1/apps/base/data-sources/thread/items', {
        columns: 'id,subject,created_on,last_modified_on,body_text,tenant_ai_agent_id,tenant_ai_project_id,created_by',
        expand: 'created_by',
        orderBy: JSON.stringify({ field: 'created_on', direction: 'desc' }),
        filters: JSON.stringify({ combinator: 'and', rules })
      });

      const items = extractListItems(response);

      return items.map(toThread);
    }
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const renameMutation = useMutation({
    mutationFn: async ({ threadId, subject }: { threadId: string; subject: string }) => {
      if (!client) throw new Error('No client');

      await client.patch(`/v1/apps/base/data-sources/thread/items/${threadId}`, { subject });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      if (!client) throw new Error('No client');

      await client.delete(`/v1/apps/base/data-sources/thread/items/${threadId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const loadMessagesMutation = useMutation<Array<UIMessage>, Error, string>({
    mutationFn: async (threadId: string) => {
      if (!client) return [];

      const response = await client.get<unknown>('/v1/apps/base/data-sources/message/items', {
        columns: 'message_id,body_json,body_text,role,sender_name,created_on',
        filters: JSON.stringify({
          combinator: 'and',
          rules: [{ field: 'thread', operator: '=', value: threadId }, { field: 'archived', operator: '=', value: false }]
        }),
        orderBy: JSON.stringify([{ field: 'created_on', direction: 'asc' }]),
        limit: 200
      });

      return processMessages(extractListItems(response));
    }
  });

  const renameThread = useCallback(
    async (threadId: string, subject: string) => {
      try {
        await renameMutation.mutateAsync({ threadId, subject });

        return true;
      } catch (error) {
        console.warn('[useDocyrusAgentThreads] rename failed', error);

        return false;
      }
    },
    [renameMutation]
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        await deleteMutation.mutateAsync(threadId);

        return true;
      } catch (error) {
        console.warn('[useDocyrusAgentThreads] delete failed', error);

        return false;
      }
    },
    [deleteMutation]
  );

  const loadMessages = useCallback(
    (threadId: string) => loadMessagesMutation.mutateAsync(threadId),
    [loadMessagesMutation]
  );

  return {
    threads: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error ?? null,
    refresh,
    loadMessages,
    isLoadingMessages: loadMessagesMutation.isPending,
    renameThread,
    isRenaming: renameMutation.isPending,
    deleteThread,
    isDeleting: deleteMutation.isPending
  };
}

interface RawThread {
  id: string;
  subject?: string;
  created_on?: string;
  last_modified_on?: string;
  body_text?: string;
  created_by?: unknown;
  tenant_ai_project_id?: string | null;
}

function extractListItems(response: unknown): Array<RawThread> {
  if (Array.isArray(response)) return response as Array<RawThread>;
  if (response && typeof response === 'object') {
    const env = response as { data?: unknown; items?: unknown };

    if (Array.isArray(env.data)) return env.data as Array<RawThread>;
    if (Array.isArray(env.items)) return env.items as Array<RawThread>;
    if (env.data && typeof env.data === 'object' && Array.isArray((env.data as { items?: unknown }).items)) {
      return (env.data as { items: Array<RawThread> }).items;
    }
  }

  return [];
}

function toThread(item: RawThread): DocyrusAgentThread {
  return {
    id: item.id,
    title: item.subject?.trim() || 'Untitled',
    createdAt: new Date(item.created_on ?? Date.now()),
    updatedAt: new Date(item.last_modified_on ?? item.created_on ?? Date.now()),
    bodyText: item.body_text,
    createdBy: item.created_by,
    createdByName: resolveCreatedByName(item.created_by),
    projectId: item.tenant_ai_project_id ?? null
  };
}

function resolveCreatedByName(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const obj = value as {
    name?: string;
    full_name?: string;
    fullName?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
  };

  if (obj.name?.trim()) return obj.name.trim();
  if (obj.full_name?.trim()) return obj.full_name.trim();
  if (obj.fullName?.trim()) return obj.fullName.trim();

  const composed = [obj.firstname, obj.lastname].filter(Boolean).join(' ').trim();

  if (composed) return composed;

  return obj.email?.trim();
}

interface RawMessage {
  message_id?: string;
  id?: string;
  body_json?: string | object | null;
  body_text?: string;
  role?: 'user' | 'assistant';
  sender_name?: string;
  created_on?: string;
}

function processMessages(rows: Array<RawMessage>): Array<UIMessage> {
  return rows
    .slice()
    .sort((a, b) => new Date(a.created_on ?? 0).getTime() - new Date(b.created_on ?? 0).getTime())
    .map((row) => {
      const role: UIMessage['role'] = row.role ?? (row.sender_name === 'Assistant' ? 'assistant' : 'user');
      const id = row.message_id ?? row.id ?? cryptoRandomId();

      let parts: UIMessage['parts'] = [];

      let bodyJson = row.body_json;

      if (typeof bodyJson === 'string') {
        try {
          bodyJson = JSON.parse(bodyJson);
        } catch {
          bodyJson = null;
        }
      }

      const jsonParts = (bodyJson as { parts?: unknown })?.parts;

      if (Array.isArray(jsonParts)) {
        parts = jsonParts as UIMessage['parts'];
      } else if (row.body_text) {
        parts = [{ type: 'text', text: row.body_text }];
      }

      return { id, role, parts } as UIMessage;
    });
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();

  return Math.random().toString(36).slice(2, 12);
}