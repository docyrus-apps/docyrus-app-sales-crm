'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardActionSetElement } from '../adaptive-card-types'

import { ActionBar } from '../action-bar'

export function ActionSetElement({
  element,
}: {
  element: AdaptiveCardActionSetElement
}) {
  return <ActionBar actions={element.actions} variant="inline" />
}
