'use client'

import { Badge } from '@/components/ui/badge'
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
  getCurrencySymbol,
} from '@/components/docyrus/form-fields/lib/utils'

import { usePricingEngine } from './contexts/pricing-context'
import { PricingConfigPopover } from './pricing-config-popover'

interface PricingHeaderProps {
  title?: string
}

export function PricingHeader({ title }: PricingHeaderProps) {
  const { currency, config, setCurrency, setConfig, readOnly, locale } =
    usePricingEngine()

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
        </div>

        <div className="flex items-center gap-2">
          {/* Currency selector */}
          <Select
            value={currency.code}
            onValueChange={(val) => setCurrency({ code: val })}
            disabled={readOnly}
          >
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {getCurrencySymbol(c.code)} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex items-center gap-1">
            <Badge
              variant={config.viewMode === 'net' ? 'default' : 'outline'}
              className="cursor-pointer select-none"
              onClick={() => !readOnly && setConfig({ viewMode: 'net' })}
            >
              {tUi(locale, 'pepNetView')}
            </Badge>
            <Badge
              variant={config.viewMode === 'gross' ? 'default' : 'outline'}
              className="cursor-pointer select-none"
              onClick={() => !readOnly && setConfig({ viewMode: 'gross' })}
            >
              {tUi(locale, 'pepGrossView')}
            </Badge>
          </div>

          <PricingConfigPopover />
        </div>
      </div>
      <Separator />
    </>
  )
}
