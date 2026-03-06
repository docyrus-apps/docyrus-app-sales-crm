import type { ReactNode } from 'react'
import {
  AwesomeCard,
  AwesomeCardBody,
  AwesomeCardHeader,
  AwesomeCardIcon,
  AwesomeCardTitle,
} from '@/components/docyrus/awesome-card'
import { Skeleton } from '@/components/ui/skeleton'

interface ReportCardProps {
  title: string
  icon: ReactNode
  isLoading: boolean
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
}

export function ReportCard({
  title,
  icon,
  isLoading,
  isEmpty,
  emptyMessage = 'No data available',
  children,
}: ReportCardProps) {
  return (
    <AwesomeCard className="animate-fade-in-up">
      <AwesomeCardHeader>
        <AwesomeCardTitle>{title}</AwesomeCardTitle>
        <AwesomeCardIcon>{icon}</AwesomeCardIcon>
      </AwesomeCardHeader>
      <AwesomeCardBody>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </AwesomeCardBody>
    </AwesomeCard>
  )
}
