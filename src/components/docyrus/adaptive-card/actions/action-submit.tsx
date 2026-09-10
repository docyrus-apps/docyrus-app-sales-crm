'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardActionSubmit } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ActionButton } from './action-button'

export function ActionSubmitButton({
  action,
}: {
  action: AdaptiveCardActionSubmit
}) {
  const ctx = useAdaptiveCardContext()

  return <ActionButton action={action} onClick={() => ctx.submit(action)} />
}
