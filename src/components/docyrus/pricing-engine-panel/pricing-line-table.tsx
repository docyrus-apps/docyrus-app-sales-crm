'use client'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'
import { PricingLineRow } from './pricing-line-row'

export function PricingLineTable() {
  const { lineItemRows, config, addLineItem, readOnly, locale } =
    usePricingEngine()

  return (
    <div className="space-y-2">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="min-w-45">
                {tUi(locale, 'pepProduct')}
              </TableHead>
              {config.showCategoryColumn && (
                <TableHead>{tUi(locale, 'pepCategory')}</TableHead>
              )}
              <TableHead className="text-right">
                {tUi(locale, 'pepQuantity')}
              </TableHead>
              <TableHead className="text-right">
                {tUi(locale, 'pepUnitPrice')}
              </TableHead>
              <TableHead className="text-right">
                {tUi(locale, 'pepSubtotal')}
              </TableHead>
              {config.showDiscountColumn && (
                <>
                  <TableHead className="text-right">
                    {tUi(locale, 'pepDiscountPercent')}
                  </TableHead>
                  <TableHead className="text-right">
                    {tUi(locale, 'pepDiscountAmount')}
                  </TableHead>
                </>
              )}
              <TableHead className="text-right">
                {tUi(locale, 'pepNet')}
              </TableHead>
              {config.showVatColumn && (
                <>
                  <TableHead className="text-right">
                    {tUi(locale, 'pepVatRate')}
                  </TableHead>
                  <TableHead className="text-right">
                    {tUi(locale, 'pepVat')}
                  </TableHead>
                </>
              )}
              {config.showGrossColumn && (
                <TableHead className="text-right">
                  {tUi(locale, 'pepGross')}
                </TableHead>
              )}
              <TableHead className="w-18" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItemRows.length === 0 ? (
              <TableRow>
                <td
                  colSpan={20}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {tUi(locale, 'pepNoLines')}
                </td>
              </TableRow>
            ) : (
              lineItemRows.map((row) => (
                <PricingLineRow key={row.id} row={row} />
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => addLineItem()}
        >
          <Plus className="mr-1 h-4 w-4" />
          {tUi(locale, 'pepAddLine')}
        </Button>
      )}
    </div>
  )
}
