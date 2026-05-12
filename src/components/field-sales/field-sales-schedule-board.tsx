import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  getDateKey,
  getRelationName,
  getSlotKeyFromIso,
  getStatusMeta,
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
}

export interface FieldSalesBoardDropPayload {
  type: 'source' | 'plan'
  id: string
}

interface FieldSalesScheduleBoardProps {
  title?: string
  sourceTitle?: string
  sourceItems?: Array<FieldSalesBoardSourceItem>
  sourceEmptyText?: string
  days: Array<Date>
  slots: Array<SlotDefinition>
  plans: Array<FieldSalesBoardPlanItem>
  readOnly?: boolean
  className?: string
  canDragPlan?: (plan: FieldSalesBoardPlanItem) => boolean
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

export function FieldSalesScheduleBoard({
  title,
  sourceTitle,
  sourceItems,
  sourceEmptyText,
  days,
  slots,
  plans,
  readOnly = false,
  className,
  canDragPlan,
  onDropToSlot,
}: FieldSalesScheduleBoardProps) {
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

  return (
    <div
      className={cn(
        'grid gap-4',
        sourceItems ? 'xl:grid-cols-[320px_minmax(0,1fr)]' : 'grid-cols-1',
        className,
      )}
    >
      {sourceItems ? (
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>{sourceTitle}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 pb-4">
            <ScrollArea className="h-[calc(100vh-18rem)] pr-3">
              <div className="space-y-2">
                {sourceItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    {sourceEmptyText || 'Kayıt bulunamadı'}
                  </div>
                ) : (
                  sourceItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      draggable={!readOnly}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          'application/json',
                          serializePayload({ type: 'source', id: item.id }),
                        )
                        event.dataTransfer.effectAllowed = 'copyMove'
                      }}
                      className="flex w-full flex-col rounded-xl border bg-card px-3 py-3 text-left transition hover:border-primary/40 hover:bg-muted/40"
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
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}

      <Card className="min-w-0">
        {title ? (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
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
                  <div className="text-sm font-semibold text-foreground">
                    {format(day, 'dd MMMM')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEEE')}
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
                            const status = getStatusMeta(plan.status)
                            const eventType = getStatusMeta(plan.event_type)
                            const draggable =
                              !!plan.id &&
                              !readOnly &&
                              (canDragPlan?.(plan) ?? true)

                            return (
                              <div
                                key={
                                  plan.id ?? `${slotKey}-${getPlanLabel(plan)}`
                                }
                                draggable={draggable}
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
                                  'rounded-xl border bg-card px-3 py-2 shadow-sm',
                                  draggable
                                    ? 'cursor-grab active:cursor-grabbing'
                                    : 'cursor-default opacity-80',
                                )}
                              >
                                <div className="text-sm font-semibold text-foreground">
                                  {getPlanLabel(plan)}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {eventType.name ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-[11px]"
                                    >
                                      {eventType.name}
                                    </Badge>
                                  ) : null}
                                  {status.name ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[11px]"
                                    >
                                      {status.name}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
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
    </div>
  )
}
