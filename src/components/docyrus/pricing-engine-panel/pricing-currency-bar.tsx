'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import { tUi } from '@/lib/ui-i18n'
import {
  COMMON_CURRENCIES,
  formatMoney,
  getCurrencySymbol,
} from '@/components/docyrus/form-fields/lib/utils'

import { usePricingEngine } from './contexts/pricing-context'
import { convertCurrency } from './lib/calculations'

export function PricingCurrencyBar() {
  const { currency, totals, setCurrency, readOnly, locale } = usePricingEngine()

  if (!currency.secondaryCurrencyCode) return null

  const convertedTotal = convertCurrency(
    totals.grandTotal,
    currency.exchangeRate,
  )

  return (
    <>
      <Separator />
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {tUi(locale, 'pepCurrency')}
          </label>
          <Select
            value={currency.secondaryCurrencyCode}
            onValueChange={(val) => setCurrency({ secondaryCurrencyCode: val })}
            disabled={readOnly}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.filter((c) => c.code !== currency.code).map(
                (c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {getCurrencySymbol(c.code)} {c.code}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {tUi(locale, 'pepExchangeRate')}
          </label>
          <Input
            type="number"
            value={currency.exchangeRate || ''}
            onChange={(e) => {
              const val = Number.parseFloat(e.target.value)

              if (!Number.isNaN(val) && val > 0) {
                setCurrency({ exchangeRate: val })
              }
            }}
            className="h-8 w-[100px] text-right"
            min={0}
            step="0.0001"
            disabled={readOnly}
          />
        </div>

        <Badge
          variant="secondary"
          className="ml-auto text-sm font-semibold tabular-nums"
        >
          {formatMoney(convertedTotal, currency.secondaryCurrencyCode)}
        </Badge>
      </div>
    </>
  )
}
