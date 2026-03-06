import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Package, PieChartIcon } from 'lucide-react'
import type { PieData } from '@/components/charts/pie-context'
import { BarChart } from '@/components/charts/bar-chart'
import { Bar } from '@/components/charts/bar'
import { BarXAxis } from '@/components/charts/bar-x-axis'
import { Grid } from '@/components/charts/grid'
import { ChartTooltip } from '@/components/charts/tooltip'
import { PieChart } from '@/components/charts/pie-chart'
import { PieSlice } from '@/components/charts/pie-slice'
import { PieCenter } from '@/components/charts/pie-center'
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from '@/components/charts/legend'
import { ReportCard } from './report-card'
import type { DateRange } from '@/hooks/use-report-query'
import {
  buildDateFilter,
  getMonthLabels,
  getMonthIndex,
} from '@/hooks/use-report-query'
import { formatCurrency } from '@/lib/formatters'
import { useQuery } from '@tanstack/react-query'
import {
  useBaseCrmSalesOrderCollection,
  useBaseCrmDealProductCollection,
} from '@/collections'

const COLORS = {
  subTotal: 'hsl(210, 100%, 50%)',
  tax: 'hsl(43, 100%, 57%)',
  product: 'hsl(252, 56%, 68%)',
}

const PIE_COLORS = [
  'hsl(210, 100%, 50%)',
  'hsl(162, 100%, 39%)',
  'hsl(43, 100%, 57%)',
  'hsl(18, 100%, 63%)',
  'hsl(252, 56%, 68%)',
  'hsl(140, 45%, 65%)',
]

interface OrdersProductsTabProps {
  dateRange: DateRange
}

export function OrdersProductsTab({ dateRange }: OrdersProductsTabProps) {
  const { t } = useTranslation()
  const filters = buildDateFilter(dateRange)
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const dealProductCollection = useBaseCrmDealProductCollection()

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: [
      'reports',
      'sales-orders',
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: () =>
      salesOrderCollection.list({
        filters,
        columns: ['id', 'sub_total', 'tax_total', 'grand_total', 'created_on'],
        limit: 10000,
      }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: dealProducts, isLoading: productsLoading } = useQuery({
    queryKey: [
      'reports',
      'deal-products',
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: () =>
      dealProductCollection.list({
        filters,
        columns: [
          'id',
          'product(id,name)',
          'category',
          'net_total',
          'created_on',
        ],
        limit: 10000,
      }),
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = ordersLoading || productsLoading
  const monthLabels = useMemo(() => getMonthLabels(dateRange), [dateRange])

  // 3.1 Sales Order Revenue
  const orderRevenueData = useMemo(() => {
    if (!orders) return []
    const buckets = monthLabels.map((label) => ({
      month: label,
      sub_total: 0,
      tax: 0,
    }))

    for (const order of orders as Array<any>) {
      const dateStr = order.created_on
      if (!dateStr) continue
      const idx = getMonthIndex(dateStr, dateRange.from)
      if (idx < 0 || idx >= buckets.length) continue

      buckets[idx]!.sub_total += Number(order.sub_total ?? 0)
      buckets[idx]!.tax += Number(order.tax_total ?? 0)
    }
    return buckets
  }, [orders, monthLabels, dateRange])

  // 3.2 Top Products by Revenue
  const topProductsData = useMemo(() => {
    if (!dealProducts) return []
    const productMap: Record<string, { product: string; revenue: number }> = {}

    for (const dp of dealProducts as Array<any>) {
      const productName =
        typeof dp.product === 'object'
          ? dp.product?.name
          : dp.product || 'Unknown'
      if (!productMap[productName]) {
        productMap[productName] = { product: productName, revenue: 0 }
      }
      productMap[productName]!.revenue += Number(dp.net_total ?? 0)
    }

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [dealProducts])

  // 3.3 Product Category Breakdown
  const categoryData = useMemo(() => {
    if (!dealProducts) return [] as Array<PieData>
    const catMap: Record<string, number> = {}

    for (const dp of dealProducts as Array<any>) {
      const catName =
        typeof dp.category === 'object'
          ? dp.category?.name
          : dp.category || 'Uncategorized'
      catMap[catName] = (catMap[catName] || 0) + Number(dp.net_total ?? 0)
    }

    return Object.entries(catMap).map(([label, value], i) => ({
      label,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))
  }, [dealProducts])

  const [hoveredCatIdx, setHoveredCatIdx] = useState<number | null>(null)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 3.1 Sales Order Revenue */}
      <ReportCard
        title={t('reports.salesOrderRevenue')}
        icon={<DollarSign className="size-4" />}
        isLoading={isLoading}
        isEmpty={orderRevenueData.length === 0}
      >
        <BarChart
          data={orderRevenueData as Array<Record<string, unknown>>}
          xDataKey="month"
          stacked
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="sub_total" fill={COLORS.subTotal} lineCap="round" />
          <Bar dataKey="tax" fill={COLORS.tax} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.subTotal,
                label: t('reports.subtotal'),
                value: formatCurrency(Number(point.sub_total ?? 0)),
              },
              {
                color: COLORS.tax,
                label: t('reports.tax'),
                value: formatCurrency(Number(point.tax ?? 0)),
              },
            ]}
          />
        </BarChart>
      </ReportCard>

      {/* 3.2 Top Products by Revenue */}
      <ReportCard
        title={t('reports.topProductsByRevenue')}
        icon={<Package className="size-4" />}
        isLoading={isLoading}
        isEmpty={topProductsData.length === 0}
      >
        <BarChart
          data={topProductsData as Array<Record<string, unknown>>}
          xDataKey="product"
          orientation="horizontal"
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="revenue" fill={COLORS.product} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.product,
                label: String(point.product ?? ''),
                value: formatCurrency(Number(point.revenue ?? 0)),
              },
            ]}
          />
        </BarChart>
      </ReportCard>

      {/* 3.3 Product Category Breakdown */}
      <ReportCard
        title={t('reports.productCategoryBreakdown')}
        icon={<PieChartIcon className="size-4" />}
        isLoading={isLoading}
        isEmpty={categoryData.length === 0}
      >
        <div className="flex items-center gap-6">
          <PieChart
            data={categoryData}
            size={200}
            innerRadius={55}
            padAngle={0.03}
            cornerRadius={4}
            hoveredIndex={hoveredCatIdx}
            onHoverChange={setHoveredCatIdx}
          >
            {categoryData.map((_, index) => (
              <PieSlice key={index} index={index} hoverEffect="grow" />
            ))}
            <PieCenter defaultLabel={t('reports.categories')} />
          </PieChart>
          <Legend
            items={categoryData.map((r) => ({
              label: r.label,
              value: r.value,
              color: r.color ?? '',
              maxValue: categoryData.reduce((s, d) => s + d.value, 0),
            }))}
            hoveredIndex={hoveredCatIdx}
            onHoverChange={setHoveredCatIdx}
            className="flex-1"
          >
            <LegendItem className="flex items-center gap-2">
              <LegendMarker className="size-2.5 rounded-full" />
              <LegendLabel className="flex-1 text-sm" />
              <LegendValue className="text-sm font-medium tabular-nums" />
            </LegendItem>
          </Legend>
        </div>
      </ReportCard>
    </div>
  )
}
