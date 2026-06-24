'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback } from 'react'

import { type FileUIPart } from 'ai'

/**
 * Minimal REST client surface this hook needs. Compatible with `@docyrus/api-client`'s
 * `RestApiClient` (and any other client that exposes a typed `post`).
 */
export interface DocyrusAgentAttachmentsClient {
  post: <T = unknown>(url: string, body?: unknown) => Promise<T>
}

export interface UseDocyrusAgentAttachmentsArgs {
  /** Authenticated Docyrus REST client. */
  client: DocyrusAgentAttachmentsClient | null | undefined
  /** Tenant AI agent ID. Threads + uploads are scoped to this agent. */
  agentId: string
  /**
   * Current thread ID. When null, the first `resolveFilePaths` call creates a new thread
   * and reports it via `onThreadCreated`. When set, files are uploaded to that thread.
   */
  threadId: string | null
  /** Fires when a fresh thread is created (only when the input `threadId` was null). */
  onThreadCreated?: (threadId: string) => void
  /** Optional project scope. */
  projectId?: string | null
  /** Optional deployment scope. */
  deploymentId?: string | null
  /** Display name attached to the created thread. */
  senderName?: string
  /** Subject prefix for newly-created threads. Defaults to the first 100 chars of the first message. */
  threadSubject?: (messageText: string) => string
}

export interface ResolveFilePathsResult {
  /** Storage paths (e.g. `tenant/.../filename.png`) returned by the upload endpoint. */
  filePaths: Array<string>
  /** Thread the files were attached to (newly created on first call, reused after). */
  threadId: string | null
}

export interface UseDocyrusAgentAttachmentsResult {
  /**
   * Upload every attached file to the agent's thread storage, creating the thread on first
   * call. Returns the resolved storage paths to send in the chat request body's `files: []`.
   */
  resolveFilePaths: (
    files: Array<FileUIPart>,
    messageText: string,
  ) => Promise<ResolveFilePathsResult>
  /**
   * Ensure a thread exists for the next message. Returns the current `threadId` when one is
   * already known; otherwise creates a fresh thread (scoped to the active `projectId` /
   * `deploymentId`) and reports it via `onThreadCreated`. Use this before `sendMessage` so
   * the backend can associate the message with a project even when no files are attached.
   */
  ensureThread: (messageText: string) => Promise<string | null>
}

/**
 * Wires Docyrus-backed file uploads into an agent chat surface that uses the AI SDK
 * `useChat` + `DefaultChatTransport` pattern. Thread state is **controlled** — pass the
 * active `threadId` (null for a fresh chat) and listen for `onThreadCreated` to capture
 * the ID after the first upload.
 *
 * Backend contract (see `docyrus-ui-pro/packages/ai-assistant`):
 * - Threads:  `POST /v1/apps/base/data-sources/thread/items`
 *             body: `{ subject, body_text, sender_name, thread_type: 'assistant', tenant_ai_agent_id, ... }`
 *             returns: `{ id, ... }` (envelope-unwrapped or `{ data: { id } }`)
 * - Uploads:  `POST /v1/apps/base/data-sources/thread/items/{threadId}/files/upload`
 *             body: multipart `FormData` with a `file` part
 *             returns: `{ file_name } | { path } | { data: { ... } }`
 *
 * Typical usage:
 *
 * ```tsx
 * const [threadId, setThreadId] = useState<string | null>(null);
 *
 * const { resolveFilePaths } = useDocyrusAgentAttachments({
 *   client,
 *   agentId,
 *   threadId,
 *   onThreadCreated: setThreadId
 * });
 *
 * const handleSend = async ({ text, files }: AgentMessagePayload) => {
 *   const { filePaths } = files?.length
 *     ? await resolveFilePaths(files, text)
 *     : { filePaths: [] };
 *
 *   await sendMessage({ text }, {
 *     body: { files: filePaths, supportFiles: !!files?.length }
 *   });
 * };
 * ```
 */
export function useDocyrusAgentAttachments({
  client,
  agentId,
  threadId,
  onThreadCreated,
  projectId = null,
  deploymentId = null,
  senderName = 'User',
  threadSubject,
}: UseDocyrusAgentAttachmentsArgs): UseDocyrusAgentAttachmentsResult {
  const ensureThread = useCallback(
    async (messageText: string): Promise<string | null> => {
      if (threadId) return threadId
      if (!client) return null

      const subject = threadSubject
        ? threadSubject(messageText)
        : messageText.slice(0, 100) || 'New thread'

      try {
        const response = await client.post<unknown>(
          '/v1/apps/base/data-sources/thread/items',
          {
            subject,
            body_text: messageText,
            sender_name: senderName,
            thread_type: 'assistant',
            tenant_ai_agent_id: agentId,
            tenant_ai_agent_deployment_id: deploymentId,
            tenant_ai_project_id: projectId,
          },
        )

        const envelope = response as {
          id?: string
          data?: { id?: string }
        } | null
        const id = envelope?.id ?? envelope?.data?.id ?? null

        if (id) onThreadCreated?.(id)

        return id
      } catch (error) {
        console.warn(
          '[useDocyrusAgentAttachments] failed to create thread',
          error,
        )

        return null
      }
    },
    [
      client,
      threadId,
      agentId,
      projectId,
      deploymentId,
      senderName,
      threadSubject,
      onThreadCreated,
    ],
  )

  const uploadFile = useCallback(
    async (threadIdValue: string, file: FileUIPart): Promise<string | null> => {
      if (!client || !file.url) return null

      try {
        const blob = await (await fetch(file.url)).blob()
        const formData = new FormData()

        formData.append('file', blob, file.filename ?? 'upload')

        const response = await client.post<unknown>(
          `/v1/apps/base/data-sources/thread/items/${threadIdValue}/files/upload`,
          formData,
        )

        const envelope = response as {
          file_name?: string
          path?: string
          data?:
            | { file_name?: string; path?: string }
            | Array<{ file_name?: string; path?: string }>
        } | null

        const direct = envelope?.file_name ?? envelope?.path

        if (direct) return direct

        const nested = Array.isArray(envelope?.data)
          ? envelope.data[0]
          : envelope?.data

        return nested?.file_name ?? nested?.path ?? null
      } catch (error) {
        console.warn('[useDocyrusAgentAttachments] file upload failed', error)

        return null
      }
    },
    [client],
  )

  const resolveFilePaths = useCallback(
    async (
      files: Array<FileUIPart>,
      messageText: string,
    ): Promise<ResolveFilePathsResult> => {
      if (!files.length) return { filePaths: [], threadId }

      const resolvedThreadId = await ensureThread(messageText)

      if (!resolvedThreadId) return { filePaths: [], threadId: null }

      const filePaths: Array<string> = []

      for (const file of files) {
        const path = await uploadFile(resolvedThreadId, file)

        if (path) filePaths.push(path)
      }

      return { filePaths, threadId: resolvedThreadId }
    },
    [ensureThread, uploadFile, threadId],
  )

  return { resolveFilePaths, ensureThread }
}
