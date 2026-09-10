// @ts-nocheck
/* eslint-disable */
import { type AdaptiveCardSpacing } from '../adaptive-card-types'

/*
 * Adaptive Cards spacing enums map to Tailwind margin-top utility classes.
 * Tailwind cannot resolve dynamic class names at build time, so the values
 * must appear as full literal strings in source.
 */
export const SPACING_MARGIN_TOP: Record<AdaptiveCardSpacing, string> = {
  none: 'mt-0',
  small: 'mt-1',
  default: 'mt-2',
  medium: 'mt-4',
  large: 'mt-6',
  extraLarge: 'mt-8',
  padding: 'mt-3',
}

export function getSpacingMarginTop(
  spacing: AdaptiveCardSpacing | undefined,
): string {
  return SPACING_MARGIN_TOP[spacing ?? 'default']
}

export const PADDING_CLASS = 'p-3'
