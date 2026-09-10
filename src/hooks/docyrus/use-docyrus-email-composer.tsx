'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useState } from 'react'

import { type RestApiClient } from '@docyrus/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type EmailAttachment,
  type EmailComposerAccount,
  type EmailComposerProps,
} from '@/components/docyrus/email-composer'

/**
 * Provider names returned by the Docyrus messaging API.
 */
export type DocyrusEmailProvider =
  | 'aws'
  | 'smtp'
  | 'mailgun'
  | 'resend'
  | 'microsoft-graph'
  | 'gmail'

/**
 * Account entry returned by `GET /v1/messaging/email/accounts`. Mirrors the
 * server-side `EmailAccountDto` shape — composers receive the trimmed
 * `EmailComposerAccount` projection, while the raw record stays available on
 * the hook return for callers that need provider / override metadata.
 */
export interface DocyrusEmailAccount extends EmailComposerAccount {
  kind: 'tenant' | 'user'
  provider: DocyrusEmailProvider | string | null
  providerSlug: string | null
  isUserAccessible: boolean
  /** Whether `sendAsUser` may replace the From display name (tenant accounts). */
  allowOverrideName: boolean
  /** Whether `sendAsUser` may replace the From address (tenant accounts). */
  allowOverrideEmail: boolean
  createdOn: string | null
}

/**
 * Attachment shape accepted by the send endpoint. Files must already live in
 * Docyrus storage — the composer's local `EmailAttachment` is metadata-only
 * and cannot be sent as-is.
 */
export interface DocyrusEmailAttachment {
  filePath: string
  fileName?: string
  mimeType?: string
}

export interface DocyrusEmailSendOverrides {
  to?: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string[]
  subject?: string
  body?: string
  /** Send through the tenant account but spoof the From with the user's identity (subject to `allowOverride*`). */
  sendAsUser?: boolean
  /** Storage-backed attachments — different from the local `EmailAttachment` metadata. */
  attachments?: DocyrusEmailAttachment[]
  /** Optional override of the account to send from. Defaults to `selectedAccountId`. */
  accountId?: string
}

export interface DocyrusEmailSendResult {
  messageId: string | null
  provider: DocyrusEmailProvider | string
  accepted: string[]
  rejected: string[]
}

export interface UseDocyrusEmailComposerOptions {
  /** Authenticated REST client. */
  client: RestApiClient
  /** Initial recipients. */
  initialTo?: string[]
  initialCc?: string[]
  initialBcc?: string[]
  initialReplyTo?: string[]
  initialSubject?: string
  initialBody?: string
  /**
   * Account id to preselect. When omitted, the hook picks the first
   * user-accessible account once the list resolves.
   */
  initialAccountId?: string
  /** When true (default), the hook clears recipients / subject / body / attachments after a successful send. */
  resetOnSendSuccess?: boolean
  /** Toggles the `GET /v1/messaging/email/accounts` query. Defaults to `true`. */
  enabled?: boolean
  /** Default `sendAsUser` value forwarded to every send call unless explicitly overridden. */
  sendAsUser?: boolean
  /** Override the accounts list endpoint. */
  listAccountsEndpoint?: string
  /** Override the send endpoint. `{accountId}` is replaced with the selected account id. */
  sendEndpoint?: string
}

type ManagedComposerProps =
  | 'accounts'
  | 'selectedAccountId'
  | 'onSelectedAccountChange'
  | 'to'
  | 'onToChange'
  | 'cc'
  | 'onCcChange'
  | 'bcc'
  | 'onBccChange'
  | 'subject'
  | 'onSubjectChange'
  | 'body'
  | 'onBodyChange'
  | 'onSend'
  | 'sending'

