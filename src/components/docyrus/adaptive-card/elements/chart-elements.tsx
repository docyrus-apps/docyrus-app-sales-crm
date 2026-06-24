'use client'

// @ts-nocheck
/* eslint-disable */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  type AdaptiveCardChartDonut,
  type AdaptiveCardChartGauge,
  type AdaptiveCardChartHorizontalBar,
  type AdaptiveCardChartLine,
  type AdaptiveCardChartPie,
  type AdaptiveCardChartVerticalBar,
} from '../adaptive-card-types'

import { pickColor, resolveColor } from '../lib/chart-palette'
import { ChartFrame, formatChartValue } from './chart-shared'

interface ColoredDatum {
  name: string
  value: number
  color: string
  legend?: string
}

function buildColoredData(
  data:
    | Array<{
        x?: string | number
        y: number
        color?: string
        legend?: string
      }>
    | undefined,
  colorSet: 'categorical' | 'sequential' | 'divergent' | undefined,
  explicitColor: string | undefined,
): Array<ColoredDatum> {
  return (data ?? []).map((point, idx) => ({
    name: String(point.x ?? point.legend ?? idx + 1),
    value: point.y,
    color: pickColor(idx, point.color ?? explicitColor, colorSet),
    legend: point.legend,
  }))
}

export function ChartVerticalBarElement({
  element,
}: {
  element: AdaptiveCardChartVerticalBar
}) {
  const colored = buildColoredData(
    element.data,
    element.colorSet,
    element.color,
  )

  return (
    <ChartFrame
      title={element.title}
      showTitle={element.showTitle}
      maxWidth={element.maxWidth}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={colored}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" className="text-xs" />
          <YAxis
            className="text-xs"
            tickFormatter={(v) => formatChartValue(v, element.valueFormat)}
          />
          <Tooltip
            formatter={(value) =>
              formatChartValue(Number(value), element.valueFormat)
            }
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          />
          {element.showLegend !== false ? <Legend /> : null}
          <Bar
            dataKey="value"
            label={
              element.showBarValues
                ? { position: 'top', fontSize: 11 }
                : undefined
            }
          >
            {colored.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function ChartHorizontalBarElement({
  element,
}: {
  element: AdaptiveCardChartHorizontalBar
}) {
  const colored = buildColoredData(
    element.data,
    element.colorSet,
    element.color,
  )

  return (
    <ChartFrame
      title={element.title}
      showTitle={element.showTitle}
      maxWidth={element.maxWidth}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={colored} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            className="text-xs"
            tickFormatter={(v) => formatChartValue(v, element.valueFormat)}
          />
          <YAxis
            dataKey="name"
            type="category"
            className="text-xs"
            width={80}
          />
          <Tooltip
            formatter={(value) =>
              formatChartValue(Number(value), element.valueFormat)
            }
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          />
          {element.showLegend !== false ? <Legend /> : null}
          <Bar
            dataKey="value"
            label={
              element.showBarValues
                ? { position: 'right', fontSize: 11 }
                : undefined
            }
          >
            {colored.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

function pieChart(
  element: AdaptiveCardChartPie | AdaptiveCardChartDonut,
  innerRadiusPx: number,
) {
  const colored = buildColoredData(
    element.data,
    element.colorSet,
    element.color,
  )

  return (
    <ChartFrame
      title={element.title}
      showTitle={element.showTitle}
      maxWidth={element.maxWidth}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value) =>
              formatChartValue(Number(value), element.valueFormat)
            }
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          />
          {element.showLegend !== false ? <Legend /> : null}
          <Pie
            data={colored}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadiusPx}
            outerRadius="80%"
            paddingAngle={1}
          >
            {colored.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function ChartPieElement({
  element,
}: {
  element: AdaptiveCardChartPie
}) {
  return pieChart(element, 0)
}

export function ChartDonutElement({
  element,
}: {
  element: AdaptiveCardChartDonut
}) {
  const thickness = element.thickness ?? 'medium'
  const inner = thickness === 'thin' ? 65 : thickness === 'thick' ? 35 : 50

  return pieChart(element, inner)
}

export function ChartLineElement({
  element,
}: {
  element: AdaptiveCardChartLine
}) {
  const colored = buildColoredData(
    element.data,
    element.colorSet,
    element.color,
  )
  const stroke = pickColor(0, element.color, element.colorSet)

  return (
    <ChartFrame
      title={element.title}
      showTitle={element.showTitle}
      maxWidth={element.maxWidth}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={colored}>
          {element.showOutlines !== false ? (
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          ) : null}
          <XAxis dataKey="name" className="text-xs" />
          <YAxis
            className="text-xs"
            tickFormatter={(v) => formatChartValue(v, element.valueFormat)}
          />
          <Tooltip
            formatter={(value) =>
              formatChartValue(Number(value), element.valueFormat)
            }
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          />
          {element.showLegend !== false ? <Legend /> : null}
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function ChartGaugeElement({
  element,
}: {
  element: AdaptiveCardChartGauge
}) {
  const min = element.min ?? 0
  const max = element.max ?? 100
  const range = Math.max(0.0001, max - min)
  const clamped = Math.min(max, Math.max(min, element.value))
  const percent = ((clamped - min) / range) * 100
  const fill =
    resolveColor(element.valueColor as string | undefined) ?? '#0078D4'

  /*
   * The gauge can also display custom segments. When present, render as a
   * segmented arc; otherwise render the simple value arc.
   */
  if (element.segments && element.segments.length > 0) {
    const total = element.segments.reduce((sum, seg) => sum + seg.value, 0) || 1
    const segmentData = element.segments.map((seg, idx) => ({
      name: seg.legend ?? `Segment ${idx + 1}`,
      value: (seg.value / total) * 100,
      color:
        resolveColor(seg.color) ?? pickColor(idx, undefined, 'categorical'),
    }))

    return (
      <div className="flex w-full flex-col items-center gap-2">
        {element.showTitle !== false && element.title ? (
          <h4 className="text-sm font-semibold text-foreground">
            {element.title}
          </h4>
        ) : null}
        <div className="relative h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="80%"
              innerRadius="80%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              data={segmentData}
            >
              <RadialBar dataKey="value" background>
                {segmentData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center">
            <span className="text-2xl font-semibold text-foreground">
              {formatChartValue(clamped, element.valueFormat)}
            </span>
            {element.subLabel ? (
              <span className="text-xs text-muted-foreground">
                {element.subLabel}
              </span>
            ) : null}
          </div>
        </div>
        {element.showMinMax ? (
          <div className="flex w-full justify-between text-xs text-muted-foreground">
            <span>{formatChartValue(min, element.valueFormat)}</span>
            <span>{formatChartValue(max, element.valueFormat)}</span>
          </div>
        ) : null}
      </div>
    )
  }

  const gaugeData = [{ name: 'value', value: percent, fill }]

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {element.showTitle !== false && element.title ? (
        <h4 className="text-sm font-semibold text-foreground">
          {element.title}
        </h4>
      ) : null}
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="80%"
            innerRadius="80%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={gaugeData}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background
              fill={fill}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center">
          <span className="text-2xl font-semibold text-foreground">
            {formatChartValue(clamped, element.valueFormat)}
          </span>
          {element.subLabel ? (
            <span className="text-xs text-muted-foreground">
              {element.subLabel}
            </span>
          ) : null}
        </div>
      </div>
      {element.showMinMax ? (
        <div className="flex w-full justify-between text-xs text-muted-foreground">
          <span>{formatChartValue(min, element.valueFormat)}</span>
          <span>{formatChartValue(max, element.valueFormat)}</span>
        </div>
      ) : null}
    </div>
  )
}
