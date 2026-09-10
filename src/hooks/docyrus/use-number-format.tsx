'use client'

// @ts-nocheck
/* eslint-disable */
import { createContext, use, type ReactNode } from 'react'

export interface NumberFormatOptions {
  variant?: 'number' | 'currency' | 'percent'
  currency?: string
  decimalPrecision?: number
  thousandSeparator?: string
}

export type NumberFormatFn = (
  value: unknown,
  options?: NumberFormatOptions,
) => string

export interface NumberFormatContextValue {
  formatNumber: NumberFormatFn
}

const NumberFormatContext = createContext<NumberFormatContextValue | null>(null)

const rawNumber: NumberFormatFn = (value) => {
  if (value == null || value === '') return ''

  return String(value)
}

const DEFAULT_NUMBER_FORMAT: NumberFormatContextValue = {
  formatNumber: rawNumber,
}

/**
 * Number formatting hook for Docyrus UI components.
 *
 * Reads `formatNumber` from `<NumberFormatProvider>` (typically installed
 * by `<DocyrusTenantProvider>`). Falls back to a raw `String(value)`
 * renderer when no provider is present.
 */
export function useNumberFormat(): NumberFormatContextValue {
  const ctx = use(NumberFormatContext)

  if (!ctx) return DEFAULT_NUMBER_FORMAT

  return ctx
}

/**
 * Tell whether the returned `useNumberFormat()` value is the built-in
 * no-provider fallback versus a real provider. Used by data-grid /
 * data-table hooks so they don't shadow the cell's own locale-aware
 * `Intl.NumberFormat` fallback when no provider is installed yet.
 */
export function isDefaultNumberFormatContext(
  ctx: NumberFormatContextValue,
): boolean {
  return ctx === DEFAULT_NUMBER_FORMAT
}

interface NumberFormatProviderProps {
  formatNumber: NumberFormatFn
  children: ReactNode
}

/**
 * Bridges any number formatting library (or `@docyrus/app-utils`'s
 * `createNumberUtils`) into Docyrus UI components. Wrap your app (or a
 * subtree) so cells / charts / value renderers pick up tenant-aware
 * formatting via `useNumberFormat()`.
 */
export function NumberFormatProvider({
  formatNumber,
  children,
}: NumberFormatProviderProps) {
  return (
    <NumberFormatContext value={{ formatNumber }}>
      {children}
    </NumberFormatContext>
  )
}
