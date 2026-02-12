import { AppSidebar } from './app-sidebar'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

/**
 * Main application layout with sidebar
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  )
}
