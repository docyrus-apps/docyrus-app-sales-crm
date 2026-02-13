import { AppSidebar } from './app-sidebar'
import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface AppLayoutProps {
  children: ReactNode
}

/**
 * Main application layout with animated sidebar
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
