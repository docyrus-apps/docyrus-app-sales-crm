'use client'

// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardImageSet } from '../adaptive-card-types'

import { ImageElement } from './image-element'

export function ImageSetElement({
  element,
}: {
  element: AdaptiveCardImageSet
}) {
  const imageSize = element.imageSize ?? 'medium'

  return (
    <div className="flex flex-wrap gap-2">
      {element.images.map((image, index) => (
        <ImageElement
          key={image.id ?? `img-${index}`}
          element={{ ...image, size: image.size ?? imageSize }}
        />
      ))}
    </div>
  )
}
