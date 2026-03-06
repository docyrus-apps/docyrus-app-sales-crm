'use client';

import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';

import { formatMoney } from '@/components/docyrus/form-fields/lib/utils';

import { usePricingEngine } from './contexts/pricing-context';
import { type ILineItemRow } from './interfaces';
import { PricingCategoryCell } from './pricing-category-cell';
import { PricingLineRowActions } from './pricing-line-row-actions';
import { PricingProductCell } from './pricing-product-cell';

interface PricingLineRowProps {
  row: ILineItemRow;
}

export function PricingLineRow({ row }: PricingLineRowProps) {
  const {
    updateLineItem, config, currency, readOnly
  } = usePricingEngine();

  const handleNumericChange = (field: 'quantity' | 'unitPrice' | 'discountPercent', value: string) => {
    const parsed = Number.parseFloat(value);

    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateLineItem(row.id, { [field]: parsed });
    } else if (value === '') {
      updateLineItem(row.id, { [field]: 0 });
    }
  };

  return (
    <TableRow className="group">
      <TableCell className="w-10 text-center text-muted-foreground text-xs">
        {row.position + 1}
      </TableCell>

      <TableCell className="min-w-[180px]">
        <PricingProductCell lineId={row.id} name={row.name} productId={row.productId} />
      </TableCell>

      {config.showCategoryColumn && (
        <TableCell>
          <PricingCategoryCell
            lineId={row.id}
            category={row.category}
            categoryId={row.categoryId} />
        </TableCell>
      )}

      <TableCell>
        <Input
          type="number"
          value={row.quantity || ''}
          onChange={e => handleNumericChange('quantity', e.target.value)}
          className="h-8 w-[70px] border-0 bg-transparent px-1 text-right shadow-none focus-visible:ring-1"
          min={0}
          disabled={readOnly} />
      </TableCell>

      <TableCell>
        <Input
          type="number"
          value={row.unitPrice || ''}
          onChange={e => handleNumericChange('unitPrice', e.target.value)}
          className="h-8 w-[100px] border-0 bg-transparent px-1 text-right shadow-none focus-visible:ring-1"
          min={0}
          step="0.01"
          disabled={readOnly} />
      </TableCell>

      <TableCell className="text-right text-sm tabular-nums">
        {formatMoney(row.lineSubtotal, currency.code)}
      </TableCell>

      {config.showDiscountColumn && (
        <>
          <TableCell>
            {config.enableLineDiscount ? (
              <Input
                type="number"
                value={row.discountPercent || ''}
                onChange={e => handleNumericChange('discountPercent', e.target.value)}
                className="h-8 w-[65px] border-0 bg-transparent px-1 text-right shadow-none focus-visible:ring-1"
                min={0}
                max={100}
                disabled={readOnly} />
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
          <TableCell className="text-right text-sm tabular-nums">
            {row.discountAmount > 0 ? `-${formatMoney(row.discountAmount, currency.code)}` : '—'}
          </TableCell>
        </>
      )}

      <TableCell className="text-right text-sm font-medium tabular-nums">
        {formatMoney(row.netAfterDiscount, currency.code)}
      </TableCell>

      {config.showVatColumn && (
        <>
          <TableCell>
            {config.enableVat ? (
              <Select
                value={String(row.vatRate)}
                onValueChange={val => updateLineItem(row.id, { vatRate: Number(val) })}
                disabled={readOnly}>
                <SelectTrigger className="h-8 w-[75px] border-0 bg-transparent shadow-none focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.vatRates.map(rate => (
                    <SelectItem key={rate} value={String(rate)}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
          <TableCell className="text-right text-sm tabular-nums">
            {row.vatAmount > 0 ? formatMoney(row.vatAmount, currency.code) : '—'}
          </TableCell>
        </>
      )}

      {config.showGrossColumn && (
        <TableCell className="text-right text-sm font-semibold tabular-nums">
          {formatMoney(row.grossTotal, currency.code)}
        </TableCell>
      )}

      <TableCell className="w-[72px]">
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <PricingLineRowActions lineId={row.id} />
        </div>
      </TableCell>
    </TableRow>
  );
}