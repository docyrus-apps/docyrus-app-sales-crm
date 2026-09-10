// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardChartColor,
  type AdaptiveCardChartColorSet,
} from '../adaptive-card-types'

/*
 * Fluent UI chart palette translated to hex literals so recharts can render
 * without needing the full Fluent runtime. The categorical palette mirrors
 * the official Adaptive Cards Designer.
 */

const NAMED_COLORS: Record<string, string> = {
  categoricalBlue: '#0078D4',
  categoricalGreen: '#107C10',
  categoricalOrange: '#D83B01',
  categoricalPurple: '#5C2D91',
  categoricalRed: '#A4262C',
  categoricalTeal: '#00B7C3',
  categoricalYellow: '#FFB900',
  good: '#107C10',
  warning: '#D29200',
  attention: '#A4262C',
  neutral: '#605E5C',
}

const CATEGORICAL_PALETTE: Array<string> = [
  '#0078D4',
  '#107C10',
  '#D83B01',
  '#5C2D91',
  '#FFB900',
  '#00B7C3',
  '#A4262C',
  '#8764B8',
  '#038387',
  '#498205',
]

const SEQUENTIAL_PALETTE: Array<string> = [
  '#DEECF9',
  '#C7E0F4',
  '#A0C9EE',
  '#71AFE5',
  '#3B92DC',
  '#0078D4',
  '#106EBE',
  '#005A9E',
  '#004578',
  '#002A4B',
]

const DIVERGENT_PALETTE: Array<string> = [
  '#A4262C',
  '#D83B01',
  '#D29200',
  '#FFB900',
  '#E5E5E5',
  '#A0C9EE',
  '#3B92DC',
  '#0078D4',
  '#005A9E',
  '#002A4B',
]

export function resolveColor(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.startsWith('#')) return value

  return NAMED_COLORS[value]
}

export function resolvePalette(
  colorSet: AdaptiveCardChartColorSet | undefined,
): Array<string> {
  if (colorSet === 'sequential') return SEQUENTIAL_PALETTE
  if (colorSet === 'divergent') return DIVERGENT_PALETTE

  return CATEGORICAL_PALETTE
}

export function pickColor(
  index: number,
  explicit: AdaptiveCardChartColor | undefined,
  colorSet: AdaptiveCardChartColorSet | undefined,
): string {
  if (explicit) {
    const resolved = resolveColor(explicit)

    if (resolved) return resolved
  }

  const palette = resolvePalette(colorSet)

  return palette[index % palette.length] ?? '#0078D4'
}
