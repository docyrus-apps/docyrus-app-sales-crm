'use client'

import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react'

import { MentionElement } from '@/components/editor/ui/mention-node'
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit'
import { ListKit } from '@/components/editor/plugins/list-kit'

import { LogActivityMentionInputElement } from './log-activity-mention-input'

export const LogActivityEditorKit = [
  ...BasicMarksKit,
  ...ListKit,
  MentionPlugin.configure({
    options: {
      triggerPreviousCharPattern: /^$|^[\s"']$/,
    },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(LogActivityMentionInputElement),
]
