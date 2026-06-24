'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import {
  type DocyrusKanbanCardContext,
  type DocyrusKanbanCardMenuItem,
  type DocyrusKanbanColumnMeta,
  readUserMeta,
} from '@/hooks/docyrus/use-docyrus-kanban'

import { type UniqueIdentifier } from '@dnd-kit/core'
import { Info, MoreVertical } from 'lucide-react'

import { AvatarThumbnail } from '@/components/docyrus/avatar-thumbnail'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import {
  getEnumDotClassName,
  getEnumDotStyle,
  getEnumIconColor,
} from '@/components/docyrus/form-fields/lib/utils'
import { Kanban as KanbanRoot } from '@/components/docyrus/kanban'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/*
 * Generic-friendly alias for `KanbanRoot`. The exported `Kanban` props use a
 * distributive conditional that TypeScript cannot simplify against an
 * unresolved generic, so we re-type the call signature into a shape the
 * compiler can verify directly. Runtime semantics are identical.
 */
export type KanbanRootGenericProps<T> = {
  value: Record<UniqueIdentifier, Array<T>>
  onValueChange?: (next: Record<UniqueIdentifier, Array<T>>) => void
  onFinalDrop?: (item: T, finalColumnId: UniqueIdentifier) => void
  onDragStart?: (event: { active: { id: UniqueIdentifier } }) => void
  onDragEnd?: (event: { active: { id: UniqueIdentifier } }) => void
  onDragCancel?: () => void
  finalColumns?: Array<UniqueIdentifier>
  getItemValue: (item: T) => UniqueIdentifier
  children?: ReactNode
}

export const KanbanRootGeneric = KanbanRoot as unknown as <T>(
  props: KanbanRootGenericProps<T>,
) => ReactNode

export function KanbanEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[24rem] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      <div className="max-w-md text-balance">{children}</div>
    </div>
  )
}

export function KanbanColumnHeader({
  column,
}: {
  column: DocyrusKanbanColumnMeta
}) {
  return (
    <div className="flex items-center justify-between rounded-t-xl border-b bg-muted/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <KanbanColumnAccent
          color={column.color}
          icon={column.icon}
          imageUrl={column.imageUrl}
        />
        <span className="truncate text-sm font-semibold">{column.label}</span>
        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
          {column.count}
        </span>
      </div>
    </div>
  )
}

export function KanbanColumnAccent({
  color,
  icon,
  imageUrl,
}: {
  color?: string | null
  icon?: string | null
  imageUrl?: string | null
}) {
  if (imageUrl) {
    return (
      <AvatarThumbnail
        size={5}
        image={{ signed_url: imageUrl }}
        shape="circle"
      />
    )
  }

  if (icon) {
    const iconColor = getEnumIconColor(color ?? undefined)

    return (
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center',
          iconColor.className,
        )}
        style={iconColor.style}
      >
        <DocyrusIcon icon={icon} className="size-4" />
      </span>
    )
  }

  const dotClass = getEnumDotClassName(color ?? undefined)
  const dotStyle = getEnumDotStyle(color ?? undefined)

  return (
    <span
      className={cn(
        'inline-block size-2.5 rounded-full',
        dotClass || 'bg-muted-foreground/60',
      )}
      style={dotStyle}
    />
  )
}

interface KanbanCardProps<TData> {
  row: TData
  column: DocyrusKanbanColumnMeta
  avatarColumn?: string
  titleColumn?: string
  descriptionColumn?: string
  userColumn?: string
  cardContent?: (ctx: DocyrusKanbanCardContext<TData>) => ReactNode
  menu: Array<DocyrusKanbanCardMenuItem<TData>>
  onClick?: (row: TData) => void
}

