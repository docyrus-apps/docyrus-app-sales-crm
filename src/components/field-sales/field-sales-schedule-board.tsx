import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { MapPinned, Trash2 } from 'lucide-react'
import {
  Map as DocyrusMap,
  MapMarker,
  MapPopup,
  MapPolyline,
  MapTileLayer,
  MapZoomControl,
} from '@/components/docyrus/map'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  getDateKey,
  getRelationName,
  getSlotKeyFromIso,
  getStatusMeta,
  parseMapLocation,
  type SlotDefinition,
} from '@/lib/field-sales'

export interface FieldSalesBoardSourceItem {
  id: string
  title: string
  subtitle?: string
  detail?: string
}

export interface FieldSalesBoardPlanItem {
  id?: string
  subject?: string
  start_date?: string
  end_date?: string
  status?: unknown
  event_type?: unknown
  organization?: unknown
  contact?: unknown
  location?: unknown
}

export interface FieldSalesBoardDropPayload {
  type: 'source' | 'plan'
  id: string
}

interface FieldSalesScheduleBoardProps {
  title?: string
  titleToolbar?: React.ReactNode
  sourceTitle?: string
  sourceItems?: Array<FieldSalesBoardSourceItem>
  sourceEmptyText?: string
  sourceToolbar?: React.ReactNode
  days: Array<Date>
  slots: Array<SlotDefinition>
  plans: Array<FieldSalesBoardPlanItem>
  readOnly?: boolean
  className?: string
  canDragPlan?: (plan: FieldSalesBoardPlanItem) => boolean
  canDeletePlan?: (plan: FieldSalesBoardPlanItem) => boolean
  onDeletePlan?: (plan: FieldSalesBoardPlanItem) => void
  onDropToSlot?: (
    payload: FieldSalesBoardDropPayload,
    day: Date,
    slot: SlotDefinition,
  ) => void
}

function getPlanLabel(plan: FieldSalesBoardPlanItem) {
  return (
    plan.subject ||
    getRelationName(plan.organization) ||
    getRelationName(plan.contact) ||
    'Plan'
  )
}

function serializePayload(payload: FieldSalesBoardDropPayload) {
  return JSON.stringify(payload)
}

