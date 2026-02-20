import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocyrusAuthProvider } from '@docyrus/signin'
import App from './App.tsx'

describe('App', () => {
  test('renders login form when not authenticated', async () => {
    render(
      <DocyrusAuthProvider>
        <App />
      </DocyrusAuthProvider>,
    )
    expect(await screen.findByText('Welcome')).toBeDefined()
  })
})
