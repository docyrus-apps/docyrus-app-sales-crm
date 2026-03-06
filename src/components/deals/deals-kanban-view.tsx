import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type {
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { CalendarDays, Flame, HandCoins, UserRound } from 'lucide-react'
import type { BaseCrmDealsEntity } from '@/collections/base_crm-deals.collection'
import type { EnumEntity } from '@/collections/enums.collection'
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanFinalColumn,
  KanbanFinalZone,
  KanbanItem,
  KanbanOverlay,
} from '@/components/docyrus/kanban'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DealsKanbanViewProps {
  deals: Array<BaseCrmDealsEntity>
  statuses: Array<EnumEntity>
  onStageChange?: (
    deal: BaseCrmDealsEntity,
    stageId: string,
  ) => Promise<unknown> | unknown
}

function getStageId(
  deal: BaseCrmDealsEntity,
  statusById: Map<string, EnumEntity>,
  statusByName: Map<string, EnumEntity>,
) {
  const stage = deal.stage

  if (!stage) return null

  if (typeof stage === 'object' && typeof stage.id === 'string') {
    return stage.id
  }

  if (typeof stage === 'string') {
    if (statusById.has(stage)) return stage

    return statusByName.get(stage.toLowerCase())?.id ?? null
  }

  return null
}

function buildColumns(
  deals: Array<BaseCrmDealsEntity>,
  statuses: Array<EnumEntity>,
): Record<UniqueIdentifier, Array<BaseCrmDealsEntity>> {
  const statusById = new Map(statuses.map((status) => [status.id, status]))
  const statusByName = new Map(
    statuses.map((status) => [status.name.toLowerCase(), status]),
  )
  const columns: Record<UniqueIdentifier, Array<BaseCrmDealsEntity>> = {}

  for (const status of statuses) {
    columns[status.id] = []
  }

  for (const deal of deals) {
    const stageId = getStageId(deal, statusById, statusByName)

    if (!stageId || !(stageId in columns)) continue

    columns[stageId]!.push(deal)
  }

  return columns
}

function findColumnId<T extends { id?: string }>(
  columns: Record<UniqueIdentifier, Array<T>>,
  itemId: UniqueIdentifier,
) {
  if (itemId in columns) return itemId

  for (const [columnId, items] of Object.entries(columns)) {
    if (items.some((item) => item.id === itemId)) {
      return columnId
    }
  }

  return null
}

function findDeal(
  columns: Record<UniqueIdentifier, Array<BaseCrmDealsEntity>>,
  dealId: UniqueIdentifier,
) {
  for (const items of Object.values(columns)) {
    const deal = items.find((item) => item.id === dealId)

    if (deal) return deal
  }

  return null
}

function getDropColumnId(
  columns: Record<UniqueIdentifier, Array<BaseCrmDealsEntity>>,
  overId: UniqueIdentifier | null | undefined,
  finalStatusIds: Set<string>,
) {
  if (!overId) return null

  if (typeof overId === 'string' && finalStatusIds.has(overId)) {
    return overId
  }

  return findColumnId(columns, overId)
}

function getStatusSurfaceStyle(color?: string | null) {
  if (!color) return undefined

  return {
    borderColor: `color-mix(in srgb, ${color} 32%, transparent)`,
  }
}

