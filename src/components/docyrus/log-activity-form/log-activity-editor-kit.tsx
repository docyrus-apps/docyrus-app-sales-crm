'use client'

import { ListKit } from '@/components/editor/plugins/list-kit'

import { MentionEditorKit } from '@/lib/editor-mention'

export const LogActivityEditorKit = [...MentionEditorKit, ...ListKit]
