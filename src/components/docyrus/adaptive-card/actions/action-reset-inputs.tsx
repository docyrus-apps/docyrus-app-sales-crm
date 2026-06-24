'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardActionResetInputs } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ActionButton } from './action-button'

export function ActionResetInputsButton({
  action,
}: {
  action: AdaptiveCardActionResetInputs
}) {
  const ctx = useAdaptiveCardContext()

  return (
    <ActionButton action={action} onClick={() => ctx.resetInputs(action)} />
  )
}
