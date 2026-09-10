// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardHostConfig,
  type AdaptiveCardHostConfigOverride,
} from '../adaptive-card-types'

export const defaultHostConfig: AdaptiveCardHostConfig = {
  supportsInteractivity: true,
  hostCapabilities: { adaptiveCards: '1.5' },
  colors: {
    default: { default: 'currentColor', subtle: 'currentColor' },
    accent: { default: 'var(--primary)', subtle: 'var(--primary)' },
    good: { default: 'rgb(5 150 105)', subtle: 'rgb(16 185 129)' },
    warning: { default: 'rgb(217 119 6)', subtle: 'rgb(245 158 11)' },
    attention: { default: 'var(--destructive)', subtle: 'var(--destructive)' },
    dark: { default: 'var(--foreground)', subtle: 'var(--muted-foreground)' },
    light: {
      default: 'var(--muted-foreground)',
      subtle: 'var(--muted-foreground)',
    },
  },
  spacing: {
    none: 0,
    small: 4,
    default: 8,
    medium: 16,
    large: 24,
    extraLarge: 32,
    padding: 12,
  },
  imageSizes: {
    small: 40,
    medium: 80,
    large: 160,
  },
  fontSizes: {
    small: 12,
    default: 14,
    medium: 16,
    large: 20,
    extraLarge: 28,
  },
  fontWeights: {
    lighter: 200,
    default: 400,
    bolder: 700,
  },
  containerStyles: {
    default: {
      bg: 'var(--background)',
      fg: 'var(--foreground)',
      borderColor: 'var(--border)',
    },
    emphasis: {
      bg: 'var(--muted)',
      fg: 'var(--foreground)',
      borderColor: 'var(--border)',
    },
    good: {
      bg: 'rgb(16 185 129 / 0.1)',
      fg: 'rgb(5 150 105)',
      borderColor: 'rgb(16 185 129 / 0.2)',
    },
    attention: {
      bg: 'var(--destructive) / 0.1',
      fg: 'var(--destructive)',
      borderColor: 'var(--destructive) / 0.2',
    },
    warning: {
      bg: 'rgb(245 158 11 / 0.1)',
      fg: 'rgb(217 119 6)',
      borderColor: 'rgb(245 158 11 / 0.2)',
    },
    accent: {
      bg: 'var(--primary) / 0.1',
      fg: 'var(--primary)',
      borderColor: 'var(--primary) / 0.2',
    },
  },
  actions: {
    maxActions: 5,
    actionsOrientation: 'horizontal',
    buttonSpacing: 8,
    showCard: {
      actionMode: 'inline',
      inlineTopMargin: 16,
      style: 'emphasis',
    },
  },
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value == null) return false
  if (Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)

  return proto === Object.prototype || proto === null
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value)
    } else if (value !== undefined) {
      result[key] = value
    }
  }

  return result as T
}

export function mergeHostConfig(
  base: AdaptiveCardHostConfig,
  override: AdaptiveCardHostConfigOverride | undefined,
): AdaptiveCardHostConfig {
  if (!override) return base

  return deepMerge(
    base as unknown as Record<string, unknown>,
    override as Record<string, unknown>,
  ) as unknown as AdaptiveCardHostConfig
}
