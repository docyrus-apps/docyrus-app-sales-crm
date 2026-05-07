'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'

import { useCalendar } from './contexts/calendar-context'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface CalendarSidebarProps {
  weekTaskCount: number
  highPriorityCount: number
}

export function CalendarSidebar({
  weekTaskCount,
  highPriorityCount,
}: CalendarSidebarProps) {
  const { users } = useCalendar()
  const teamMembers = users.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Team Visibility */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Team Visibility
        </h3>
        <div className="space-y-3">
          {teamMembers.map((user) => {
            return (
              <div key={user.id} className="flex items-center gap-2.5">
                <Switch defaultChecked />
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
              </div>
            )
          })}
          {teamMembers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No team members found.
            </p>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Milestones
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm">Beta Launch</span>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500" />
              <span className="text-sm">Final QA</span>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="rounded-xl bg-primary p-4 text-primary-foreground">
        <h3 className="font-semibold">Weekly Summary</h3>
        <p className="mt-1 text-sm opacity-90">
          You have {weekTaskCount} tasks scheduled this week.
          {highPriorityCount > 0 && (
            <> {highPriorityCount} are high priority.</>
          )}
        </p>
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-primary-foreground/20 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-foreground/30"
        >
          View Analytics
        </button>
      </div>
    </div>
  )
}