function parsePayload(value: string): FieldSalesBoardDropPayload | null {
  try {
    const parsed = JSON.parse(value) as FieldSalesBoardDropPayload
    if (
      parsed &&
      (parsed.type === 'source' || parsed.type === 'plan') &&
      typeof parsed.id === 'string'
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

type DayMapEntry = {
  plan: FieldSalesBoardPlanItem
  order: number
  label: string
  timeLabel: string
  location: {
    latitude: number
    longitude: number
    label?: string
  } | null
}

type RouteMode = 'plan' | 'optimized'

function getPlanLocation(plan: FieldSalesBoardPlanItem) {
  return (
    parseMapLocation((plan.organization as any)?.map_location) ||
    parseMapLocation((plan.contact as any)?.map_location) ||
    parseMapLocation(plan.location)
  )
}

function getDistanceBetweenEntries(first: DayMapEntry, second: DayMapEntry) {
  if (!first.location || !second.location) return Number.POSITIVE_INFINITY

  const latitudeDiff = first.location.latitude - second.location.latitude
  const longitudeDiff = first.location.longitude - second.location.longitude

  return Math.sqrt(latitudeDiff ** 2 + longitudeDiff ** 2)
}

function buildOptimizedRoute(entries: Array<DayMapEntry>) {
  if (entries.length <= 2) return entries

  const remaining = [...entries]
  const optimized: Array<DayMapEntry> = []
  let current = remaining.shift()

  if (!current) return entries

  optimized.push(current)

  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    remaining.forEach((candidate, index) => {
      const distance = getDistanceBetweenEntries(current!, candidate)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    current = remaining.splice(nearestIndex, 1)[0]
    optimized.push(current)
  }

  return optimized
}

function buildGoogleMapsRouteUrl(entries: Array<DayMapEntry>) {
  if (entries.length === 0) return ''

  if (entries.length === 1) {
    const point = entries[0]?.location
    if (!point) return ''
    return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`
  }

  const encodedPoints = entries
    .map((entry) => `${entry.location!.latitude},${entry.location!.longitude}`)
    .slice(0, 10)

  const [origin, ...rest] = encodedPoints
  const destination = rest.pop()

  if (!origin || !destination) return ''

  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  })

  if (rest.length > 0) {
    params.set('waypoints', rest.join('|'))
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function FieldSalesPlanCard({
  plan,
  draggable,
  selectable,
  selected,
  deletable,
  onClick,
  onDelete,
}: {
  plan: FieldSalesBoardPlanItem
  draggable: boolean
  selectable?: boolean
  selected?: boolean
  deletable?: boolean
  onClick?: () => void
  onDelete?: () => void
}) {
  const status = getStatusMeta(plan.status)
  const eventType = getStatusMeta(plan.event_type)

  return (
    <div
      className={cn(
        'group/plan rounded-xl border bg-card px-3 py-2 shadow-sm transition',
        selected && 'border-primary bg-primary/5',
        !draggable && !selectable && !deletable && 'opacity-80',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          draggable={draggable}
          onClick={onClick}
          onDragStart={(event) => {
            if (!plan.id) return
            event.dataTransfer.setData(
              'application/json',
              serializePayload({
                type: 'plan',
                id: plan.id,
              }),
            )
            event.dataTransfer.effectAllowed = 'move'
          }}
          className={cn(
            'min-w-0 flex-1 text-left transition',
            draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
            selectable && 'hover:text-foreground',
          )}
        >
          <div className="text-sm font-semibold text-foreground">
            {getPlanLabel(plan)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {eventType.name ? (
              <Badge variant="secondary" className="text-[11px]">
                {eventType.name}
              </Badge>
            ) : null}
            {status.name ? (
              <Badge variant="outline" className="text-[11px]">
                {status.name}
              </Badge>
            ) : null}
          </div>
        </button>
        {deletable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="mt-0.5 shrink-0 text-muted-foreground transition sm:opacity-0 sm:pointer-events-none sm:group-hover/plan:opacity-100 sm:group-hover/plan:pointer-events-auto sm:group-focus-within/plan:opacity-100 sm:group-focus-within/plan:pointer-events-auto hover:text-destructive focus-visible:opacity-100 focus-visible:pointer-events-auto"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Planı sil</span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function FieldSalesScheduleBoard({
  title,
  titleToolbar,
  sourceTitle,
  sourceItems,
  sourceEmptyText,
  sourceToolbar,
  days,
  slots,
  plans,
  readOnly = false,
  className,
  canDragPlan,
  canDeletePlan,
  onDeletePlan,
  onDropToSlot,
}: FieldSalesScheduleBoardProps) {
  const isMobile = useIsMobile()
  const [selectedPayload, setSelectedPayload] =
    useState<FieldSalesBoardDropPayload | null>(null)
  const [selectedMapDayKey, setSelectedMapDayKey] = useState<string | null>(
    null,
  )
  const [routeMode, setRouteMode] = useState<RouteMode>('plan')
  const selectedDayMapRef = useRef<any>(null)

  const planMap = new Map<string, Array<FieldSalesBoardPlanItem>>()

  for (const plan of plans) {
    const key = getSlotKeyFromIso(plan.start_date)
    if (!key) continue

    const bucket = planMap.get(key)
    if (bucket) {
      bucket.push(plan)
    } else {
      planMap.set(key, [plan])
    }
  }

  const dayEntriesByKey = useMemo(() => {
    const grouped = new Map<string, Array<FieldSalesBoardPlanItem>>()

    for (const plan of plans) {
      if (!plan.start_date) continue
      const dayKey = getDateKey(plan.start_date)
      const bucket = grouped.get(dayKey)

      if (bucket) {
        bucket.push(plan)
      } else {
        grouped.set(dayKey, [plan])
      }
    }

    const entries = new Map<string, Array<DayMapEntry>>()

    for (const [dayKey, dayPlans] of grouped.entries()) {
      const sortedPlans = [...dayPlans].sort((first, second) =>
        (first.start_date || '').localeCompare(second.start_date || ''),
      )

      entries.set(
        dayKey,
        sortedPlans.map((plan, index) => ({
          plan,
          order: index + 1,
          label: getPlanLabel(plan),
          timeLabel: plan.start_date
            ? format(new Date(plan.start_date), 'HH:mm')
            : '',
          location: getPlanLocation(plan),
        })),
      )
    }

    return entries
  }, [plans])

  const selectedDayEntries = selectedMapDayKey
    ? (dayEntriesByKey.get(selectedMapDayKey) ?? [])
    : []
  const selectedDayLocationEntries = selectedDayEntries.filter(
    (entry) => entry.location,
  )
  const optimizedDayLocationEntries = useMemo(
    () => buildOptimizedRoute(selectedDayLocationEntries),
    [selectedDayLocationEntries],
  )
  const activeDayLocationEntries =
    routeMode === 'optimized'
      ? optimizedDayLocationEntries.map((entry, index) => ({
          ...entry,
          order: index + 1,
        }))
      : selectedDayLocationEntries
  const entriesWithoutLocation = selectedDayEntries.filter(
    (entry) => !entry.location,
  )
  const selectedDayMarkerPoints = activeDayLocationEntries.map(
    (entry) =>
      [entry.location!.latitude, entry.location!.longitude] as [number, number],
  )
  const selectedDay = days.find((day) => getDateKey(day) === selectedMapDayKey)
  const selectedDayMapTitle = selectedDay
    ? `${format(selectedDay, 'dd MMMM')} rotası`
    : 'Günlük rota'
  const activeRouteColor = routeMode === 'optimized' ? '#0f766e' : '#2563eb'
  const googleMapsRouteUrl = buildGoogleMapsRouteUrl(activeDayLocationEntries)

  useEffect(() => {
    if (!selectedMapDayKey) {
      setRouteMode('plan')
    }
  }, [selectedMapDayKey])

  useEffect(() => {
    const map = selectedDayMapRef.current
    if (!map || selectedDayMarkerPoints.length === 0) return

    if (selectedDayMarkerPoints.length === 1) {
      map.setView(
        selectedDayMarkerPoints[0],
        Math.max(map.getZoom?.() ?? 13, 14),
      )
      return
    }

    map.fitBounds(selectedDayMarkerPoints, {
      padding: [40, 40],
    })
  }, [selectedDayMarkerPoints, selectedMapDayKey])

  const sourceItemsById = useMemo(
    () => new Map((sourceItems ?? []).map((item) => [item.id, item])),
    [sourceItems],
  )

  const plansById = useMemo(
    () =>
      new Map(plans.filter((plan) => plan.id).map((plan) => [plan.id!, plan])),
    [plans],
  )

  const selectedPayloadLabel = useMemo(() => {
    if (!selectedPayload) return ''

    if (selectedPayload.type === 'source') {
      return sourceItemsById.get(selectedPayload.id)?.title ?? 'Kayıt'
    }

    return getPlanLabel(plansById.get(selectedPayload.id) ?? {})
  }, [plansById, selectedPayload, sourceItemsById])

  const handleMobileAssign = (day: Date, slot: SlotDefinition) => {
    if (!selectedPayload || readOnly || !onDropToSlot) return
    onDropToSlot(selectedPayload, day, slot)
    setSelectedPayload(null)
  }

  const renderDayLocationButton = (day: Date) => {
    const dayKey = getDateKey(day)
    const dayEntries = dayEntriesByKey.get(dayKey) ?? []
    const hasPlans = dayEntries.length > 0
    const hasLocations = dayEntries.some((entry) => entry.location)

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={!hasPlans}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        title={
          hasLocations
            ? 'Günün rotasını haritada göster'
            : 'Bu gün için gösterilecek konum yok'
        }
        aria-label={
          hasLocations
            ? 'Günün rotasını haritada göster'
            : 'Bu gün için gösterilecek konum yok'
        }
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!hasPlans) return
          setRouteMode('plan')
          setSelectedMapDayKey(dayKey)
        }}
      >
        <MapPinned className="h-3.5 w-3.5" />
      </Button>
    )
  }

  const renderSourceItems = () => {
    if (!sourceItems) return null

    return (
      <Card className="min-h-0">
        <CardHeader className="gap-3">
          <CardTitle>{sourceTitle}</CardTitle>
          {sourceToolbar ? <div>{sourceToolbar}</div> : null}
        </CardHeader>
        <CardContent className="min-h-0 pb-4">
          <ScrollArea
            className={cn(
              'pr-3',
              isMobile ? 'h-auto max-h-72' : 'h-[calc(100vh-18rem)]',
            )}
          >
            <div className="space-y-2">
              {sourceItems.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  {sourceEmptyText || 'Kayıt bulunamadı'}
                </div>
              ) : (
                sourceItems.map((item) => {
                  const isSelected =
                    selectedPayload?.type === 'source' &&
                    selectedPayload.id === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      draggable={!readOnly && !isMobile}
                      onClick={() => {
                        if (readOnly || !onDropToSlot) return
                        setSelectedPayload({ type: 'source', id: item.id })
                      }}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          'application/json',
                          serializePayload({ type: 'source', id: item.id }),
                        )
                        event.dataTransfer.effectAllowed = 'copyMove'
                      }}
                      className={cn(
                        'flex w-full flex-col rounded-xl border bg-card px-3 py-3 text-left transition hover:border-primary/40 hover:bg-muted/40',
                        isSelected && 'border-primary bg-primary/5',
                      )}
                    >
                      <span className="font-medium text-foreground">
                        {item.title}
                      </span>
                      {item.subtitle ? (
                        <span className="text-sm text-muted-foreground">
                          {item.subtitle}
                        </span>
                      ) : null}
                      {item.detail ? (
                        <span className="mt-2 text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      ) : null}
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  const renderMobileBoard = () => (
    <Card className="min-w-0">
      {title || titleToolbar ? (
        <CardHeader className="gap-3">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {titleToolbar ? <div>{titleToolbar}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4 pb-4">
        {!readOnly && onDropToSlot ? (
          <div className="rounded-xl border bg-muted/30 px-3 py-3 text-sm">
            <p className="font-medium text-foreground">
              {selectedPayload
                ? 'Seçim hazır'
                : 'Planlamak için bir kayıt seçin'}
            </p>
            <p className="mt-1 text-muted-foreground">
              {selectedPayload
                ? `${selectedPayloadLabel} için uygun günü ve saati seçin.`
                : 'Listeden firma veya kişiyi seçip uygun saate dokunun.'}
            </p>
            {selectedPayload ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto px-0 text-sm"
                onClick={() => setSelectedPayload(null)}
              >
                Seçimi temizle
              </Button>
            ) : null}
          </div>
        ) : null}

        <Accordion
          type="single"
          collapsible
          defaultValue={days[0] ? getDateKey(days[0]) : undefined}
          className="rounded-xl border px-4"
        >
          {days.map((day) => {
            const dayKey = getDateKey(day)
            const dayPlanCount = slots.reduce((count, slot) => {
              const slotKey = `${dayKey}|${slot.start}`
              return count + (planMap.get(slotKey)?.length ?? 0)
            }, 0)

            return (
              <AccordionItem key={day.toISOString()} value={dayKey}>
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex w-full items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {format(day, 'dd MMMM')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'EEEE')} • {dayPlanCount} plan
                      </div>
                    </div>
                    {renderDayLocationButton(day)}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {slots.map((slot) => {
                    const slotKey = `${dayKey}|${slot.start}`
                    const slotPlans = planMap.get(slotKey) ?? []

                    return (
                      <div
                        key={slotKey}
                        className="rounded-xl border bg-background px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-foreground">
                            {slot.label}
                          </div>
                          {!readOnly && onDropToSlot ? (
                            <Button
                              size="sm"
                              variant={selectedPayload ? 'default' : 'outline'}
                              disabled={!selectedPayload}
                              onClick={() => handleMobileAssign(day, slot)}
                            >
                              Buraya ekle
                            </Button>
                          ) : null}
                        </div>

                        {slotPlans.length === 0 ? (
                          <div className="mt-3 text-xs text-muted-foreground">
                            Bu saat için plan yok.
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {slotPlans.map((plan) => {
                              const draggable =
                                !!plan.id &&
                                !readOnly &&
                                (canDragPlan?.(plan) ?? true)
                              const isSelected =
                                selectedPayload?.type === 'plan' &&
                                selectedPayload.id === plan.id

                              return (
                                <FieldSalesPlanCard
                                  key={
                                    plan.id ??
                                    `${slotKey}-${getPlanLabel(plan)}`
                                  }
                                  plan={plan}
                                  draggable={false}
                                  selectable={draggable && !!onDropToSlot}
                                  selected={isSelected}
                                  deletable={canDeletePlan?.(plan) ?? false}
                                  onClick={() => {
                                    if (!draggable || !plan.id || !onDropToSlot)
                                      return
                                    setSelectedPayload({
                                      type: 'plan',
                                      id: plan.id,
                                    })
                                  }}
                                  onDelete={() => {
                                    if (!onDeletePlan) return
                                    onDeletePlan(plan)
                                  }}
                                />
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )

  const renderDesktopBoard = () => (
    <Card className="min-w-0">
      {title || titleToolbar ? (
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {titleToolbar ? (
            <div className="w-full sm:w-auto">{titleToolbar}</div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="min-w-0 pb-4">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
          <div
            className="grid min-w-max"
            style={{
              gridTemplateColumns: `120px repeat(${days.length}, minmax(220px, 1fr))`,
            }}
          >
            <div className="sticky left-0 top-0 z-20 border-b bg-muted/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              Saat
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="sticky top-0 z-10 border-b border-l bg-muted/80 px-4 py-3 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {format(day, 'dd MMMM')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEEE')}
                    </div>
                  </div>
                  {renderDayLocationButton(day)}
                </div>
              </div>
            ))}

            {slots.map((slot) => (
              <div key={slot.key} className="contents">
                <div className="sticky left-0 z-10 border-t bg-background px-4 py-4 text-sm font-medium text-muted-foreground">
                  {slot.label}
                </div>
                {days.map((day) => {
                  const dateKey = getDateKey(day)
                  const slotKey = `${dateKey}|${slot.start}`
                  const slotPlans = planMap.get(slotKey) ?? []

                  return (
                    <div
                      key={`${slotKey}-cell`}
                      className="min-h-24 border-t border-l bg-background/80 p-2"
                      onDragOver={(event) => {
                        if (readOnly || !onDropToSlot) return
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(event) => {
                        if (readOnly || !onDropToSlot) return
                        event.preventDefault()
                        const payload = parsePayload(
                          event.dataTransfer.getData('application/json'),
                        )
                        if (!payload) return
                        onDropToSlot(payload, day, slot)
                      }}
                    >
                      <div className="space-y-2">
                        {slotPlans.map((plan) => {
                          const draggable =
                            !!plan.id &&
                            !readOnly &&
                            (canDragPlan?.(plan) ?? true)

                          return (
                            <FieldSalesPlanCard
                              key={
                                plan.id ?? `${slotKey}-${getPlanLabel(plan)}`
                              }
                              plan={plan}
                              draggable={draggable}
                              deletable={canDeletePlan?.(plan) ?? false}
                              onDelete={() => {
                                if (!onDeletePlan) return
                                onDeletePlan(plan)
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  return (
    <>
      <div
        className={cn(
          'grid gap-4',
          sourceItems ? 'xl:grid-cols-[320px_minmax(0,1fr)]' : 'grid-cols-1',
          className,
        )}
      >
        {renderSourceItems()}
        {isMobile ? renderMobileBoard() : renderDesktopBoard()}
      </div>

      <Dialog
        open={selectedMapDayKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMapDayKey(null)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="gap-3 border-b px-6 py-4 pr-12">
            <div className="space-y-1">
              <DialogTitle>{selectedDayMapTitle}</DialogTitle>
              <DialogDescription>
                {selectedDayLocationEntries.length > 0
                  ? `${selectedDayEntries.length} planın ${selectedDayLocationEntries.length} konumu haritada gösteriliyor.`
                  : 'Bu gün için haritada gösterilecek konum bulunmuyor.'}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={routeMode === 'plan' ? 'default' : 'outline'}
                onClick={() => setRouteMode('plan')}
              >
                Plan sırası
              </Button>
              <Button
                type="button"
                size="sm"
                variant={routeMode === 'optimized' ? 'default' : 'outline'}
                disabled={selectedDayLocationEntries.length < 2}
                onClick={() => setRouteMode('optimized')}
              >
                Önerilen rota
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!googleMapsRouteUrl}
                onClick={() => {
                  if (!googleMapsRouteUrl) return
                  window.open(
                    googleMapsRouteUrl,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }}
              >
                Google Maps'te Aç
              </Button>
            </div>
          </DialogHeader>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="border-b lg:border-r lg:border-b-0">
              {selectedDayLocationEntries.length > 0 ? (
                <div className="h-[42vh] min-h-[320px] lg:h-[68vh]">
                  <DocyrusMap
                    ref={selectedDayMapRef}
                    center={selectedDayMarkerPoints[0] ?? [39, 35]}
                    zoom={13}
                    className="min-h-full rounded-none"
                  >
                    <MapTileLayer />
                    <MapZoomControl />
                    {selectedDayMarkerPoints.length > 1 ? (
                      <MapPolyline
                        positions={selectedDayMarkerPoints}
                        pathOptions={{
                          color: activeRouteColor,
                          weight: 5,
                          opacity: 0.85,
                          dashArray:
                            routeMode === 'optimized' ? undefined : '10 8',
                        }}
                      />
                    ) : null}
                    {activeDayLocationEntries.map((entry) => (
                      <MapMarker
                        key={
                          entry.plan.id ?? `${selectedMapDayKey}-${entry.order}`
                        }
                        position={[
                          entry.location!.latitude,
                          entry.location!.longitude,
                        ]}
                        icon={
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ring-2 ring-background"
                            style={{ backgroundColor: activeRouteColor }}
                          >
                            {entry.order}
                          </div>
                        }
                      >
                        <MapPopup>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-foreground">
                              {entry.order}. {entry.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.timeLabel || 'Saat belirtilmedi'}
                            </div>
                            {entry.location?.label ? (
                              <div className="text-xs text-muted-foreground">
                                {entry.location.label}
                              </div>
                            ) : null}
                          </div>
                        </MapPopup>
                      </MapMarker>
                    ))}
                  </DocyrusMap>
                </div>
              ) : (
                <div className="flex h-[42vh] min-h-[320px] items-center justify-center px-6 text-center text-sm text-muted-foreground lg:h-[68vh]">
                  Bu gün için konumu kayıtlı plan bulunmuyor.
                </div>
              )}
            </div>

            <ScrollArea className="h-[32vh] lg:h-[68vh]">
              <div className="space-y-4 p-4">
                {selectedDayEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Bu gün için plan yok.
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-foreground">
                          {routeMode === 'optimized'
                            ? 'Önerilen ziyaret sırası'
                            : 'Planlanan ziyaret sırası'}
                        </div>
                        <Badge variant="secondary" className="text-[11px]">
                          {activeDayLocationEntries.length} konum
                        </Badge>
                      </div>
                      {activeDayLocationEntries.map((entry) => (
                        <div
                          key={
                            entry.plan.id ??
                            `${selectedMapDayKey}-list-${entry.order}`
                          }
                          className="rounded-xl border bg-card px-3 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: activeRouteColor }}
                            >
                              {entry.order}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="text-sm font-semibold text-foreground">
                                {entry.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.timeLabel || 'Saat belirtilmedi'}
                              </div>
                              {entry.location?.label ? (
                                <div className="text-xs text-muted-foreground">
                                  {entry.location.label}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {entriesWithoutLocation.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-foreground">
                          Konumu eksik olan planlar
                        </div>
                        {entriesWithoutLocation.map((entry) => (
                          <div
                            key={
                              entry.plan.id ??
                              `${selectedMapDayKey}-missing-${entry.order}`
                            }
                            className="rounded-xl border border-dashed bg-card px-3 py-3"
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-foreground">
                                {entry.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.timeLabel || 'Saat belirtilmedi'}
                              </div>
                              <Badge
                                variant="outline"
                                className="mt-1 text-[11px]"
                              >
                                Konum yok
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
