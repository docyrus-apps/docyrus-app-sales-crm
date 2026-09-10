'use client'

// @ts-nocheck
/* eslint-disable */
import {
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type Ref,
} from 'react'

import { CropperSource, mergeRefs } from 'react-advanced-cropper'

import { cn } from '@/lib/utils'

interface AdjustableImageProps {
  ref?: Ref<HTMLCanvasElement>
  src?: string
  className?: string
  crossOrigin?: 'anonymous' | 'use-credentials' | boolean
  brightness?: number
  saturation?: number
  hue?: number
  contrast?: number
  style?: CSSProperties
}

function buildFilterString(
  brightness: number,
  saturation: number,
  hue: number,
  contrast: number,
): string {
  return [
    `brightness(${100 + brightness * 100}%)`,
    `contrast(${100 + contrast * 100}%)`,
    `saturate(${100 + saturation * 100}%)`,
    `hue-rotate(${hue * 360}deg)`,
  ].join(' ')
}

function AdjustableImage({
  src,
  className,
  crossOrigin,
  brightness = 0,
  saturation = 0,
  hue = 0,
  contrast = 0,
  style,
  ref,
}: AdjustableImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawImage = useCallback(() => {
    const image = imageRef.current
    const canvas = canvasRef.current

    if (canvas && image && image.complete) {
      const ctx = canvas.getContext('2d')

      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      if (ctx) {
        ctx.filter = buildFilterString(brightness, saturation, hue, contrast)
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)
      }
    }
  }, [brightness, saturation, hue, contrast])

  useLayoutEffect(() => {
    drawImage()
  }, [src, drawImage])

  return (
    <>
      <canvas
        key={`${src}-canvas`}
        ref={
          mergeRefs([ref ?? null, canvasRef] as Parameters<
            typeof mergeRefs
          >[0]) as Ref<HTMLCanvasElement>
        }
        className={cn('block', className)}
        style={style}
      />
      <CropperSource
        key={`${src}-img`}
        ref={imageRef}
        className="hidden"
        src={src}
        crossOrigin={crossOrigin}
        onLoad={drawImage}
      />
    </>
  )
}

export { AdjustableImage }
export type { AdjustableImageProps }
