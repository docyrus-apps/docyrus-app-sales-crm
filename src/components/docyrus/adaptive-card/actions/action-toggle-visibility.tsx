'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardActionToggleVisibility } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ActionButton } from './action-button'

export function ActionToggleVisibilityButton({
  action,
}: {
  action: AdaptiveCardActionToggleVisibility
}) {
  const ctx = useAdaptiveCardContext()

  return (
    <ActionButton
      action={action}
      onClick={() => ctx.toggleVisibility(action)}
    />
  )
}
