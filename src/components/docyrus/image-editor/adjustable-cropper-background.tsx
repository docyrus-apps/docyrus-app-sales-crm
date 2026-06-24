'use client'

// @ts-nocheck
/* eslint-disable */
import { type Ref } from 'react'

import {
  type CropperImage,
  type CropperState,
  type CropperTransitions,
} from 'react-advanced-cropper'

import { getBackgroundStyle } from 'advanced-cropper'

import { AdjustableImage } from './adjustable-image'

interface CropperRef {
  getState: () => CropperState
  getTransitions: () => CropperTransitions
  getImage: () => CropperImage
}

interface AdjustableCropperBackgroundProps {
  ref?: Ref<HTMLCanvasElement>
  className?: string
  cropper: CropperRef
  crossOrigin?: 'anonymous' | 'use-credentials' | boolean
  brightness?: number
  saturation?: number
  hue?: number
  contrast?: number
}

function AdjustableCropperBackground({
  className,
  cropper,
  crossOrigin,
  brightness = 0,
  saturation = 0,
  hue = 0,
  contrast = 0,
  ref,
}: AdjustableCropperBackgroundProps) {
  const state = cropper.getState()
  const transitions = cropper.getTransitions()
  const image = cropper.getImage()

  const style =
    image && state ? getBackgroundStyle(image, state, transitions) : {}

  return (
    <AdjustableImage
      src={image?.src}
      crossOrigin={crossOrigin}
      brightness={brightness}
      saturation={saturation}
      hue={hue}
      contrast={contrast}
      ref={ref}
      className={className}
      style={style}
    />
  )
}

export { AdjustableCropperBackground }
