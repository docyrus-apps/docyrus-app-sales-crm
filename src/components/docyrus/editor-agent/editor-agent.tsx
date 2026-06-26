'use client';

// @ts-nocheck
/* eslint-disable */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { useChat } from '@ai-sdk/react';
import {
  type UIMessage,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls
} from 'ai';
import {
  Edit,
  PanelLeft,
  X
} from 'lucide-react';

import {
  type AgentMessagePayload,
  type AgentProfile,
  DocyrusAgent,
  DocyrusAgentThreadsSidebar
} from '@/components/docyrus/docyrus-agent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type DocyrusAgentAttachmentsClient,
  useDocyrusAgentAttachments
} from '@/hooks/docyrus/use-docyrus-agent-attachments';
import {
  type DocyrusAgentInfoClient,
  useDocyrusAgentInfo
} from '@/hooks/docyrus/use-docyrus-agent-info';
import {
  type DocyrusAgentThread,
  type DocyrusAgentThreadsClient,
  useDocyrusAgentThreads
} from '@/hooks/docyrus/use-docyrus-agent-threads';

const DEFAULT_ACCEPT_FILE_TYPES = 'image/*,.pdf,.docx,.csv,.xlsx,.md,.txt,.json';
const DEFAULT_WIDTH_PX = 440;
const MAX_HISTORY_LENGTH = 10;
const FALLBACK_AGENT: AgentProfile = {
  name: 'Assistant',
  avatar: { name: 'AI', color: '#6366f1' }
};

/**
 * Combined REST client surface the editor agent needs. Any client implementing
 * GET / POST / PATCH / DELETE works — typically `@docyrus/api-client`'s
 * `RestApiClient`.
 */
export type EditorAgentClient = DocyrusAgentInfoClient
  & DocyrusAgentThreadsClient
  & DocyrusAgentAttachmentsClient;

/** Minimal user shape used to build the sender display name + thread ownership. */
export interface EditorAgentUser {
  id?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
}

interface ISendOptions {
  filePaths?: Array<string>;
  supportFiles?: boolean;
}

/**
 * Client-side tool exposed to the agent. The agent invokes it through the LLM
 * stream; we execute it locally and feed the result back via `addToolResult`.
 */
export interface IEditorAgentClientTool {
  /** Tool key the agent calls — must match the `tenant_ai_tool.key` registered to the agent. */
  name: string;
  /** Local handler. Receives the LLM-provided input and returns the tool output. */
  execute: (input: unknown) => Promise<unknown> | unknown;
}

interface IToolCallSummary {
  toolName: string;
  toolCallId: string;
  state: string;
  input: unknown;
}