export interface UseDocyrusEmailComposerResult {
  /** Props ready to be spread onto `<EmailComposer />`. */
  composerProps: Pick<EmailComposerProps, ManagedComposerProps>
  /** Raw account DTOs (includes provider / override metadata). */
  accounts: DocyrusEmailAccount[]
  /** Currently selected account, if any. */
  selectedAccount: DocyrusEmailAccount | null
  /** Manually change the selected account. */
  setSelectedAccountId: (accountId: string) => void
  /** Account list query state. */
  isLoadingAccounts: boolean
  accountsError: Error | null
  refetchAccounts: () => Promise<unknown>
  /** Composer field state — exposed for cases where callers need to inspect or mutate it outside the composer. */
  to: string[]
  setTo: (next: string[]) => void
  cc: string[]
  setCc: (next: string[]) => void
  bcc: string[]
  setBcc: (next: string[]) => void
  replyTo: string[]
  setReplyTo: (next: string[]) => void
  subject: string
  setSubject: (next: string) => void
  body: string
  setBody: (next: string) => void
  attachments: EmailAttachment[]
  setAttachments: (next: EmailAttachment[]) => void
  /** Trigger a send. Resolves with the server-side `accepted`/`rejected` summary. */
  send: (
    overrides?: DocyrusEmailSendOverrides,
  ) => Promise<DocyrusEmailSendResult>
  isSending: boolean
  sendError: Error | null
  /** Last successful send response — useful for surfacing rejected recipients. */
  lastSendResult: DocyrusEmailSendResult | null
  /** Clear recipients / subject / body / attachments back to the initial values. */
  reset: () => void
}

interface ListAccountsResponse {
  data: DocyrusEmailAccount[]
}

interface SendEmailResponse {
  data: DocyrusEmailSendResult
}

const DEFAULT_LIST_ENDPOINT = '/v1/messaging/email/accounts'
const DEFAULT_SEND_ENDPOINT = '/v1/messaging/email/accounts/{accountId}/send'

