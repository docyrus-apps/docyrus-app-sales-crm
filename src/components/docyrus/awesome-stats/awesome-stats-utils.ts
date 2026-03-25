'use client';

import { type CSSProperties } from 'react';

import { resolveColorHex } from '@/lib/tailwind-colors';

import {
  type AwesomeStatComparison,
  type AwesomeStatComparisonPeriod,
  type AwesomeStatMiniChart,
  type AwesomeStatValueFormat
} from './types';

const DEFAULT_ACCENT_COLOR = 'hsl(var(--primary))';

const PERIOD_LABELS: Record<AwesomeStatComparisonPeriod, string> = {
  yesterday: 'yesterday',
  'last-week': 'last week',
  'last-month': 'last month',
  'last-quarter': 'last quarter',
  'last-year': 'last year'
};

export type AwesomeStatsComparisonViewModel = {
  caption: string;
  deltaLabel: string;
  percentageLabel: string | null;
  direction: 'up' | 'down' | 'neutral';
  tone: 'positive' | 'negative' | 'neutral';
};

export function resolveAccentColor(color?: string): string {
  if (!color) return DEFAULT_ACCENT_COLOR;

  return resolveColorHex(color);
}

export function getAccentStyles(color?: string): CSSProperties {
  const accentColor = resolveAccentColor(color);

  return {
    color: accentColor,
    backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
    borderColor: `color-mix(in srgb, ${accentColor} 24%, transparent)`
  };
}

export function normalizeChartData(
  miniChart: AwesomeStatMiniChart
): Array<Record<string, unknown>> {
  const dataKey = miniChart.dataKey ?? 'value';

  return miniChart.data.map((item, index) => {
    if (typeof item === 'number') {
      return {
        _idx: index,
        [dataKey]: item
      };
    }

    return {
      _idx: index,
      ...item
    };
  });
}

function getNumberFormatOptions(
  format?: AwesomeStatValueFormat,
  signDisplay?: Intl.NumberFormatOptions['signDisplay']
): Intl.NumberFormatOptions {
  const style = format?.style ?? 'number';
  const resolvedStyle = style === 'number' ? undefined : style;

  return {
    style: resolvedStyle,
    notation: format?.notation,
    minimumFractionDigits: format?.minimumFractionDigits,
    maximumFractionDigits: format?.maximumFractionDigits,
    currency: style === 'currency' ? (format?.currency ?? 'USD') : undefined,
    currencyDisplay: style === 'currency' ? (format?.currencyDisplay ?? 'symbol') : undefined,
    signDisplay: signDisplay ?? format?.signDisplay
  };
}

function normalizeFormatValue(
  value: number,
  format?: AwesomeStatValueFormat
): number {
  if (format?.style === 'percent' && (format.percentScale ?? 'whole') === 'whole') {
    return value / 100;
  }

  return value;
}

export function formatStatValue(
  value: number,
  format?: AwesomeStatValueFormat,
  signDisplay?: Intl.NumberFormatOptions['signDisplay']
): string {
  const normalizedValue = normalizeFormatValue(value, format);

  try {
    return new Intl.NumberFormat(
      format?.locale,
      getNumberFormatOptions(format, signDisplay)
    ).format(normalizedValue);
  } catch {
    return normalizedValue.toString();
  }
}

function formatComparisonPercent(percentageChange: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    signDisplay: 'always',
    maximumFractionDigits: 1
  }).format(percentageChange / 100);
}

export function getComparisonViewModel(
  value: number,
  comparison: AwesomeStatComparison,
  format?: AwesomeStatValueFormat
): AwesomeStatsComparisonViewModel {
  const delta = value - comparison.previousValue;
  const direction
    = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
  const tone = direction === 'neutral' ? 'neutral' : comparison.positiveDirection === 'down' ? (direction === 'down' ? 'positive' : 'negative') : (direction === 'up' ? 'positive' : 'negative');

  if (direction === 'neutral') {
    return {
      caption: `No change vs ${PERIOD_LABELS[comparison.period]}`,
      deltaLabel: 'No change',
      percentageLabel: null,
      direction,
      tone
    };
  }

  const deltaLabel = formatStatValue(delta, format, 'always');
  const percentageChange
    = comparison.previousValue === 0 ? null : ((value - comparison.previousValue) / Math.abs(comparison.previousValue)) * 100;
  const percentageLabel
    = percentageChange === null ? null : formatComparisonPercent(percentageChange);
  const caption = [deltaLabel, percentageLabel ? `(${percentageLabel})` : null, `vs ${PERIOD_LABELS[comparison.period]}`]
    .filter(Boolean)
    .join(' ');

  return {
    caption,
    deltaLabel,
    percentageLabel,
    direction,
    tone
  };
}