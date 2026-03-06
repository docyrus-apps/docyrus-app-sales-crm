import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { DateRangePreset } from '@/hooks/use-report-query'

interface ReportDateRangeFilterProps {
  value: DateRangePreset
  onChange: (preset: DateRangePreset) => void
}

const PRESETS: Array<{ value: DateRangePreset; labelKey: string }> = [
  { value: '7d', labelKey: 'reports.dateRange.7d' },
  { value: '30d', labelKey: 'reports.dateRange.30d' },
  { value: '90d', labelKey: 'reports.dateRange.90d' },
  { value: 'this_quarter', labelKey: 'reports.dateRange.thisQuarter' },
  { value: 'this_year', labelKey: 'reports.dateRange.thisYear' },
  { value: '12mo', labelKey: 'reports.dateRange.12mo' },
]

export function ReportDateRangeFilter({
  value,
  onChange,
}: ReportDateRangeFilterProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((preset) => (
        <Button
          key={preset.value}
          variant={value === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(preset.value)}
        >
          {t(preset.labelKey)}
        </Button>
      ))}
    </div>
  )
}