export function useDocyrusEmailComposer(
  options: UseDocyrusEmailComposerOptions,
): UseDocyrusEmailComposerResult {
  const {
    client,
    initialTo = [],
    initialCc = [],
    initialBcc = [],
    initialReplyTo = [],
    initialSubject = '',
    initialBody = '',
    initialAccountId,
    resetOnSendSuccess = true,
    enabled = true,
    sendAsUser: defaultSendAsUser,
    listAccountsEndpoint = DEFAULT_LIST_ENDPOINT,
    sendEndpoint = DEFAULT_SEND_ENDPOINT,
  } = options

  const queryClient = useQueryClient()

  const accountsQuery = useQuery<DocyrusEmailAccount[]>({
    queryKey: ['docyrus-email-accounts', listAccountsEndpoint],
    queryFn: async () => {
      const response = await client.get<
        ListAccountsResponse | DocyrusEmailAccount[]
      >(listAccountsEndpoint)

      if (Array.isArray(response)) return response

      return response?.data ?? []
    },
    enabled,
  })

  const accounts = useMemo<DocyrusEmailAccount[]>(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  )

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialAccountId ?? null,
  )

  const resolvedSelectedAccountId = useMemo(() => {
    if (selectedAccountId) return selectedAccountId
    if (accounts.length === 0) return null

    const firstAccessible =
      accounts.find((account) => account.isUserAccessible !== false) ??
      accounts[0]

    return firstAccessible?.id ?? null
  }, [accounts, selectedAccountId])

  const selectedAccount = useMemo(
    () =>
      accounts.find((account) => account.id === resolvedSelectedAccountId) ??
      null,
    [accounts, resolvedSelectedAccountId],
  )

  const [to, setTo] = useState<string[]>(initialTo)
  const [cc, setCc] = useState<string[]>(initialCc)
  const [bcc, setBcc] = useState<string[]>(initialBcc)
  const [replyTo, setReplyTo] = useState<string[]>(initialReplyTo)
  const [subject, setSubject] = useState<string>(initialSubject)
  const [body, setBody] = useState<string>(initialBody)
  const [attachments, setAttachments] = useState<EmailAttachment[]>([])
  const [lastSendResult, setLastSendResult] =
    useState<DocyrusEmailSendResult | null>(null)

  const reset = useCallback(() => {
    setTo(initialTo)
    setCc(initialCc)
    setBcc(initialBcc)
    setReplyTo(initialReplyTo)
    setSubject(initialSubject)
    setBody(initialBody)
    setAttachments([])
  }, [
    initialTo,
    initialCc,
    initialBcc,
    initialReplyTo,
    initialSubject,
    initialBody,
  ])

  const sendMutation = useMutation<
    DocyrusEmailSendResult,
    Error,
    DocyrusEmailSendOverrides | undefined
  >({
    mutationFn: async (overrides) => {
      const accountId = overrides?.accountId ?? resolvedSelectedAccountId

      if (!accountId) {
        throw new Error('No email account selected')
      }

      const payload: Record<string, unknown> = {
        to: overrides?.to ?? to,
        subject: overrides?.subject ?? subject,
        body: overrides?.body ?? body,
      }

      const finalCc = overrides?.cc ?? cc
      const finalBcc = overrides?.bcc ?? bcc
      const finalReplyTo = overrides?.replyTo ?? replyTo
      const finalAttachments = overrides?.attachments
      const finalSendAsUser = overrides?.sendAsUser ?? defaultSendAsUser

      if (finalCc.length > 0) payload.cc = finalCc
      if (finalBcc.length > 0) payload.bcc = finalBcc
      if (finalReplyTo.length > 0) payload.replyTo = finalReplyTo
      if (typeof finalSendAsUser === 'boolean')
        payload.sendAsUser = finalSendAsUser
      if (finalAttachments && finalAttachments.length > 0)
        payload.attachments = finalAttachments

      const endpoint = sendEndpoint.replace(
        '{accountId}',
        encodeURIComponent(accountId),
      )
      const response = await client.post<
        SendEmailResponse | DocyrusEmailSendResult
      >(endpoint, payload)

      if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        (response as SendEmailResponse).data
      ) {
        return (response as SendEmailResponse).data
      }

      return response as DocyrusEmailSendResult
    },
    onSuccess: (result) => {
      setLastSendResult(result)

      if (resetOnSendSuccess) reset()
    },
  })

  const handleToChange = useCallback((next: string[]) => setTo(next), [])
  const handleCcChange = useCallback((next: string[]) => setCc(next), [])
  const handleBccChange = useCallback((next: string[]) => setBcc(next), [])
  const handleSubjectChange = useCallback(
    (next: string) => setSubject(next),
    [],
  )
  const handleBodyChange = useCallback((next: string) => setBody(next), [])

  const handleSend = useCallback(() => {
    sendMutation.mutate(undefined)
  }, [sendMutation])

  const send = useCallback(
    (overrides?: DocyrusEmailSendOverrides) =>
      sendMutation.mutateAsync(overrides),
    [sendMutation],
  )

  const refetchAccounts = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: ['docyrus-email-accounts', listAccountsEndpoint],
      }),
    [queryClient, listAccountsEndpoint],
  )

  const composerProps = useMemo<Pick<EmailComposerProps, ManagedComposerProps>>(
    () => ({
      accounts,
      selectedAccountId: resolvedSelectedAccountId,
      onSelectedAccountChange: setSelectedAccountId,
      to,
      onToChange: handleToChange,
      cc,
      onCcChange: handleCcChange,
      bcc,
      onBccChange: handleBccChange,
      subject,
      onSubjectChange: handleSubjectChange,
      body,
      onBodyChange: handleBodyChange,
      onSend: handleSend,
      sending: sendMutation.isPending,
    }),
    [
      accounts,
      resolvedSelectedAccountId,
      setSelectedAccountId,
      to,
      handleToChange,
      cc,
      handleCcChange,
      bcc,
      handleBccChange,
      subject,
      handleSubjectChange,
      body,
      handleBodyChange,
      handleSend,
      sendMutation.isPending,
    ],
  )

  return {
    composerProps,
    accounts,
    selectedAccount,
    setSelectedAccountId,
    isLoadingAccounts: accountsQuery.isLoading,
    accountsError: accountsQuery.error,
    refetchAccounts,
    to,
    setTo,
    cc,
    setCc,
    bcc,
    setBcc,
    replyTo,
    setReplyTo,
    subject,
    setSubject,
    body,
    setBody,
    attachments,
    setAttachments,
    send,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
    lastSendResult,
    reset,
  }
}