export function KanbanCard<TData>({
  row,
  column,
  avatarColumn,
  titleColumn,
  descriptionColumn,
  userColumn,
  cardContent,
  menu,
  onClick,
}: KanbanCardProps<TData>) {
  const record = row as Record<string, unknown>

  const avatarValue = avatarColumn ? deriveAvatar(record[avatarColumn]) : null
  const title = titleColumn ? stringify(record[titleColumn]) : null
  const description = descriptionColumn
    ? stringify(record[descriptionColumn])
    : null
  const user = userColumn ? deriveUser(record[userColumn]) : null

  const created = stringify(record.created_on)
  const modified = stringify(record.last_modified_on)
  const createdBy = deriveUser(record.created_by)
  const modifiedBy = deriveUser(record.last_modified_by)

  const hasAudit = Boolean(created ?? modified ?? createdBy ?? modifiedBy)

  return (
    <div
      className="rounded-lg border border-border/60 bg-card p-3 shadow-xs transition-shadow hover:shadow-sm"
      onClick={onClick ? () => onClick(row) : undefined}
    >
      <div className="flex items-start gap-2">
        {avatarValue ? (
          <AvatarThumbnail
            size={9}
            icon={avatarValue.icon}
            color={avatarValue.color}
            image={avatarValue.image}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="truncate text-sm font-medium text-foreground">
              {title}
            </div>
          ) : null}
          {description ? (
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {menu.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mr-1 -mt-1 size-7 shrink-0 text-muted-foreground"
                aria-label="Card actions"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menu.map((item, index) => {
                const isDisabled =
                  typeof item.disabled === 'function'
                    ? item.disabled(row)
                    : item.disabled
                const wantsSeparator =
                  item.destructive && index > 0 && !menu[index - 1]?.destructive

                return (
                  <div key={item.key} className="contents">
                    {wantsSeparator ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem
                      disabled={isDisabled}
                      variant={item.destructive ? 'destructive' : 'default'}
                      onClick={() => item.onAction?.(row)}
                    >
                      {item.icon}
                      {item.label}
                    </DropdownMenuItem>
                  </div>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {cardContent ? (
        <div className="mt-2 text-sm text-foreground">
          {cardContent({ row, column })}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        {user ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AvatarThumbnail
                  size={6}
                  shape="circle"
                  image={user.imageUrl ? { signed_url: user.imageUrl } : null}
                  icon={user.imageUrl ? null : 'huge user-circle-02'}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>{user.label}</TooltipContent>
          </Tooltip>
        ) : null}
        <div className="ml-auto" />
        {hasAudit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground">
                <Info className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <div className="space-y-0.5">
                {created ? (
                  <div>
                    Created: {created}
                    {createdBy ? ` · ${createdBy.label}` : ''}
                  </div>
                ) : null}
                {modified ? (
                  <div>
                    Modified: {modified}
                    {modifiedBy ? ` · ${modifiedBy.label}` : ''}
                  </div>
                ) : null}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}

/* --------------------------- helpers ---------------------------------- */

function deriveAvatar(value: unknown): {
  icon?: string | null
  color?: string | null
  image?: { signed_url?: string | null; file_name?: string } | null
} | null {
  if (!value) return null
  if (typeof value === 'string') {
    /*
     * Plain icon identifier or color string — strings with whitespace/dashes
     * are treated as icons, hex strings (`#...`) and bare color names as colors.
     */
    const isIcon =
      value.includes(' ') || (value.includes('-') && !value.startsWith('#'))

    return isIcon ? { icon: value } : { color: value }
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const icon = typeof obj.icon === 'string' ? obj.icon : null
    const color = typeof obj.color === 'string' ? obj.color : null
    const signedUrl =
      typeof obj.signed_url === 'string'
        ? obj.signed_url
        : typeof obj.url === 'string'
          ? obj.url
          : null

    if (signedUrl)
      return {
        image: {
          signed_url: signedUrl,
          file_name:
            typeof obj.file_name === 'string' ? obj.file_name : undefined,
        },
      }

    return { icon, color }
  }

  return null
}

function deriveUser(
  value: unknown,
): { id: string; label: string; imageUrl?: string | null } | null {
  return readUserMeta(value, 'user')
}

function stringify(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()

    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  if (value instanceof Date) return value.toLocaleString()

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const candidate =
      obj.name ?? obj.label ?? obj.title ?? obj.value ?? obj.description

    if (typeof candidate === 'string') return candidate
  }

  return null
}
