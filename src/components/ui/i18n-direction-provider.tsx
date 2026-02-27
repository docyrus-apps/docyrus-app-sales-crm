import { useTranslation } from 'react-i18next'
import { DirectionProvider } from '@/components/ui/direction'

const RTL_LANGUAGES = ['ar']

export function I18nDirectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { i18n } = useTranslation()
  const dir = RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr'

  return <DirectionProvider dir={dir}>{children}</DirectionProvider>
}
