// @ts-nocheck
/* eslint-disable */
import de from '../locales/de.json'
import en from '../locales/en.json'
import fr from '../locales/fr.json'
import nl from '../locales/nl.json'
import zh_CN from '../locales/zh-CN.json'
import zh_TW from '../locales/zh-TW.json'

export type Locale = 'en' | 'fr' | 'nl' | 'zh_CN' | 'zh_TW' | 'de'

type Translations = Record<string, string>

const translations: Record<Locale, Translations> = {
  en,
  fr,
  zh_CN,
  zh_TW,
  nl,
  de,
}

export function t(key: string, locale: Locale): string {
  /*
   * Fall back to English when a locale doesn't have the key — exposing the
   * raw key (e.g. "filters.date.today") to the user is worse than showing
   * an English label.
   */
  return translations[locale][key] ?? translations.en[key] ?? key
}
