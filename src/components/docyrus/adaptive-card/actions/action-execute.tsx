'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardActionExecute } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ActionButton } from './action-button'

export function ActionExecuteButton({
  action,
}: {
  action: AdaptiveCardActionExecute
}) {
  const ctx = useAdaptiveCardContext()

  return <ActionButton action={action} onClick={() => ctx.execute(action)} />
}
