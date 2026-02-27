import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import tr from './locales/tr.json'
import it from './locales/it.json'
import es from './locales/es.json'
import nl from './locales/nl.json'
import pt from './locales/pt.json'
import sl from './locales/sl.json'
import el from './locales/el.json'
import ar from './locales/ar.json'

const RTL_LANGUAGES = ['ar']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      tr: { translation: tr },
      it: { translation: it },
      es: { translation: es },
      nl: { translation: nl },
      pt: { translation: pt },
      sl: { translation: sl },
      el: { translation: el },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: [
      'en',
      'de',
      'fr',
      'tr',
      'it',
      'es',
      'nl',
      'pt',
      'sl',
      'el',
      'ar',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

// Update document direction and lang attribute for RTL/LTR support
i18n.on('languageChanged', (lng) => {
  const isRTL = RTL_LANGUAGES.includes(lng)
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
})

// Apply direction for the initially detected language
const initialLng = i18n.language ?? 'en'
document.documentElement.dir = RTL_LANGUAGES.includes(initialLng)
  ? 'rtl'
  : 'ltr'
document.documentElement.lang = initialLng

export default i18n