function getStatusIconStyle(color?: string | null) {
  if (!color) return undefined

  return {
    color,
    backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
  }
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getDealOrganization(deal: BaseCrmDealsEntity) {
  const organization = deal.organization

  if (!organization || typeof organization !== 'object') {
    return null
  }

  return organization as {
    id?: string
    name?: string
    company_logo?: { signed_url?: string | null } | null
  }
}

function getRelationName(
  value: string | { name?: string | null } | null | undefined,
  fallback: string,
) {
  if (typeof value === 'string') {
    return value || fallback
  }

  if (value && typeof value === 'object') {
    return value.name || fallback
  }

  return fallback
}

function formatCloseDate(value?: string) {
  if (!value) return 'No close date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'No close date'

  return date.toLocaleDateString()
}

export function DealsKanbanView({
  deals,
  statuses,
  onStageChange,
}: DealsKanbanViewProps) {
  const activeStatuses = useMemo(
    () => statuses.filter((status) => !status.isFinalOption),
    [statuses],
  )
  const finalStatuses = useMemo(
    () => statuses.filter((status) => status.isFinalOption),
    [statuses],
  )
  const initialColumns = useMemo(
    () => buildColumns(deals, activeStatuses),
    [activeStatuses, deals],
  )
  const activeStatusIds = useMemo(
    () => new Set(activeStatuses.map((status) => status.id)),
    [activeStatuses],
  )
  const finalStatusIds = useMemo(
    () => new Set(finalStatuses.map((status) => status.id)),
    [finalStatuses],
  )
  const [columns, setColumns] =
    useState<Record<UniqueIdentifier, Array<BaseCrmDealsEntity>>>(
      initialColumns,
    )
  const columnsRef = useRef(columns)
  const dragSourceColumnRef = useRef<UniqueIdentifier | null>(null)

  useEffect(() => {
    columnsRef.current = columns
  }, [columns])

  useEffect(() => {
    setColumns(initialColumns)
    columnsRef.current = initialColumns
  }, [initialColumns])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    dragSourceColumnRef.current = findColumnId(
      columnsRef.current,
      event.active.id,
    )
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const sourceColumnId = dragSourceColumnRef.current

      dragSourceColumnRef.current = null

      if (!sourceColumnId) return

      const targetColumnId = getDropColumnId(
        columnsRef.current,
        event.over?.id,
        finalStatusIds,
      )

      if (!targetColumnId || sourceColumnId === targetColumnId) return

      const targetStageId = String(targetColumnId)

      if (
        !activeStatusIds.has(targetStageId) &&
        !finalStatusIds.has(targetStageId)
      ) {
        return
      }

      const deal = findDeal(columnsRef.current, event.active.id)

      if (!deal || !deal.id) return

      void onStageChange?.(deal, targetStageId)
    },
    [activeStatusIds, finalStatusIds, onStageChange],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item.id ?? ''}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        finalColumns={finalStatuses.map((status) => status.id)}
        flatCursor
      >
        <KanbanBoard className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-4">
          {activeStatuses.map((status) => (
            <KanbanColumn
              key={status.id}
              value={status.id}
              className="flex h-full min-h-0 w-80 shrink-0 overflow-hidden bg-primary-foreground"
              style={getStatusSurfaceStyle(status.color)}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 pb-3">
                <div className="flex min-w-0 items-center gap-2">
                  {status.icon && (
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={getStatusIconStyle(status.color)}
                    >
                      <DocyrusIcon icon={status.icon} className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {status.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Active stage
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columns[status.id]?.length ?? 0}
                </Badge>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pl-2 pr-1">
                <div className="flex min-h-full flex-col gap-2">
                  {(columns[status.id] ?? []).map((deal) => {
                    const organization = getDealOrganization(deal)
                    const organizationName =
                      organization?.name ||
                      `Deal #${deal.id?.slice(0, 8) ?? ''}`
                    const contactName = getRelationName(
                      deal.contact_person as
                        | string
                        | { name?: string | null }
                        | null,
                      'No contact',
                    )
                    const leadSourceName = getRelationName(
                      deal.lead_source as
                        | string
                        | { name?: string | null }
                        | null,
                      'Direct',
                    )

                    return (
                      <KanbanItem
                        key={deal.id}
                        value={deal.id ?? ''}
                        asHandle
                        className="min-w-0"
                      >
                        <Link
                          to="/deals/$dealId"
                          params={{ dealId: deal.id ?? '' }}
                          className="block min-w-0"
                        >
                          <Card className="group relative w-full min-w-0 overflow-hidden border-border/60 bg-background shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" />
                            <CardHeader className="relative gap-4 pb-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <Avatar className="size-12 rounded-2xl ring-1 ring-border/60">
                                  <AvatarImage
                                    src={
                                      organization?.company_logo?.signed_url ??
                                      undefined
                                    }
                                    alt={organization?.name ?? 'Company'}
                                  />
                                  <AvatarFallback className="rounded-2xl bg-muted text-sm font-semibold text-foreground">
                                    {getInitials(
                                      organization?.name || contactName || 'Deal',
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 space-y-1">
                                  <CardTitle className="truncate text-sm font-semibold tracking-tight">
                                    {organizationName}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserRound className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {contactName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="relative space-y-4 pt-0">
                              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                                  <HandCoins className="size-3.5" />
                                  Value
                                </div>
                                <div className="mt-1 text-lg font-semibold text-foreground">
                                  $
                                  {deal.deal_value?.toLocaleString() ||
                                    deal.expected_revenue?.toLocaleString() ||
                                    0}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-2xl border border-border/60 bg-muted/70 px-3 py-2">
                                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                    <CalendarDays className="size-3.5 shrink-0" />
                                    Close
                                  </div>
                                  <p className="mt-1 text-xs font-medium text-foreground">
                                    {formatCloseDate(
                                      deal.expected_closing_date,
                                    )}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-muted/70 px-3 py-2">
                                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                    Probability
                                  </div>
                                  <p className="mt-1 text-xs font-medium text-foreground">
                                    {deal.close_probability ?? 0}%
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                  <span>Momentum</span>
                                  <span>{deal.close_probability ?? 0}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted-foreground/15">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"
                                    style={{
                                      width: `${Math.min(
                                        Math.max(
                                          deal.close_probability ?? 0,
                                          6,
                                        ),
                                        100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <Badge
                                  variant="secondary"
                                  className="min-w-0 rounded-full px-2.5 py-1"
                                >
                                  <span className="truncate">
                                    {leadSourceName}
                                  </span>
                                </Badge>
                                {deal.hot_prospect && (
                                  <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                    <Flame className="size-3.5" />
                                    Hot prospect
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </KanbanItem>
                    )
                  })}
                </div>
              </div>
            </KanbanColumn>
          ))}
        </KanbanBoard>
        {finalStatuses.length > 0 && (
          <KanbanFinalZone className="shrink-0 gap-3 overflow-x-auto border-t bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {finalStatuses.map((status) => (
              <KanbanFinalColumn
                key={status.id}
                value={status.id}
                className="min-h-28 min-w-64 shrink-0 bg-muted"
                style={getStatusSurfaceStyle(status.color)}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  {status.icon && (
                    <span
                      className="flex size-10 items-center justify-center rounded-xl"
                      style={getStatusIconStyle(status.color)}
                    >
                      <DocyrusIcon icon={status.icon} className="size-5" />
                    </span>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{status.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Drop a deal here to mark it as final.
                    </p>
                  </div>
                </div>
              </KanbanFinalColumn>
            ))}
          </KanbanFinalZone>
        )}
        <KanbanOverlay />
      </Kanban>
    </div>
  )
}
