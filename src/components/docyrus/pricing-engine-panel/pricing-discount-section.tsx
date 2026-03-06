'use client'

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'

export function PricingDiscountSection() {
  const {
    globalDiscountPercent,
    adjustment,
    config,
    readOnly,
    locale,
    setGlobalDiscountPercent,
    setAdjustment,
  } = usePricingEngine()

  const showGlobalDiscount = config.enableGlobalDiscount
  const showAdjustment = config.enableAdjustment

  if (!showGlobalDiscount && !showAdjustment) return null

  return (
    <>
      <Separator />
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        {showGlobalDiscount && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {tUi(locale, 'pepGlobalDiscount')}
            </label>
            <div className="relative">
              <Input
                type="number"
                value={globalDiscountPercent || ''}
                onChange={(e) => {
                  const val = Number.parseFloat(e.target.value)

                  setGlobalDiscountPercent(Number.isNaN(val) ? 0 : val)
                }}
                className="h-8 w-[80px] pr-6 text-right"
                min={0}
                max={100}
                disabled={readOnly}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
        )}

        {showAdjustment && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {tUi(locale, 'pepAdjustment')}
            </label>
            <Input
              type="number"
              value={adjustment || ''}
              onChange={(e) => {
                const val = Number.parseFloat(e.target.value)

                setAdjustment(Number.isNaN(val) ? 0 : val)
              }}
              className="h-8 w-[120px] text-right"
              step="0.01"
              disabled={readOnly}
            />
          </div>
        )}
      </div>
    </>
  )
}