export interface EditorAgentProps {
  /** Tenant AI agent ID — drives the chat endpoint, threads, and profile. */
  agentId: string;
  /** Controlled open state. Drawer slides in from the left when true. */
  open: boolean;
  /** Fired when the assistant requests to close (header X button). */
  onClose: () => void;
  /**
   * Authenticated REST client. Must support GET / POST / PATCH / DELETE.
   * Typically `useDocyrusAuth().client` from `@docyrus/signin`.
   */
  client: EditorAgentClient | null | undefined;
  /** Authenticated user. Drives senderName + thread userId scoping. */
  user?: EditorAgentUser | null;
  /**
   * Docyrus API base URL **including the version segment**, e.g.
   * `https://api.docyrus.com/v1`. The chat endpoint becomes
   * `${apiBaseUrl}/ai/agents/${agentId}/chat`.
   */
  apiBaseUrl: string;
  /**
   * Returns the bearer token to attach to chat requests. Called on every send
   * so refreshed tokens land in the request. Return `null` to send unauthed.
   */
  getAccessToken?: () => string | null | Promise<string | null>;
  /** Drawer width in pixels. Defaults to 440. */
  width?: number;
  /** File types accepted by the chat attachment picker. */
  acceptFileTypes?: string;
  /** Disable the attach-file button when false. Defaults to true. */
  allowAttachments?: boolean;
  /**
   * Currently-selected Docyrus data source ID. When set, it is sent as the
   * top-level `pageDataSourceId` field in the chat request body so the
   * backend can resolve `{{dataSourceMetadata}}` (and similar) system-prompt
   * template variables server-side (see `AiAgent.getSystemPromptParts`).
   * Prefer this over serializing field metadata into `editorContext` — it
   * costs zero tokens until the prompt actually uses it.
   */
  dataSourceId?: string | null;
  /**
   * Extra arbitrary fields merged into every chat request body. Called on each
   * send so the latest values land in the request. Use for per-page fields the
   * backend agent expects (e.g. `recordId`, `appSlug`). Anything covered by
   * dedicated props (`dataSourceId`, `additionalContext`, …) should use those.
   */
  extraBody?: () => Record<string, unknown> | null | undefined;
  /**
   * Client-side tools auto-executed when the agent invokes them. Matched by
   * `tool.name`; tool calls without a registered handler are ignored.
   */
  clientTools?: ReadonlyArray<IEditorAgentClientTool>;
  /**
   * Per-turn editor context appended to the system prompt (backend reads
   * `additionalContext` and injects under '### Additional Context'). Called on
   * each send so the latest editor state lands in the prompt — typically the
   * data shape (JSON Schema), input snapshot, or current expression / template
   * / query. Return `null`/`undefined` to skip injection.
   */
  editorContext?: () => string | null | undefined;
  /** Fallback name used when the user payload is empty. */
  senderNameFallback?: string;
  /** Optional className applied to the outer drawer shell. */
  className?: string;
}

function stripFileParts(messages: Array<UIMessage>): Array<UIMessage> {
  return messages.map(message => ({
    ...message,
    parts: message.parts.filter(part => part.type !== 'file')
  }));
}

function extractToolCall(part: unknown): IToolCallSummary | null {
  if (!part || typeof part !== 'object') return null;
  const p = part as {
    type?: string;
    toolName?: string;
    toolCallId?: string;
    state?: string;
    input?: unknown;
  };

  if (!p.type || !p.toolCallId || !p.state) return null;

  if (p.type === 'dynamic-tool' && p.toolName) {
    return {
      toolName: p.toolName,
      toolCallId: p.toolCallId,
      state: p.state,
      input: p.input
    };
  }

  if (p.type.startsWith('tool-')) {
    return {
      toolName: p.type.slice('tool-'.length),
      toolCallId: p.toolCallId,
      state: p.state,
      input: p.input
    };
  }

  return null;
}

/**
 * Slide-in AI assistant drawer composed of the threads sidebar + DocyrusAgent
 * chat. Auth-agnostic library version of the editor agent UX used by docyrus
 * editor playground pages and the docyrus-client developer-tools page.
 *
 * Pass an authenticated `client`, the current `user`, the `apiBaseUrl`, and an
 * optional `getAccessToken` callback; the component handles transport,
 * threads, attachments, client tool execution, and per-turn
 * `additionalContext` injection.
 */
