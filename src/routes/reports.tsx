import { Suspense, lazy, useState } from 'react'

import type { DateRangePreset } from '@/hooks/use-report-query'

import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger
} from '@/components/animate-ui/components/radix/tabs'
import { ReportDateRangeFilter } from '@/components/reports/report-date-range-filter'
import { Skeleton } from '@/components/ui/skeleton'
import { getDateRange } from '@/hooks/use-report-query'

const RevenuePipelineTab = lazy(() => import('@/components/reports/revenue-pipeline-tab').then(m => ({
    default: m.RevenuePipelineTab
  })))
const LeadAnalyticsTab = lazy(() => import('@/components/reports/lead-analytics-tab').then(m => ({
    default: m.LeadAnalyticsTab
  })))
const OrdersProductsTab = lazy(() => import('@/components/reports/orders-products-tab').then(m => ({
    default: m.OrdersProductsTab
  })))
const ActivityProductivityTab = lazy(() => import('@/components/reports/activity-productivity-tab').then(m => ({
    default: m.ActivityProductivityTab
  })))

function TabFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

export function Reports() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<DateRangePreset>('this_year')
  const dateRange = getDateRange(preset)

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
        actions={<ReportDateRangeFilter value={preset} onChange={setPreset} />} />
      <PageContainer className="space-y-6">
        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">
              {t('reports.tabs.revenuePipeline')}
            </TabsTrigger>
            <TabsTrigger value="leads">
              {t('reports.tabs.leadAnalytics')}
            </TabsTrigger>
            <TabsTrigger value="orders">
              {t('reports.tabs.ordersProducts')}
            </TabsTrigger>
            <TabsTrigger value="activity">
              {t('reports.tabs.activity')}
            </TabsTrigger>
          </TabsList>

          <TabsContents className="mt-4">
            <TabsContent value="revenue">
              <Suspense fallback={<TabFallback />}>
                <RevenuePipelineTab dateRange={dateRange} />
              </Suspense>
            </TabsContent>

            <TabsContent value="leads">
              <Suspense fallback={<TabFallback />}>
                <LeadAnalyticsTab dateRange={dateRange} />
              </Suspense>
            </TabsContent>

            <TabsContent value="orders">
              <Suspense fallback={<TabFallback />}>
                <OrdersProductsTab dateRange={dateRange} />
              </Suspense>
            </TabsContent>

            <TabsContent value="activity">
              <Suspense fallback={<TabFallback />}>
                <ActivityProductivityTab dateRange={dateRange} />
              </Suspense>
            </TabsContent>
          </TabsContents>
        </Tabs>
      </PageContainer>
    </>
  )
}
