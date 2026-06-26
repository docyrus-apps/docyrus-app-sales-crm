'use client';

// @ts-nocheck
/* eslint-disable */
/**
 * DocyThemeProvider — Web theme context for Docyrus UI components.
 *
 * Manages dark/light/system mode via the `dark` class on <html>,
 * persists preference to localStorage, and listens for system changes.
 * No dependency on next-themes — fully self-contained.
 *
 * Colors are handled by CSS variables + Tailwind CSS v4 — no JS color objects needed.
 */

import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeLanguage = 'en' | 'tr';

export type DocyTheme<TBrand = Record<string, string>> = {
  /** Resolved dark mode state */
  isDark: boolean;
  /** Current mode setting */
  mode: ThemeMode;
  /** Set mode (light/dark/system) */
  setMode: (mode: ThemeMode) => void;
  /** Current language */
  lang: ThemeLanguage;
  /** Set language */
  setLang: (lang: ThemeLanguage) => void;
  /** Custom brand data passed from the app */
  brand?: TBrand;
};

const DocyThemeContext = createContext<DocyTheme<any> | undefined>(undefined);

const noopSetMode = () => {};
const noopSetLang = () => {};

const DEFAULT_THEME: DocyTheme<any> = {
  isDark: false,
  mode: 'light',
  setMode: noopSetMode,
  lang: 'en',
  setLang: noopSetLang,
  brand: undefined
};

/**
 * Access the Docy theme context.
 * Returns default light theme when used outside DocyThemeProvider (no crash).
 */
export function useDocyTheme<TBrand = Record<string, string>>(): DocyTheme<TBrand> {
  const context = use(DocyThemeContext);

  if (context === undefined) return DEFAULT_THEME as DocyTheme<TBrand>;

  return context as DocyTheme<TBrand>;
}

export type DocyThemeProviderProps<TBrand = Record<string, string>> = {
  children: ReactNode;
  /** Controlled mode — overrides internal state */
  mode?: ThemeMode;
  /** Default mode when uncontrolled */
  defaultMode?: ThemeMode;
  /** Controlled language */
  lang?: ThemeLanguage;
  /** Default language when uncontrolled */
  defaultLang?: ThemeLanguage;
  /** Custom brand data */
  brand?: TBrand;
  /** localStorage key for persisting mode preference */
  storageKey?: string;
  /** Attribute to set on <html> for dark mode. Default: 'class' */
  attribute?: 'class' | 'data-theme';
};

const STORAGE_KEY_DEFAULT = 'docy-theme-mode';
const STORAGE_KEY_LANG = 'docy-theme-lang';

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredMode(key: string): ThemeMode | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(key);

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
  }

  return null;
}

function getStoredLang(): ThemeLanguage | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_LANG);

    if (stored === 'en' || stored === 'tr') {
      return stored;
    }
  } catch {
  }

  return null;
}

function applyMode(mode: ThemeMode, attribute: 'class' | 'data-theme') {
  if (typeof document === 'undefined') return;

  const isDark = mode === 'dark' || (mode === 'system' && getSystemDark());

  if (attribute === 'class') {
    document.documentElement.classList.toggle('dark', isDark);
  } else {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}

export function DocyThemeProvider<TBrand = Record<string, string>>({
  children,
  mode: controlledMode,
  defaultMode = 'system',
  lang: controlledLang,
  defaultLang = 'en',
  brand,
  storageKey = STORAGE_KEY_DEFAULT,
  attribute = 'class'
}: DocyThemeProviderProps<TBrand>) {
  const [internalMode, setInternalMode] = useState<ThemeMode>(
    () => getStoredMode(storageKey) ?? defaultMode
  );
  const [internalLang, setInternalLang] = useState<ThemeLanguage>(
    () => getStoredLang() ?? defaultLang
  );
  const [systemDark, setSystemDark] = useState(getSystemDark);

  const mode = controlledMode ?? internalMode;
  const lang = controlledLang ?? internalLang;

  useEffect(() => {
    applyMode(mode, attribute);
  }, [mode, systemDark, attribute]);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);

    mql.addEventListener('change', handler);

    return () => mql.removeEventListener('change', handler);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setInternalMode(newMode);

    try {
      localStorage.setItem(storageKey, newMode);
    } catch {
    }
  }, [storageKey]);

  const setLang = useCallback((newLang: ThemeLanguage) => {
    setInternalLang(newLang);

    try {
      localStorage.setItem(STORAGE_KEY_LANG, newLang);
    } catch {
    }
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  const theme: DocyTheme<TBrand> = useMemo(() => ({
    isDark,
    mode,
    setMode,
    lang,
    setLang,
    brand
  }), [
    isDark,
    mode,
    setMode,
    lang,
    setLang,
    brand
  ]);

  return (
    <DocyThemeContext value={theme}>
      {children}
    </DocyThemeContext>
  );
}