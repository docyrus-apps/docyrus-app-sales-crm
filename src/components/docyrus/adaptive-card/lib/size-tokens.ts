// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardFontSize,
  type AdaptiveCardFontType,
  type AdaptiveCardFontWeight,
  type AdaptiveCardHorizontalAlignment,
  type AdaptiveCardImageSize,
  type AdaptiveCardVerticalAlignment,
} from '../adaptive-card-types'

export const FONT_SIZE_CLASS: Record<AdaptiveCardFontSize, string> = {
  small: 'text-xs',
  default: 'text-sm',
  medium: 'text-base',
  large: 'text-xl',
  extraLarge: 'text-3xl',
}

export const FONT_WEIGHT_CLASS: Record<AdaptiveCardFontWeight, string> = {
  lighter: 'font-light',
  default: 'font-normal',
  bolder: 'font-semibold',
}

export const FONT_TYPE_CLASS: Record<AdaptiveCardFontType, string> = {
  default: '',
  monospace: 'font-mono',
}

export const HORIZONTAL_ALIGN_CLASS: Record<
  AdaptiveCardHorizontalAlignment,
  string
> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export const HORIZONTAL_FLEX_CLASS: Record<
  AdaptiveCardHorizontalAlignment,
  string
> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

export const VERTICAL_FLEX_CLASS: Record<
  AdaptiveCardVerticalAlignment,
  string
> = {
  top: 'justify-start',
  center: 'justify-center',
  bottom: 'justify-end',
}

export const LINE_CLAMP_CLASS: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

export function getLineClampClass(maxLines: number | undefined): string {
  if (!maxLines || maxLines < 1) return ''

  return LINE_CLAMP_CLASS[maxLines] ?? 'line-clamp-6'
}

export function getHeadingTag(
  size: AdaptiveCardFontSize | undefined,
): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  switch (size) {
    case 'extraLarge':
      return 'h1'

    case 'large':
      return 'h2'

    case 'medium':
      return 'h3'

    case 'small':
      return 'h5'

    default:
      return 'h4'
  }
}

export const IMAGE_SIZE_PX: Record<AdaptiveCardImageSize, number | null> = {
  auto: null,
  stretch: null,
  small: 40,
  medium: 80,
  large: 160,
}

export function resolveImageDimension(
  size: AdaptiveCardImageSize | undefined,
  width: string | undefined,
  height: string | undefined,
): { width?: string; height?: string; className: string } {
  if (width || height) {
    return { width, height, className: '' }
  }

  const resolved = IMAGE_SIZE_PX[size ?? 'auto']

  if (resolved == null) {
    if (size === 'stretch') {
      return { className: 'w-full' }
    }

    return { className: '' }
  }

  return {
    width: `${resolved}px`,
    height: `${resolved}px`,
    className: '',
  }
}
