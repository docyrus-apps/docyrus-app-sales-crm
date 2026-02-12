import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Agentation } from 'agentation'
import {
  SignInButton,
  useDocyrusAuth,
  useDocyrusClient,
} from '@docyrus/app-auth-ui'
import { Button } from './components/ui/button'
import { setApiClient } from './lib/api'
import { AppLayout } from './components/layout/app-layout'
import { Toaster } from './components/ui/sonner'

function App() {
  const { status } = useDocyrusAuth()
  const client = useDocyrusClient()

  // Sync the library's API client to the module-level apiClient used by collections
  useEffect(() => {
    if (client) {
      setApiClient(client)
    }
  }, [client])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Sales CRM</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Sign in to access your account
                </p>
              </div>
              <div className="grid gap-6">
                <SignInButton>
                  {({ signIn, status: btnStatus }) => (
                    <Button
                      onClick={signIn}
                      className="w-full"
                      disabled={btnStatus === 'loading'}
                      size="lg"
                    >
                      {btnStatus === 'loading'
                        ? 'Redirecting...'
                        : 'Sign in with Docyrus'}
                    </Button>
                  )}
                </SignInButton>
              </div>
            </div>
          </div>
        </div>
        {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
      </>
    )
  }

  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Toaster />
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </>
  )
}

export default App
