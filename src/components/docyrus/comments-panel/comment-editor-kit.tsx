'use client'

import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react'

import { MentionElement } from '@/components/editor/ui/mention-node'
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit'

import { CommentMentionInputElement } from './comment-mention-input'

export const CommentEditorKit = [
  ...BasicMarksKit,
  MentionPlugin.configure({
    options: {
      triggerPreviousCharPattern: /^$|^[\s"']$/,
    },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(CommentMentionInputElement),
]
