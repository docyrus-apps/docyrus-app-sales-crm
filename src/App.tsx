import { useEffect, useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { Agentation } from 'agentation'
import { SignInButton, useDocyrusAuth, useDocyrusClient } from '@docyrus/signin'
import { Button } from './components/ui/button'
import { setApiClient } from './lib/api'
import { AppLayout } from './components/layout/app-layout'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { CommandPalette } from './components/shared/command-palette'
import { DealFormDialog } from './components/deals/deal-form-dialog'
import { LeadFormDialog } from './components/leads/lead-form-dialog'
import { TaskFormSheet } from './components/tasks/task-form-sheet'
import { EventFormDialog } from './components/events/event-form-dialog'

function App() {
  const { status } = useDocyrusAuth()
  const client = useDocyrusClient()

  // Command palette state
  const [commandOpen, setCommandOpen] = useState(false)
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [eventFormOpen, setEventFormOpen] = useState(false)

  // Sync the library's API client to the module-level apiClient used by collections
  // Track readiness so we don't render children until the client is available
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    if (client) {
      setApiClient(client)
      setClientReady(true)
    }
  }, [client])

  // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (status === 'loading' || (status === 'authenticated' && !clientReady)) {
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
        <div className="min-h-screen flex items-center justify-center bg-sidebar">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-6 p-8 bg-background rounded-lg border shadow-sm">
              <div className="flex flex-col items-center gap-2 text-center">
                <img
                  src="/logo.svg"
                  alt="Sales CRM by Docyrus"
                  className="h-12 w-12 mb-2"
                />
                <h1 className="text-2xl font-bold">Sales CRM by Docyrus</h1>
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
    <NuqsAdapter>
      <TooltipProvider>
        <AppLayout>
          <Outlet />
        </AppLayout>
        <Toaster />
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onCreateDeal={() => setDealFormOpen(true)}
          onCreateLead={() => setLeadFormOpen(true)}
          onCreateTask={() => setTaskFormOpen(true)}
          onCreateEvent={() => setEventFormOpen(true)}
        />
        <DealFormDialog
          open={dealFormOpen}
          onOpenChange={setDealFormOpen}
          mode="create"
        />
        <LeadFormDialog
          open={leadFormOpen}
          onOpenChange={setLeadFormOpen}
          mode="create"
        />
        <TaskFormSheet
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          mode="create"
        />
        <EventFormDialog
          open={eventFormOpen}
          onOpenChange={setEventFormOpen}
          mode="create"
        />
        {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
      </TooltipProvider>
    </NuqsAdapter>
  )
}

export default App
