'use client'

import { forwardRef } from 'react'

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
  className?: string
  cropper: CropperRef
  crossOrigin?: 'anonymous' | 'use-credentials' | boolean
  brightness?: number
  saturation?: number
  hue?: number
  contrast?: number
}

const AdjustableCropperBackground = forwardRef<
  HTMLCanvasElement,
  AdjustableCropperBackgroundProps
>(
  (
    {
      className,
      cropper,
      crossOrigin,
      brightness = 0,
      saturation = 0,
      hue = 0,
      contrast = 0,
    },
    ref,
  ) => {
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
  },
)

AdjustableCropperBackground.displayName = 'AdjustableCropperBackground'

export { AdjustableCropperBackground }
