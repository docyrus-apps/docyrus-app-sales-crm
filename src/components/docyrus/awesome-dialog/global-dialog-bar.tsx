'use client'

import { AppWindow, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import { useGlobalDialog } from './contexts/global-dialog-context'

export function GlobalDialogBar({ className }: { className?: string }) {
  const { minimizedDialogs, restore, unregister } = useGlobalDialog()

  if (minimizedDialogs.length === 0) return null

  return (
    <div
      data-slot="global-dialog-bar"
      className={cn(
        'fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-card p-1.5 shadow-lg',
        className,
      )}
    >
      {minimizedDialogs.map((dialog) => (
        <div
          key={dialog.dialogId}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          onClick={() => restore(dialog.dialogId)}
        >
          {dialog.icon ? (
            <DocyrusIcon
              icon={dialog.icon}
              size="sm"
              className="text-muted-foreground"
            />
          ) : (
            <AppWindow className="size-4 text-muted-foreground" />
          )}

          <span className="max-w-32 truncate text-foreground">
            {dialog.title ?? dialog.dialogId}
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            className="size-5"
            onClick={(e) => {
              e.stopPropagation()
              unregister(dialog.dialogId)
            }}
            aria-label="Close"
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
