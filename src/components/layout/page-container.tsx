import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Standard page container with consistent padding
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('container mx-auto p-6 animate-fade-in-up', className)}>
      {children}
    </div>
  )
}
