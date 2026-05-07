'use client'

import { createContext, use, type ReactNode } from 'react'

export type TranslateFn = (key: string, fallback: string) => string

/**
 * Context for UI component translations.
 *
 * Provider-agnostic — works with any i18n library:
 *
 * ```tsx
 * // @docyrus/i18n
 * const { t } = useDocyrusI18n();
 * <UiTranslationProvider t={t}> ... </UiTranslationProvider>
 *
 * // react-i18next
 * const { t } = useTranslation();
 * <UiTranslationProvider t={t}> ... </UiTranslationProvider>
 *
 * // No provider → English fallback (no crash)
 * ```
 */
export const UiTranslationContext = createContext<{ t: TranslateFn } | null>(
  null,
)

const fallbackT: TranslateFn = (_key, fallback) => fallback

/**
 * Safe i18n hook for Docyrus UI components.
 *
 * Reads translations from `<UiTranslationProvider>` when available.
 * Falls back to English (the `fallback` parameter) when no provider is present.
 *
 * Usage: `const { t } = useUiTranslation();`
 * Then:  `t('ui.calendar.addEvent', 'Add Event')`
 */
export function useUiTranslation(): { t: TranslateFn } {
  const ctx = use(UiTranslationContext)

  if (!ctx) return { t: fallbackT }

  return ctx
}

interface UiTranslationProviderProps {
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
  ) => string
  children: ReactNode
}

/**
 * Bridges any i18n provider to Docyrus UI components.
 *
 * Wrap your app with this provider and pass any `t` function.
 * Components will use it for translations, falling back to English when absent.
 */
export function UiTranslationProvider({
  t,
  children,
}: UiTranslationProviderProps) {
  const value = { t: (key: string, fallback: string) => t(key, fallback) }

  return <UiTranslationContext value={value}>{children}</UiTranslationContext>
}
