'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  BuildingIcon,
  CheckIcon,
  GlobeIcon,
  Loader2Icon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { ScrollArea } from '@/components/ui/scroll-area'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

import { RecordSharingItem } from './record-sharing-item'

import {
  type PermissionPresetOption,
  type RecordSharingPanelProps,
  type SharingResourceType,
  type SharingSearchResult,
  SharingPermissionPreset,
} from './types'

const TYPE_ICON_MAP: Record<string, typeof UsersIcon> = {
  team: UsersIcon,
  role: ShieldCheckIcon,
  tenant: BuildingIcon,
  public: GlobeIcon,
}

function getDefaultPermissionPresets(
  locale: UiI18nLocale | undefined,
): PermissionPresetOption[] {
  return [
    {
      label: tUi(locale, 'rsCanView'),
      value: SharingPermissionPreset.CAN_VIEW,
    },
    {
      label: tUi(locale, 'rsCanComment'),
      value: SharingPermissionPreset.CAN_COMMENT,
    },
    {
      label: tUi(locale, 'rsCanEdit'),
      value: SharingPermissionPreset.CAN_EDIT,
    },
    {
      label: tUi(locale, 'rsCanShare'),
      value: SharingPermissionPreset.CAN_SHARE,
    },
    {
      label: tUi(locale, 'rsFullAccess'),
      value: SharingPermissionPreset.FULL_ACCESS,
    },
  ]
}

export function RecordSharingPanel({
  sharedEntities,
  resources: _resources = ['user', 'team', 'role'],
  permissionPresets,
  defaultPermission = SharingPermissionPreset.CAN_VIEW,
  onSearch,
  onAdd,
  onPermissionChange,
  onRemove,
  isLoading = false,
  isSearching = false,
  isAddPending = false,
  pendingPermissionChanges,
  pendingRemovals,
  title,
  maxHeight = 320,
  locale,
  className,
}: RecordSharingPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SharingSearchResult[]>([])
  const [selectedEntities, setSelectedEntities] = useState<
    SharingSearchResult[]
  >([])
  const [addPermission, setAddPermission] = useState(defaultPermission)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const presets = useMemo(
    () => permissionPresets ?? getDefaultPermissionPresets(locale),
    [permissionPresets, locale],
  )

  const sharedEntityIds = useMemo(
    () => new Set(sharedEntities.map((e) => e.id)),
    [sharedEntities],
  )

  const selectedEntityIds = useMemo(
    () => new Set(selectedEntities.map((e) => e.id)),
    [selectedEntities],
  )

  const filteredResults = useMemo(
    () => searchResults.filter((r) => !sharedEntityIds.has(r.id)),
    [searchResults, sharedEntityIds],
  )

  const sortedEntities = useMemo(() => {
    const typeOrder: Record<SharingResourceType, number> = {
      public: 0,
      tenant: 1,
      role: 2,
      team: 3,
      user: 4,
    }

    return [...sharedEntities].sort(
      (a, b) => (typeOrder[a.type] ?? 5) - (typeOrder[b.type] ?? 5),
    )
  }, [sharedEntities])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (!value.trim()) {
        setSearchResults([])
        setIsSearchOpen(false)

        return
      }

      setIsSearchOpen(true)

      debounceRef.current = setTimeout(async () => {
        const results = await onSearch(value)

        setSearchResults(results)
      }, 300)
    },
    [onSearch],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const toggleSelection = useCallback((result: SharingSearchResult) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => e.id === result.id)

      return exists ? prev.filter((e) => e.id !== result.id) : [...prev, result]
    })
  }, [])

  const removeFromSelection = useCallback((id: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleAdd = useCallback(async () => {
    if (selectedEntities.length === 0) return

    await onAdd(
      selectedEntities.map((e) => ({
        id: e.id,
        type: e.type,
        permission: addPermission,
      })),
    )

    setSelectedEntities([])
    setSearchQuery('')
    setSearchResults([])
    setIsSearchOpen(false)
  }, [selectedEntities, addPermission, onAdd])

  const panelTitle = title ?? tUi(locale, 'rsShareWith')

  const maxHeightStyle =
    typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{panelTitle}</h3>
        {sharedEntities.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {sharedEntities.length}
          </span>
        )}
      </div>

      {/* Add people section */}
      <div className="space-y-2">
        {selectedEntities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedEntities.map((entity) => (
              <Badge key={entity.id} variant="secondary" className="gap-1 pr-1">
                {entity.name}
                <button
                  type="button"
                  onClick={() => removeFromSelection(entity.id)}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Command
              shouldFilter={false}
              className="rounded-lg border border-input"
            >
              <CommandInput
                placeholder={tUi(locale, 'rsSearchPeoplePlaceholder')}
                value={searchQuery}
                onValueChange={handleSearchChange}
              />
              {isSearchOpen && (
                <CommandList className="max-h-48">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>{tUi(locale, 'noUsersFound')}</CommandEmpty>
                      {filteredResults.length > 0 && (
                        <CommandGroup>
                          {filteredResults.map((result) => {
                            const isSelected = selectedEntityIds.has(result.id)
                            const TypeIcon = TYPE_ICON_MAP[result.type]

                            return (
                              <CommandItem
                                key={result.id}
                                value={result.id}
                                onSelect={() => toggleSelection(result)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {result.type === 'user' ? (
                                    <Avatar size="sm">
                                      {result.avatarUrl && (
                                        <AvatarImage
                                          src={result.avatarUrl}
                                          alt={result.name}
                                        />
                                      )}
                                      <AvatarFallback>
                                        {result.initials ??
                                          result.name.charAt(0).toUpperCase()}
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
                                    <span className="text-sm truncate">
                                      {result.name}
                                    </span>
                                    {result.description && (
                                      <span className="text-xs text-muted-foreground truncate">
                                        {result.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckIcon className="size-4 text-primary shrink-0" />
                                )}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              )}
            </Command>
          </div>
        </div>

        {selectedEntities.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <Select
              value={String(addPermission)}
              onValueChange={(v) => setAddPermission(Number(v))}
            >
              <SelectTrigger size="sm" className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={String(preset.value)}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={handleAdd}
              disabled={isAddPending}
              className="h-7 text-xs gap-1.5"
            >
              {isAddPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
              {isAddPending ? tUi(locale, 'rsAdding') : tUi(locale, 'rsAdd')}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Shared entities list */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : sortedEntities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-border rounded-lg">
          <UsersIcon className="size-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground mb-0.5">
            {tUi(locale, 'rsNoSharedEntities')}
          </p>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight: maxHeightStyle }}>
          <div className="flex flex-col gap-1.5">
            {sortedEntities.map((entity) => (
              <RecordSharingItem
                key={entity.id}
                entity={entity}
                permissionPresets={presets}
                onPermissionChange={onPermissionChange}
                onRemove={onRemove}
                isPermissionChangePending={
                  pendingPermissionChanges?.[entity.id]
                }
                isRemovePending={pendingRemovals?.[entity.id]}
                locale={locale}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

RecordSharingPanel.displayName = 'RecordSharingPanel'
