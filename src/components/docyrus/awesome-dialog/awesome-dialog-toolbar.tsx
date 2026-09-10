'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { type ToolbarMenuItem } from './types'

export function AwesomeDialogToolbar({
  menus,
  children,
  className,
}: {
  menus?: ToolbarMenuItem[]
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="awesome-dialog-toolbar"
      className={cn(
        'flex shrink-0 items-center gap-0.5 border-b bg-card px-2 py-1',
        className,
      )}
    >
      {menus?.map((menu) => (
        <DropdownMenu key={menu.label}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-sm px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none"
            >
              {menu.label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4}>
            {menu.items.map((item, idx) => {
              const prev = menu.items[idx - 1]
              const next = menu.items[idx + 1]

              return item.separator ? (
                <DropdownMenuSeparator
                  key={`sep-${prev?.label ?? 'start'}-${next?.label ?? 'end'}`}
                />
              ) : (
                <DropdownMenuItem
                  key={item.label}
                  disabled={item.disabled}
                  onClick={item.onClick}
                >
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-4 text-xs text-muted-foreground">
                      {item.shortcut}
                    </span>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      {children}
    </div>
  )
}
