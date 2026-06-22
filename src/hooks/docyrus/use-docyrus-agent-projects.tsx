'use client';

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type DocyrusAgentProjectsClientParams = Record<string, string | number | boolean | null | undefined>;

export interface DocyrusAgentProjectsClient {
  get: <T = unknown>(url: string, params?: DocyrusAgentProjectsClientParams) => Promise<T>;
  post: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  delete: <T = unknown>(url: string) => Promise<T>;
}

export interface DocyrusAgentProject {
  id: string;
  name: string;
  description?: string;
  agentId?: string;
  deploymentId?: string;
  createdBy?: unknown;
  sharedTo?: Array<string>;
}

export interface UseDocyrusAgentProjectsArgs {
  client: DocyrusAgentProjectsClient | null | undefined;
  agentId: string;
  /** Restrict list to projects owned by / shared with this user. */
  userId?: string | null;
  enabled?: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UseDocyrusAgentProjectsResult {
  projects: Array<DocyrusAgentProject>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<DocyrusAgentProject | null>;
  isCreating: boolean;
  renameProject: (projectId: string, name: string) => Promise<boolean>;
  isRenaming: boolean;
  deleteProject: (projectId: string) => Promise<boolean>;
  isDeleting: boolean;
}

const PROJECTS_QUERY_KEY = ['docyrus-agent', 'projects'] as const;

/**
 * Lists + manages Docyrus AI projects scoped to an agent.
 *
 * Backend contract:
 * - List:   `GET    /v1/ai/projects`
 * - Create: `POST   /v1/ai/projects` body `{ name, description?, tenant_ai_agent_id }`
 * - Rename: `PATCH  /v1/ai/projects/{id}` body `{ name }`
 * - Delete: `DELETE /v1/ai/projects/{id}`
 *
 * Filtering is done client-side because the list endpoint returns every project the
 * caller has access to. Pass `userId` to restrict the result to projects the user owns
 * or has been shared on.
 */
export function useDocyrusAgentProjects({
  client,
  agentId,
  userId = null,
  enabled
}: UseDocyrusAgentProjectsArgs): UseDocyrusAgentProjectsResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => [...PROJECTS_QUERY_KEY, agentId, userId] as const,
    [agentId, userId]
  );

  const listQuery = useQuery<Array<DocyrusAgentProject>, Error>({
    queryKey,
    enabled: enabled ?? !!client,
    queryFn: async () => {
      if (!client) return [];

      const response = await client.get<unknown>('/v1/ai/projects');
      const items = extractListItems(response);

      const projects = items.map(toProject);

      return projects.filter((project) => {
        if (agentId && project.agentId && project.agentId !== agentId) return false;
        if (!userId) return true;
        if (project.createdBy === userId) return true;
        if (Array.isArray(project.sharedTo) && project.sharedTo.includes(userId)) return true;

        return false;
      });
    }
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const createMutation = useMutation<DocyrusAgentProject | null, Error, CreateProjectInput>({
    mutationFn: async ({ name, description }) => {
      if (!client) throw new Error('No client');

      const response = await client.post<unknown>('/v1/ai/projects', {
        name,
        description: description || undefined,
        tenant_ai_agent_id: agentId
      });

      const envelope = response as { id?: string; data?: RawProject } | RawProject | null;

      if (!envelope) return null;
      if ('data' in (envelope as object) && (envelope as { data?: RawProject }).data) {
        return toProject((envelope as { data: RawProject }).data);
      }

      return toProject(envelope as RawProject);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const renameMutation = useMutation({
    mutationFn: async ({ projectId, name }: { projectId: string; name: string }) => {
      if (!client) throw new Error('No client');

      await client.patch(`/v1/ai/projects/${projectId}`, { name });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!client) throw new Error('No client');

      await client.delete(`/v1/ai/projects/${projectId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      try {
        return await createMutation.mutateAsync(input);
      } catch (error) {
        console.warn('[useDocyrusAgentProjects] create failed', error);

        return null;
      }
    },
    [createMutation]
  );

  const renameProject = useCallback(
    async (projectId: string, name: string) => {
      try {
        await renameMutation.mutateAsync({ projectId, name });

        return true;
      } catch (error) {
        console.warn('[useDocyrusAgentProjects] rename failed', error);

        return false;
      }
    },
    [renameMutation]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        await deleteMutation.mutateAsync(projectId);

        return true;
      } catch (error) {
        console.warn('[useDocyrusAgentProjects] delete failed', error);

        return false;
      }
    },
    [deleteMutation]
  );

  return {
    projects: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error ?? null,
    refresh,
    createProject,
    isCreating: createMutation.isPending,
    renameProject,
    isRenaming: renameMutation.isPending,
    deleteProject,
    isDeleting: deleteMutation.isPending
  };
}

interface RawProject {
  id: string;
  name?: string;
  description?: string;
  tenant_ai_agent_id?: string;
  tenant_ai_agent_deployment_id?: string;
  created_by?: unknown;
  shared_to?: Array<string>;
}

function extractListItems(response: unknown): Array<RawProject> {
  if (Array.isArray(response)) return response as Array<RawProject>;
  if (response && typeof response === 'object') {
    const env = response as { data?: unknown; items?: unknown };

    if (Array.isArray(env.data)) return env.data as Array<RawProject>;
    if (Array.isArray(env.items)) return env.items as Array<RawProject>;
    if (env.data && typeof env.data === 'object' && Array.isArray((env.data as { items?: unknown }).items)) {
      return (env.data as { items: Array<RawProject> }).items;
    }
  }

  return [];
}

function toProject(item: RawProject): DocyrusAgentProject {
  return {
    id: item.id,
    name: item.name?.trim() || 'Untitled',
    description: item.description,
    agentId: item.tenant_ai_agent_id,
    deploymentId: item.tenant_ai_agent_deployment_id,
    createdBy: item.created_by,
    sharedTo: item.shared_to
  };
}