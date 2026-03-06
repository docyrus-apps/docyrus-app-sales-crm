'use client'

import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react'

import { MentionElement } from '@/components/editor/ui/mention-node'
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit'

import { PostMentionInputElement } from './post-mention-input'

export const PostEditorKit = [
  ...BasicMarksKit,
  MentionPlugin.configure({
    options: {
      triggerPreviousCharPattern: /^$|^[\s"']$/,
    },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(PostMentionInputElement),
]
