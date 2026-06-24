import type { ReactNode } from 'react'

import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocyrusAuthProvider } from '@docyrus/signin'

import App from './App.tsx'

vi.mock('@docyrus/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: () => undefined,
    colorTheme: 'docyrus-default',
    setColorTheme: () => undefined,
    availableThemes: []
  })
}))

vi.mock('./components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('./components/shared/command-palette', () => ({
  CommandPalette: () => null
}))

vi.mock('./components/deals/deal-form-dialog', () => ({
  DealFormDialog: () => null
}))

vi.mock('./components/leads/lead-form-dialog', () => ({
  LeadFormDialog: () => null
}))

vi.mock('./components/tasks/task-form-sheet', () => ({
  TaskFormSheet: () => null
}))

vi.mock('./components/events/event-form-dialog', () => ({
  EventFormDialog: () => null
}))

vi.mock('./components/docyrus/awesome-dialog', () => ({
  GlobalDialogBar: () => null
}))

vi.mock('./components/dialer/dialer-widget', () => ({
  DialerProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('./components/webphone/webphone-context', () => ({
  WebphoneProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('./components/webphone/webphone-widget', () => ({
  WebphoneWidget: () => null
}))

vi.mock('./lib/docyrus-date-format-provider', () => ({
  DocyrusDateFormatProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  )
}))

vi.mock('./lib/use-ui-translation', () => ({
  UiTranslationProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  )
}))

vi.mock('./hooks/docyrus/use-ui-translation', () => ({
  UiTranslationProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  )
}))

describe('App', () => {
  test('renders login form when not authenticated', async () => {
    render(
      <DocyrusAuthProvider>
        <App />
      </DocyrusAuthProvider>
    )
    expect(await screen.findByRole('button')).toBeDefined()
  })
})
