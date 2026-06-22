'use client';

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { type AgentCapabilities, type AgentProfile } from '@/components/docyrus/docyrus-agent';

export type DocyrusAgentInfoClientParams = Record<string, string | number | boolean | null | undefined>;

export interface DocyrusAgentInfoClient {
  get: <T = unknown>(url: string, params?: DocyrusAgentInfoClientParams) => Promise<T>;
}

export interface UseDocyrusAgentInfoArgs {
  client: DocyrusAgentInfoClient | null | undefined;
  /** Tenant AI agent ID. Resolved via `/agent-deployments/base/{agentId}`. */
  agentId?: string | null;
  /** Specific deployment to read instead of the base record. Resolved via `/agent-deployments/{deploymentId}`. */
  deploymentId?: string | null;
  /** Optional react-query enable toggle. Defaults to `!!client && (agentId || deploymentId)`. */
  enabled?: boolean;
}

export interface UseDocyrusAgentInfoResult {
  /** Mapped `AgentProfile` (name, description, welcomeMessage, avatar) — null until loaded. */
  agent: AgentProfile | null;
  /** Suggestion prompts surfaced by the agent (`standardSuggestions`). */
  suggestions: Array<string>;
  /** Feature capabilities (`supportWebSearch`, `supportFiles`, ...) advertised by the agent. */
  capabilities: AgentCapabilities;
  /** Raw payload from the deployment endpoint — useful for accessing models, mcp servers, etc. */
  raw: DocyrusAgentDeploymentEnvelope | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches an AI agent's profile (name, avatar, welcome message, suggestions) from the Docyrus
 * agent-deployment endpoint and maps it onto the `AgentProfile` shape used by `<DocyrusAgent>`.
 *
 * Endpoints:
 * - Base agent:  `GET /v1/ai/agent-deployments/base/{agentId}`
 * - Deployment:  `GET /v1/ai/agent-deployments/{deploymentId}`
 *
 * Use it to replace hard-coded `agent={{ name, ... }}` blocks with a live record:
 *
 * ```tsx
 * const { agent } = useDocyrusAgentInfo({ client, agentId: AGENT_ID });
 *
 * if (!agent) return <Spinner />;
 *
 * return <DocyrusAgent agent={agent} ... />;
 * ```
 */
export function useDocyrusAgentInfo({
  client,
  agentId = null,
  deploymentId = null,
  enabled
}: UseDocyrusAgentInfoArgs): UseDocyrusAgentInfoResult {
  const queryKey = useMemo(
    () => ['docyrus-agent', 'info', deploymentId ?? `base:${agentId ?? ''}`] as const,
    [agentId, deploymentId]
  );

  const query = useQuery<DocyrusAgentDeploymentEnvelope | null, Error>({
    queryKey,
    enabled: enabled ?? (!!client && (!!agentId || !!deploymentId)),
    queryFn: async () => {
      if (!client) return null;

      const path = deploymentId ? `/v1/ai/agent-deployments/${deploymentId}` : `/v1/ai/agent-deployments/base/${agentId}`;

      const response = await client.get<unknown>(path);

      return unwrapEnvelope(response);
    }
  });

  const result = useMemo(() => {
    const envelope = query.data ?? null;
    const inner = envelope?.agent ?? null;
    const source = inner ?? envelope;
    const empty = { agent: null as AgentProfile | null, suggestions: [] as Array<string>, capabilities: {} as AgentCapabilities };

    if (!envelope || !source?.name) return empty;

    const agent: AgentProfile = {
      name: source.name,
      description: source.description ?? undefined,
      welcomeMessage: envelope.welcomeMessage ?? source.welcomeMessage ?? undefined,
      avatar: normalizeAvatar(source.avatar)
    };

    return {
      agent,
      suggestions: parseSuggestions(source.standardSuggestions),
      capabilities: resolveCapabilities(envelope, source)
    };
  }, [query.data]);

  return {
    agent: result.agent,
    suggestions: result.suggestions,
    capabilities: result.capabilities,
    raw: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refresh: async () => {
      await query.refetch();
    }
  };
}

function resolveCapabilities(
  envelope: DocyrusAgentDeploymentEnvelope,
  source: NonNullable<DocyrusAgentDeploymentEnvelope['agent']> | DocyrusAgentDeploymentEnvelope
): AgentCapabilities {
  const obj = source as Record<string, unknown>;
  const envObj = envelope as Record<string, unknown>;

  const pickBool = (key: string): boolean | undefined => {
    const v = obj[key] ?? envObj[key];

    return typeof v === 'boolean' ? v : undefined;
  };

  const promptOptimizationChoice = (obj.promptOptimizationChoice ?? envObj.promptOptimizationChoice) as AgentCapabilities['promptOptimizationChoice'];

  return {
    supportFiles: pickBool('supportFiles'),
    supportWebSearch: pickBool('supportWebSearch'),
    supportDocumentSearch: pickBool('documentSearch') ?? pickBool('supportDocumentSearch'),
    supportThinking: pickBool('supportThinking'),
    supportDeepResearch: pickBool('supportDeepResearch'),
    supportWorkCanvas: pickBool('featureWorks') ?? pickBool('supportWorkCanvas'),
    supportMultipleModels: pickBool('supportMultipleModels'),
    promptOptimizationChoice: promptOptimizationChoice ?? null
  };
}

export interface DocyrusAgentDeploymentEnvelope {
  id?: string | null;
  name?: string;
  description?: string;
  welcomeMessage?: string;
  avatar?: unknown;
  defaultAiModelId?: string;
  standardSuggestions?: unknown;
  agent?: {
    id?: string;
    name?: string;
    description?: string;
    welcomeMessage?: string;
    avatar?: unknown;
    standardSuggestions?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function unwrapEnvelope(response: unknown): DocyrusAgentDeploymentEnvelope | null {
  if (!response || typeof response !== 'object') return null;

  const obj = response as { data?: unknown } & DocyrusAgentDeploymentEnvelope;

  if (obj.data && typeof obj.data === 'object') return obj.data as DocyrusAgentDeploymentEnvelope;

  return obj;
}

function normalizeAvatar(value: unknown): AgentProfile['avatar'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as {
    name?: string;
    color?: string;
    icon?: string;
    image?: string;
    signed_url?: string;
    url?: string;
  };

  return {
    name: obj.name,
    color: obj.color,
    icon: obj.icon,
    image: obj.image ?? obj.signed_url ?? obj.url
  };
}

function parseSuggestions(value: unknown): Array<string> {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item : (item as { text?: string; label?: string; prompt?: string })?.text ?? (item as { label?: string })?.label ?? (item as { prompt?: string })?.prompt))
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
  }
  if (typeof value === 'string') {
    return value.split('\n').map(s => s.trim()).filter(Boolean);
  }

  return [];
}