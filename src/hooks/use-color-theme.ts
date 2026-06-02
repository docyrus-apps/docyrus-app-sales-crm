import { useTheme } from '@docyrus/theme-provider'

export function useColorTheme() {
  const { colorTheme, setColorTheme } = useTheme()
  return { colorTheme, setColorTheme }
}
