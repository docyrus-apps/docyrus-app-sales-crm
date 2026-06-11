import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFieldSalesPlans } from '@/hooks/use-field-sales'
import { getFieldSalesPlanStatusCode, getStatusMeta } from '@/lib/field-sales'
import { useBaseTaskCollection } from '@/collections'

type PlanRecord = {
  id?: string
  subject?: string
  start_date?: string
  end_date?: string
  status?: unknown
  organization?: any
  contact?: any
}

type TaskRecord = {
  id?: string
  name?: string
  start_date?: string
  end_date?: string
  status?: unknown
}

function getDateToken(value: string | undefined) {
  return value ? format(parseISO(value), 'yyyy-MM-dd') : ''
}

export function FieldSalesCalendarPage() {
  const taskCollection = useBaseTaskCollection()
  const { data: plans = [] } = useFieldSalesPlans()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const { data: tasks = [] } = useQuery({
    queryKey: ['field-sales', 'calendar', 'tasks'],
    queryFn: async () =>
      taskCollection.list({
        columns: ['id', 'name', 'start_date', 'end_date', 'status'],
        orderBy: 'start_date ASC',
        limit: 500,
      }),
  })

  const monthDays = useMemo(() => {
    const rangeStart = startOfWeek(startOfMonth(currentMonth), {
      weekStartsOn: 1,
    })
    const rangeEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  }, [currentMonth])

  const selectedToken = format(selectedDate, 'yyyy-MM-dd')
  const selectedPlans = (plans as Array<PlanRecord>).filter(
    (plan) => getDateToken(plan.start_date) === selectedToken,
  )
  const selectedTasks = (tasks as Array<TaskRecord>).filter(
    (task) => getDateToken(task.start_date) === selectedToken,
  )

  return (
    <>
      <PageHeader
        title="Saha Takvimi"
        icon={<CalendarDays className="h-4 w-4 text-cyan-500" />}
        titleSuffix={
          <Badge variant="secondary">{format(currentMonth, 'MMMM yyyy')}</Badge>
        }
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth((value) => addMonths(value, -1))}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Bugün
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
            >
              Sonraki
            </Button>
          </div>
        }
      />
      <PageContainer className="grid gap-4 overflow-x-hidden px-3 sm:px-4 lg:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Aylık görünüm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[42rem]">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'].map(
                    (label) => (
                      <div key={label} className="px-2 py-2">
                        {label}
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {monthDays.map((day) => {
                    const dayToken = format(day, 'yyyy-MM-dd')
                    const dayPlans = (plans as Array<PlanRecord>).filter(
                      (plan) => getDateToken(plan.start_date) === dayToken,
                    )
                    const visitCount = dayPlans.filter((plan) => {
                      const statusCode = getFieldSalesPlanStatusCode(
                        plan.status,
                      )
                      return (
                        statusCode === 'checked_in' ||
                        statusCode === 'completed'
                      )
                    }).length
                    const dayTasks = (tasks as Array<TaskRecord>).filter(
                      (task) => getDateToken(task.start_date) === dayToken,
                    )
                    const isSelected = selectedToken === dayToken

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-32 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/30 hover:bg-muted/40'
                        } ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}`}
                      >
                        <div className="text-sm font-semibold">
                          {format(day, 'dd')}
                        </div>
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="rounded-lg bg-muted px-2 py-1">
                            Plan:{' '}
                            <span className="font-semibold">
                              {dayPlans.length}
                            </span>
                          </div>
                          <div className="rounded-lg bg-muted px-2 py-1">
                            Ziyaret:{' '}
                            <span className="font-semibold">{visitCount}</span>
                          </div>
                          <div className="rounded-lg bg-muted px-2 py-1">
                            Görev:{' '}
                            <span className="font-semibold">
                              {dayTasks.length}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{format(selectedDate, 'dd MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[55vh] pr-3 xl:h-[calc(100vh-18rem)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Planlar
                  </div>
                  {selectedPlans.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                      Bu gün için plan bulunmuyor.
                    </div>
                  ) : (
                    selectedPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="rounded-xl border px-3 py-3"
                      >
                        <div className="font-medium">
                          {plan.subject || 'Plan'}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {plan.organization?.name ||
                            plan.contact?.name ||
                            'İlişkili kayıt yok'}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline">
                            {getStatusMeta(plan.status).name}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Görevler
                  </div>
                  {selectedTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                      Bu gün için görev bulunmuyor.
                    </div>
                  ) : (
                    selectedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl border px-3 py-3"
                      >
                        <div className="font-medium">
                          {task.name || 'Görev'}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline">
                            {getStatusMeta(task.status).name || 'Açık'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
