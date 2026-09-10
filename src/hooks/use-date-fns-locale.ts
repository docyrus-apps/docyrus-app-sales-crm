import { useMemo } from 'react'

import { useTranslation } from 'react-i18next'
import {
  ar,
  de,
  el,
  enUS,
  es,
  fr,
  it,
  nl,
  pt,
  sl,
  tr,
  type Locale
} from 'date-fns/locale'

/*
 * Date pickers formatted with bare `format(date, 'PPP')` and rendered
 * `<Calendar>` without a locale, so a Turkish form showed "September 8th, 2026"
 * and English weekday headers. Map the active app language onto a date-fns
 * locale so both the trigger label and the calendar grid follow the UI language.
 */
const LOCALES: Record<string, Locale> = {
  ar,
  de,
  el,
  en: enUS,
  es,
  fr,
  it,
  nl,
  pt,
  sl,
  tr
}

export function useDateFnsLocale(): Locale {
  const { i18n } = useTranslation()

  return useMemo(() => {
    const language = i18n.resolvedLanguage ?? i18n.language ?? 'en'

    return LOCALES[language] ?? LOCALES[language.split('-')[0]] ?? enUS
  }, [i18n.resolvedLanguage, i18n.language])
}
