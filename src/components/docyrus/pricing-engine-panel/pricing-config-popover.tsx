'use client'

import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'

export function PricingConfigPopover() {
  const { config, setConfig, readOnly, locale } = usePricingEngine()

  if (readOnly) return null

  const toggles: Array<{
    key: string
    label: string
    value: boolean
    onChange: (v: boolean) => void
  }> = [
    {
      key: 'showVatColumn',
      label: tUi(locale, 'pepShowVat'),
      value: config.showVatColumn,
      onChange: (v) => setConfig({ showVatColumn: v }),
    },
    {
      key: 'showDiscountColumn',
      label: tUi(locale, 'pepShowDiscount'),
      value: config.showDiscountColumn,
      onChange: (v) => setConfig({ showDiscountColumn: v }),
    },
    {
      key: 'showGrossColumn',
      label: tUi(locale, 'pepShowGross'),
      value: config.showGrossColumn,
      onChange: (v) => setConfig({ showGrossColumn: v }),
    },
    {
      key: 'showCategoryColumn',
      label: tUi(locale, 'pepShowCategory'),
      value: config.showCategoryColumn,
      onChange: (v) => setConfig({ showCategoryColumn: v }),
    },
    {
      key: 'enableVat',
      label: tUi(locale, 'pepEnableVat'),
      value: config.enableVat,
      onChange: (v) => setConfig({ enableVat: v }),
    },
    {
      key: 'enableLineDiscount',
      label: tUi(locale, 'pepEnableLineDiscount'),
      value: config.enableLineDiscount,
      onChange: (v) => setConfig({ enableLineDiscount: v }),
    },
    {
      key: 'enableGlobalDiscount',
      label: tUi(locale, 'pepEnableGlobalDiscount'),
      value: config.enableGlobalDiscount,
      onChange: (v) => setConfig({ enableGlobalDiscount: v }),
    },
    {
      key: 'enableAdjustment',
      label: tUi(locale, 'pepEnableAdjustment'),
      value: config.enableAdjustment,
      onChange: (v) => setConfig({ enableAdjustment: v }),
    },
    {
      key: 'discountBeforeVat',
      label: tUi(locale, 'pepDiscountBeforeVat'),
      value: config.discountBeforeVat,
      onChange: (v) => setConfig({ discountBeforeVat: v }),
    },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <h4 className="mb-3 text-sm font-semibold">
          {tUi(locale, 'pepConfiguration')}
        </h4>
        <div className="space-y-3">
          {toggles.map((toggle, i) => (
            <div key={toggle.key}>
              <div className="flex items-center justify-between">
                <label className="text-sm">{toggle.label}</label>
                <Switch
                  checked={toggle.value}
                  onCheckedChange={toggle.onChange}
                />
              </div>
              {i === 3 && <Separator className="mt-3" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
