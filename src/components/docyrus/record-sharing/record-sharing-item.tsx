'use client'

import { useCallback } from 'react'

import {
  BuildingIcon,
  GlobeIcon,
  Loader2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { tUi } from '@/lib/ui-i18n'

import { type RecordSharingItemProps, type SharingResourceType } from './types'

const TYPE_ICON_MAP: Record<string, typeof UsersIcon> = {
  team: UsersIcon,
  role: ShieldCheckIcon,
  tenant: BuildingIcon,
  public: GlobeIcon,
}

const TYPE_BADGE_VARIANT_MAP: Record<SharingResourceType, string> = {
  user: '',
  team: 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  role: 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  tenant:
    'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  public:
    'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

function getTypeLabel(
  type: SharingResourceType,
  locale: RecordSharingItemProps['locale'],
): string {
  const keyMap: Partial<
    Record<SharingResourceType, Parameters<typeof tUi>[1]>
  > = {
    team: 'rsTeam',
    role: 'rsRole',
    tenant: 'rsWorkspace',
    public: 'rsPublic',
  }

  const key = keyMap[type]

  return key ? tUi(locale, key) : ''
}

function findPresetLabel(
  value: number,
  presets: RecordSharingItemProps['permissionPresets'],
): string {
  const found = presets.find((p) => p.value === value)

  return found?.label ?? `Custom (${value})`
}

export function RecordSharingItem({
  entity,
  permissionPresets,
  onPermissionChange,
  onRemove,
  isPermissionChangePending = false,
  isRemovePending = false,
  locale,
}: RecordSharingItemProps) {
  const TypeIcon = TYPE_ICON_MAP[entity.type]
  const typeBadgeClass = TYPE_BADGE_VARIANT_MAP[entity.type]
  const typeLabel = getTypeLabel(entity.type, locale)

  const handlePermissionChange = useCallback(
    (value: string) => {
      onPermissionChange(entity.id, Number(value))
    },
    [entity.id, onPermissionChange],
  )

  const handleRemove = useCallback(() => {
    onRemove(entity.id)
  }, [entity.id, onRemove])

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-border/80 bg-card">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {entity.type === 'user' ? (
          <Avatar size="sm">
            {entity.avatarUrl && (
              <AvatarImage src={entity.avatarUrl} alt={entity.name} />
            )}
            <AvatarFallback>
              {entity.initials ?? entity.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
            {TypeIcon && (
              <TypeIcon className="size-3.5 text-muted-foreground" />
            )}
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {entity.name}
          </span>
          {entity.description && (
            <span className="text-xs text-muted-foreground truncate">
              {entity.description}
            </span>
          )}
        </div>

        {typeLabel && (
          <Badge
            variant="outline"
            className={cn('shrink-0 text-[10px] h-4 px-1.5', typeBadgeClass)}
          >
            {typeLabel}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Select
          value={String(entity.permission)}
          onValueChange={handlePermissionChange}
          disabled={isPermissionChangePending}
        >
          <SelectTrigger size="sm" className="h-7 text-xs min-w-25">
            {isPermissionChangePending ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              <SelectValue
                placeholder={findPresetLabel(
                  entity.permission,
                  permissionPresets,
                )}
              />
            )}
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {permissionPresets.map((preset) => (
              <SelectItem key={preset.value} value={String(preset.value)}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleRemove}
              disabled={isRemovePending}
              className="text-muted-foreground hover:text-destructive"
            >
              {isRemovePending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <Trash2Icon className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {tUi(locale, 'rsRemoveAccess')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

RecordSharingItem.displayName = 'RecordSharingItem'
