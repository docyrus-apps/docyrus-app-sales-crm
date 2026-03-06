'use client'

import { createContext, useContext } from 'react'

import { type MentionUser } from '@/components/docyrus/team-chat-channel/types'

import { type EmailAttachment } from './types'

export interface LogActivityFormContextValue {
  mentionUsers: Array<MentionUser>
  emailAttachments?: Array<EmailAttachment>
  onAttach?: () => void
  onRemoveAttachment?: (index: number) => void
}

const LogActivityFormContext =
  createContext<LogActivityFormContextValue | null>(null)

export const LogActivityFormProvider = LogActivityFormContext.Provider

export function useLogActivityFormContext(): LogActivityFormContextValue {
  const ctx = useContext(LogActivityFormContext)

  if (!ctx) {
    throw new Error(
      'useLogActivityFormContext must be used within a LogActivityFormProvider',
    )
  }

  return ctx
}
