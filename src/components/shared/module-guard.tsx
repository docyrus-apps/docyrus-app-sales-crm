import { type ReactNode } from 'react'

import { type AppModuleKey } from '@/lib/app-config'

import { Navigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import { useAppModules } from '@/hooks/use-app-config'
import { isModuleEnabled } from '@/lib/app-config'

interface ModuleGuardProps {
  module: AppModuleKey;
  children: ReactNode;
}

/**
 * Gates a route behind a tenant module switch. While the config resolves it
 * shows a spinner; if the module is disabled it redirects to the home route so
 * deep links to a turned-off module never render their page.
 */
export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { data, isLoading } = useAppModules()

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isModuleEnabled(data, module)) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}
