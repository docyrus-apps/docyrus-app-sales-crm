'use client'

import { ActivityIcon } from 'lucide-react'

export function ActivityEmptyState({ contactName }: { contactName?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <ActivityIcon className="size-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No activities yet</p>
      <p className="text-xs text-muted-foreground">
        {contactName
          ? `Activity with ${contactName} will appear here.`
          : 'Log a call, meeting, or email to get started.'}
      </p>
    </div>
  )
}
