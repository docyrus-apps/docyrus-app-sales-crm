// @docyrus: [[architecture#Localization (i18n)]]
import { useMemo } from 'react'

import { type UiI18nLocale } from '@/lib/ui-i18n'

import { useTranslation } from 'react-i18next'

import { UI_I18N_LOCALES } from '@/lib/ui-i18n'

/**
 * Resolves the active app language (react-i18next) to a Docyrus UI locale
 * (`UiI18nLocale`) for passing into Docyrus UI components via their `locale`
 * prop. Returns `undefined` when the active language is not a supported UI
 * locale, so those components fall back to their own default ('en').
 */
export function useUiLocale(): UiI18nLocale | undefined {
  const { i18n } = useTranslation()

  return useMemo(() => {
    const language = i18n.resolvedLanguage?.split('-')[0]

    if (language && UI_I18N_LOCALES.includes(language as UiI18nLocale)) {
      return language as UiI18nLocale
    }

    return undefined
  }, [i18n.resolvedLanguage])
}
