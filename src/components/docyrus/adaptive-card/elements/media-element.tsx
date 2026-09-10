'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { type AdaptiveCardMedia } from '../adaptive-card-types'

function isAudio(mimeType: string | undefined): boolean {
  if (!mimeType) return false

  return mimeType.startsWith('audio/')
}

export function MediaElement({ element }: { element: AdaptiveCardMedia }) {
  const sources = element.sources ?? []

  if (sources.length === 0) {
    return null
  }

  const audio = sources.every((s) => isAudio(s.mimeType))

  if (audio) {
    return (
      <audio controls aria-label={element.altText} className="w-full">
        {sources.map((source) => (
          <source
            key={`${source.url}-${source.mimeType}`}
            src={source.url}
            type={source.mimeType}
          />
        ))}
        {(element.captionSources ?? []).map((track) => (
          <track
            key={`${track.url}-${track.label ?? ''}`}
            kind="captions"
            src={track.url}
            label={track.label}
            srcLang="en"
          />
        ))}
      </audio>
    )
  }

  return (
    <video
      controls
      poster={element.poster}
      aria-label={element.altText}
      className={cn('w-full rounded-md bg-black')}
    >
      {sources.map((source) => (
        <source
          key={`${source.url}-${source.mimeType}`}
          src={source.url}
          type={source.mimeType}
        />
      ))}
      {(element.captionSources ?? []).map((track) => (
        <track
          key={`${track.url}-${track.label ?? ''}`}
          kind="captions"
          src={track.url}
          label={track.label}
          srcLang="en"
        />
      ))}
    </video>
  )
}
