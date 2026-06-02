import { useTheme } from '@docyrus/theme-provider'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeLanguage = 'en' | 'tr'

export type DocyTheme = {
  isDark: boolean
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

/**
 * Thin adapter over @docyrus/theme-provider for components that need isDark.
 */
export function useDocyTheme(): DocyTheme {
  const { resolvedTheme, theme, setTheme } = useTheme()

  return {
    isDark: resolvedTheme === 'dark',
    mode: (theme as ThemeMode) ?? 'system',
    setMode: setTheme as (mode: ThemeMode) => void,
  }
}
