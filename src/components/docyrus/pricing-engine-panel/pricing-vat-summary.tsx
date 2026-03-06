'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

import { tUi } from '@/lib/ui-i18n'
import { formatMoney } from '@/components/docyrus/form-fields/lib/utils'

import { usePricingEngine } from './contexts/pricing-context'

export function PricingVatSummary() {
  const { vatSummary, currency, config, locale } = usePricingEngine()

  if (!config.enableVat || vatSummary.length === 0) return null

  return (
    <>
      <Separator />
      <div className="px-4 py-3">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          {tUi(locale, 'pepVatSummary')}
        </h4>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{tUi(locale, 'pepRate')}</TableHead>
              <TableHead className="text-right">
                {tUi(locale, 'pepTaxableAmount')}
              </TableHead>
              <TableHead className="text-right">
                {tUi(locale, 'pepVat')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vatSummary.map((row) => (
              <TableRow key={row.rate}>
                <TableCell className="font-medium">{row.rate}%</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(row.taxableAmount, currency.code)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(row.vatAmount, currency.code)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
