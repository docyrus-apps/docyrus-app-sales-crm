'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardActionOpenUrl } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ActionButton } from './action-button'

export function ActionOpenUrlButton({
  action,
}: {
  action: AdaptiveCardActionOpenUrl
}) {
  const ctx = useAdaptiveCardContext()

  return (
    <ActionButton action={action} onClick={() => ctx.openUrl(action)} asChild>
      <a href={action.url} target="_blank" rel="noopener noreferrer">
        {action.iconUrl ? (
          <img
            src={action.iconUrl}
            alt=""
            aria-hidden="true"
            className="mr-1 size-4"
          />
        ) : null}
        <span>{action.title ?? 'Open'}</span>
      </a>
    </ActionButton>
  )
}
