'use client'

import { useId } from 'react'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts'

import { cn } from '@/lib/utils'

import { normalizeChartData, resolveAccentColor } from './awesome-stats-utils'
import { type AwesomeStatMiniChart } from './types'

function AwesomeStatsChart({
  miniChart,
  color,
  className,
}: {
  miniChart: AwesomeStatMiniChart
  color?: string
  className?: string
}) {
  const chartId = useId()
  const accentColor = resolveAccentColor(color)
  const data = normalizeChartData(miniChart)
  const dataKey = miniChart.dataKey ?? 'value'

  return (
    <div className={cn('h-full w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {miniChart.type === 'bar' ? (
          <BarChart
            data={data}
            margin={{
              top: 2,
              right: 2,
              bottom: 2,
              left: 2,
            }}
          >
            <Bar
              dataKey={dataKey}
              fill={accentColor}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        ) : miniChart.type === 'area' ? (
          <AreaChart
            data={data}
            margin={{
              top: 4,
              right: 2,
              bottom: 2,
              left: 2,
            }}
          >
            <defs>
              <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
                <stop
                  offset="100%"
                  stopColor={accentColor}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={accentColor}
              strokeWidth={2}
              fill={`url(#${chartId})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        ) : (
          <LineChart
            data={data}
            margin={{
              top: 4,
              right: 2,
              bottom: 2,
              left: 2,
            }}
          >
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={accentColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export { AwesomeStatsChart }
