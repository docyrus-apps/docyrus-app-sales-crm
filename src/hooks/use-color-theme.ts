import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_COLOR_THEME } from '@/lib/themes'

const STORAGE_KEY = 'app-color-theme'

function applyColorTheme(theme: string) {
  if (theme === DEFAULT_COLOR_THEME) {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLOR_THEME
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_COLOR_THEME
  })

  const setColorTheme = useCallback((newTheme: string) => {
    setColorThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyColorTheme(newTheme)
  }, [])

  useEffect(() => {
    applyColorTheme(colorTheme)
  }, [colorTheme])

  return { colorTheme, setColorTheme }
}
