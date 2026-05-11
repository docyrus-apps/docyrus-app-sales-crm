import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type {
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { ArrowUpRight, Building2, Globe, Mail, Sparkles } from 'lucide-react'
import type { BaseCrmLeadsEntity } from '@/collections/base_crm-leads.collection'
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

interface LeadsKanbanViewProps {
  leads: Array<BaseCrmLeadsEntity>
  statuses: Array<EnumEntity>
  onStatusChange?: (
    lead: BaseCrmLeadsEntity,
    statusId: string,
  ) => Promise<unknown> | unknown
}

function getLeadStatusId(
  lead: BaseCrmLeadsEntity,
  statusById: Map<string, EnumEntity>,
  statusByName: Map<string, EnumEntity>,
) {
  const status = lead.lead_status

  if (!status) return null

  if (typeof status === 'object' && typeof status.id === 'string') {
    return status.id
  }

  if (typeof status === 'string') {
    if (statusById.has(status)) return status

    return statusByName.get(status.toLowerCase())?.id ?? null
  }

  return null
}

function buildColumns(
  leads: Array<BaseCrmLeadsEntity>,
  statuses: Array<EnumEntity>,
): Record<UniqueIdentifier, Array<BaseCrmLeadsEntity>> {
  const statusById = new Map(statuses.map((status) => [status.id, status]))
  const statusByName = new Map(
    statuses.map((status) => [status.name.toLowerCase(), status]),
  )
  const columns: Record<UniqueIdentifier, Array<BaseCrmLeadsEntity>> = {}

  for (const status of statuses) {
    columns[status.id] = []
  }

  for (const lead of leads) {
    const statusId = getLeadStatusId(lead, statusById, statusByName)

    if (!statusId || !(statusId in columns)) continue

    columns[statusId]!.push(lead)
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

function findLead(
  columns: Record<UniqueIdentifier, Array<BaseCrmLeadsEntity>>,
  leadId: UniqueIdentifier,
) {
  for (const items of Object.values(columns)) {
    const lead = items.find((item) => item.id === leadId)

    if (lead) return lead
  }

  return null
}

function getDropColumnId(
  columns: Record<UniqueIdentifier, Array<BaseCrmLeadsEntity>>,
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

function getLeadCompany(lead: BaseCrmLeadsEntity) {
  return lead.company_name_text as
    | {
        id?: string
        name?: string
        company_logo?: { signed_url?: string | null } | null
      }
    | string
    | undefined
}

export function LeadsKanbanView({
  leads,
  statuses,
  onStatusChange,
}: LeadsKanbanViewProps) {
  const activeStatuses = useMemo(
    () => statuses.filter((status) => !status.isFinalOption),
    [statuses],
  )
  const finalStatuses = useMemo(
    () => statuses.filter((status) => status.isFinalOption),
    [statuses],
  )
  const initialColumns = useMemo(
    () => buildColumns(leads, activeStatuses),
    [activeStatuses, leads],
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
    useState<Record<UniqueIdentifier, Array<BaseCrmLeadsEntity>>>(
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

      const targetStatusId = String(targetColumnId)

      if (
        !activeStatusIds.has(targetStatusId) &&
        !finalStatusIds.has(targetStatusId)
      ) {
        return
      }

      const lead = findLead(columnsRef.current, event.active.id)

      if (!lead || !lead.id) return

      void onStatusChange?.(lead, targetStatusId)
    },
    [activeStatusIds, finalStatusIds, onStatusChange],
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
                      Active status
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columns[status.id]?.length ?? 0}
                </Badge>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pl-2 pr-1">
                <div className="flex min-h-full flex-col gap-2">
                  {(columns[status.id] ?? []).map((lead) => {
                    const company = getLeadCompany(lead)
                    const companyName =
                      (typeof company === 'object' ? company?.name : company) ||
                      'Independent lead'
                    const companyLogo =
                      typeof company === 'object'
                        ? (company?.company_logo?.signed_url ?? undefined)
                        : undefined
                    const leadSource =
                      lead.lead_source && typeof lead.lead_source === 'object'
                        ? lead.lead_source.name || 'Inbound'
                        : lead.lead_source || 'Inbound'
                    const leadType =
                      lead.lead_type && typeof lead.lead_type === 'object'
                        ? lead.lead_type.name || 'Lead'
                        : lead.lead_type || 'Lead'

                    return (
                      <KanbanItem
                        key={lead.id}
                        value={lead.id ?? ''}
                        asHandle
                        className="min-w-0"
                      >
                        <Card className="group relative w-full min-w-0 overflow-hidden border-border/60 bg-background shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                          <Link
                            to="/leads/$leadId"
                            params={{ leadId: lead.id ?? '' }}
                            className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground transition hover:bg-background hover:text-foreground"
                            onPointerDown={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                            onTouchStart={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <ArrowUpRight className="size-4" />
                          </Link>
                          <CardHeader className="relative gap-4 pb-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <Avatar className="size-12 rounded-2xl ring-1 ring-border/60">
                                <AvatarImage
                                  src={companyLogo}
                                  alt={
                                    typeof company === 'object'
                                      ? (company?.name ?? 'Company')
                                      : 'Lead company'
                                  }
                                />
                                <AvatarFallback className="rounded-2xl bg-muted text-sm font-semibold text-foreground">
                                  {getInitials(
                                    companyName || lead.name || 'Lead',
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 space-y-1">
                                <CardTitle className="truncate text-sm font-semibold tracking-tight">
                                  {lead.name ||
                                    `Lead #${lead.id?.slice(0, 8) ?? ''}`}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Building2 className="size-3.5 shrink-0" />
                                  <span className="truncate">
                                    {companyName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="relative space-y-4 pt-0">
                            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                                <Sparkles className="size-3.5" />
                                Source
                              </div>
                              <div className="mt-1 text-sm font-semibold text-foreground">
                                {leadSource}
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <div className="rounded-2xl border border-border/60 bg-muted/70 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                  <Mail className="size-3.5 shrink-0" />
                                  Email
                                </div>
                                <p className="mt-1 truncate text-xs font-medium text-foreground">
                                  {lead.email || 'No email address'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border/60 bg-muted/70 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                  <Globe className="size-3.5 shrink-0" />
                                  Web
                                </div>
                                <p className="mt-1 truncate text-xs font-medium text-foreground">
                                  {lead.website ||
                                    lead.phone ||
                                    'No website or phone'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                variant="secondary"
                                className="min-w-0 rounded-full px-2.5 py-1"
                              >
                                <span className="truncate">{leadType}</span>
                              </Badge>
                              {lead.countries &&
                                typeof lead.countries === 'object' &&
                                'name' in lead.countries && (
                                  <div className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                    {lead.countries.name}
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
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
                      Drop a lead here to mark it as final.
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