export function EditorAgent({
  agentId,
  open,
  onClose,
  client,
  user,
  apiBaseUrl,
  getAccessToken,
  width = DEFAULT_WIDTH_PX,
  acceptFileTypes = DEFAULT_ACCEPT_FILE_TYPES,
  allowAttachments = true,
  clientTools,
  editorContext,
  dataSourceId,
  extraBody,
  senderNameFallback = 'Editor',
  className
}: EditorAgentProps) {
  const senderName = useMemo(() => {
    const composed = [user?.firstname, user?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim();

    return composed || user?.email || senderNameFallback;
  }, [user, senderNameFallback]);

  const agentInfo = useDocyrusAgentInfo({ client, agentId });
  const agentProfile = agentInfo.agent ?? FALLBACK_AGENT;

  const threads = useDocyrusAgentThreads({
    client,
    agentId,
    userId: user?.id ?? null
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeThreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const handleThreadCreated = useCallback(
    (id: string) => {
      activeThreadIdRef.current = id;
      setActiveThreadId(id);
      void threads.refresh();
    },
    [threads]
  );

  const { resolveFilePaths, ensureThread } = useDocyrusAgentAttachments({
    client,
    agentId,
    threadId: activeThreadId,
    onThreadCreated: handleThreadCreated,
    senderName
  });

  const sendOptionsRef = useRef<ISendOptions | null>(null);
  const editorContextRef = useRef(editorContext);
  const getAccessTokenRef = useRef(getAccessToken);
  const dataSourceIdRef = useRef(dataSourceId);
  const extraBodyRef = useRef(extraBody);

  useEffect(() => {
    editorContextRef.current = editorContext;
  }, [editorContext]);

  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  useEffect(() => {
    dataSourceIdRef.current = dataSourceId;
  }, [dataSourceId]);

  useEffect(() => {
    extraBodyRef.current = extraBody;
  }, [extraBody]);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: `${apiBaseUrl}/ai/agents/${agentId}/chat`,
      fetch: async (input, init) => {
        const token = await getAccessTokenRef.current?.();
        const headers = new Headers(init?.headers);

        if (token) headers.set('Authorization', `Bearer ${token}`);

        return fetch(input, { ...init, headers });
      },
      prepareSendMessagesRequest: ({ messages, body }) => {
        const opts = sendOptionsRef.current;
        const ctx = editorContextRef.current?.()?.trim();
        const dsId = dataSourceIdRef.current;
        const extras = extraBodyRef.current?.() ?? null;

        return {
          body: {
            ...body,
            ...(extras ?? {}),
            agentId,
            threadId: activeThreadIdRef.current,
            modelId: 'default',
            supportFiles: !!opts?.supportFiles,
            messages: stripFileParts(messages).slice(-MAX_HISTORY_LENGTH),
            ...(opts?.filePaths?.length ? { files: opts.filePaths } : {}),
            ...(dsId ? { pageDataSourceId: dsId } : {}),
            ...(ctx ? { additionalContext: ctx } : {})
          }
        };
      }
    }),
    [apiBaseUrl, agentId]
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    addToolResult
  } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls
  });

  const clientToolsRef = useRef(clientTools);

  useEffect(() => {
    clientToolsRef.current = clientTools;
  }, [clientTools]);

  const handledToolCallIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tools = clientToolsRef.current;

    if (!tools || tools.length === 0) return;

    for (const message of messages) {
      if (message.role !== 'assistant') continue;

      for (const part of message.parts) {
        const call = extractToolCall(part);

        if (!call || call.state !== 'input-available') continue;
        if (handledToolCallIdsRef.current.has(call.toolCallId)) continue;

        const handler = tools.find(t => t.name === call.toolName);

        if (!handler) continue;

        handledToolCallIdsRef.current.add(call.toolCallId);

        void (async () => {
          try {
            const output = await handler.execute(call.input);

            addToolResult({
              tool: call.toolName,
              toolCallId: call.toolCallId,
              output
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);

            addToolResult({
              tool: call.toolName,
              toolCallId: call.toolCallId,
              output: { ok: false, error: { message } }
            });
          }
        })();
      }
    }
  }, [messages, addToolResult]);

  const handleNewThread = useCallback(() => {
    stop();
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
    setMessages([]);
    handledToolCallIdsRef.current = new Set();
  }, [setMessages, stop]);

  const handleSendMessage = useCallback(
    async ({ text, files }: AgentMessagePayload) => {
      const trimmed = text.trim();

      if (!trimmed && !files?.length) return;

      await ensureThread(trimmed);

      const hasFiles = !!files && files.length > 0;
      const filePaths = hasFiles ? (await resolveFilePaths(files, trimmed)).filePaths : [];

      sendOptionsRef.current = { filePaths, supportFiles: hasFiles };

      const sendOptions = hasFiles ? { body: { files: filePaths, supportFiles: true } } : undefined;

      await sendMessage({ text: trimmed }, sendOptions);
    },
    [ensureThread, resolveFilePaths, sendMessage]
  );

  const handleSelectThread = useCallback(
    async (thread: DocyrusAgentThread) => {
      if (thread.id === activeThreadId) return;
      activeThreadIdRef.current = thread.id;
      setActiveThreadId(thread.id);
      stop();
      handledToolCallIdsRef.current = new Set();
      const loaded = await threads.loadMessages(thread.id);

      setMessages(loaded);
    },
    [
      activeThreadId,
      threads,
      setMessages,
      stop
    ]
  );

  const handleDeleteThread = useCallback(
    async (thread: DocyrusAgentThread) => {
      const ok = await threads.deleteThread(thread.id);

      if (ok && thread.id === activeThreadId) handleNewThread();
    },
    [threads, activeThreadId, handleNewThread]
  );

  const handleRenameThread = useCallback(
    async (thread: DocyrusAgentThread, subject: string) => {
      await threads.renameThread(thread.id, subject);
    },
    [threads]
  );

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'absolute inset-y-0 left-0 z-10 flex flex-col overflow-hidden border-r border-border bg-background shadow-xl transition-transform duration-300 ease-in-out',
        !open && 'pointer-events-none',
        className
      )}
      style={{
        width,
        transform: open ? 'translateX(0)' : 'translateX(-100%)'
      }}>
      <div className="relative flex h-full w-full min-w-0">
        <div className="absolute left-2 top-2 z-30 flex flex-col gap-1 rounded-md bg-background/80 p-0.5 shadow-sm backdrop-blur-sm">
          <Button
            aria-label={sidebarOpen ? 'Close threads' : 'Open threads'}
            className="size-8"
            size="icon"
            variant="ghost"
            onClick={() => setSidebarOpen(prev => !prev)}>
            <PanelLeft className="size-4" />
          </Button>
          <Button
            aria-label="New chat"
            className="size-8"
            size="icon"
            variant="ghost"
            onClick={handleNewThread}>
            <Edit className="size-4" />
          </Button>
        </div>

        <DocyrusAgent
          acceptFileTypes={acceptFileTypes}
          agent={agentProfile}
          allowAttachments={allowAttachments}
          chatStatus={status}
          className="min-h-0 min-w-0 flex-1"
          headerLeading={<div aria-hidden className="w-9 shrink-0" />}
          headerTrailing={(
            <Button
              aria-label="Close assistant"
              className="size-7"
              size="icon"
              variant="ghost"
              onClick={onClose}>
              <X className="size-4" />
            </Button>
          )}
          messages={messages}
          suggestions={agentInfo.suggestions}
          onSendMessage={(payload) => {
            void handleSendMessage(payload);
          }}
          onStopGeneration={stop} />

        {sidebarOpen && (
          <div className="absolute inset-0 z-40 flex">
            <div
              aria-hidden
              className="absolute inset-0 bg-black/30"
              onClick={() => setSidebarOpen(false)} />
            <div className="relative flex h-full w-72 max-w-[80%] flex-col border-r border-border bg-background shadow-xl">
              <DocyrusAgentThreadsSidebar
                activeThreadId={activeThreadId}
                agent={agentProfile}
                isLoading={threads.isLoading}
                open
                threads={threads.threads}
                onClose={() => setSidebarOpen(false)}
                onDeleteThread={handleDeleteThread}
                onNewThread={() => {
                  handleNewThread();
                  setSidebarOpen(false);
                }}
                onRenameThread={handleRenameThread}
                onSelectThread={(thread) => {
                  void handleSelectThread(thread);
                  setSidebarOpen(false);
                }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}