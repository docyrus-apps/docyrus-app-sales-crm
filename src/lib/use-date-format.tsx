'use client'

import { createContext, use, type ReactNode } from 'react'

export type DateFormatFn = (value: unknown) => string

export interface DateFormatContextValue {
  formatDate: DateFormatFn
  formatDateTime: DateFormatFn
  formatTime: DateFormatFn
}

/**
 * Context for date formatting in UI components.
 *
 * Provider-agnostic — works with any date library:
 *
 * ```tsx
 * // date-fns
 * <DateFormatProvider
 *   formatDate={(v) => format(new Date(v), 'dd/MM/yyyy')}
 *   formatDateTime={(v) => format(new Date(v), 'dd/MM/yyyy HH:mm')}
 *   formatTime={(v) => format(new Date(v), 'HH:mm')}
 * />
 *
 * // dayjs
 * <DateFormatProvider
 *   formatDate={(v) => dayjs(v).format('DD/MM/YYYY')}
 *   ...
 * />
 *
 * // No provider → raw string (no formatting applied)
 * ```
 */
export const DateFormatContext = createContext<DateFormatContextValue | null>(
  null,
)

const rawString: DateFormatFn = (value) => {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()

  return String(value)
}

const fallback: DateFormatContextValue = {
  formatDate: rawString,
  formatDateTime: rawString,
  formatTime: rawString,
}

/**
 * Date formatting hook for Docyrus UI components.
 *
 * Reads formatters from `<DateFormatProvider>` when available.
 * Falls back to raw string display when no provider is present.
 *
 * Components can override context formatters via props:
 * `const fmt = props.formatDate ?? contextFormatDate;`
 */
export function useDateFormat(): DateFormatContextValue {
  const ctx = use(DateFormatContext)

  if (!ctx) return fallback

  return ctx
}

interface DateFormatProviderProps {
  formatDate: DateFormatFn
  formatDateTime: DateFormatFn
  formatTime: DateFormatFn
  children: ReactNode
}

/**
 * Bridges any date formatting library into Docyrus UI components.
 *
 * Wrap your app (or a subtree) to provide consistent date formatting:
 *
 * ```tsx
 * <DateFormatProvider
 *   formatDate={(v) => format(new Date(v), 'dd/MM/yyyy')}
 *   formatDateTime={(v) => format(new Date(v), 'dd/MM/yyyy HH:mm')}
 *   formatTime={(v) => format(new Date(v), 'HH:mm')}
 * >
 *   <App />
 * </DateFormatProvider>
 * ```
 */
export function DateFormatProvider({
  formatDate,
  formatDateTime,
  formatTime,
  children,
}: DateFormatProviderProps) {
  return (
    <DateFormatContext value={{ formatDate, formatDateTime, formatTime }}>
      {children}
    </DateFormatContext>
  )
}
