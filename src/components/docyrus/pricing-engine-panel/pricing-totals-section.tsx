'use client';

import { Separator } from '@/components/ui/separator';

import { tUi } from '@/lib/ui-i18n';
import { formatMoney } from '@/components/docyrus/form-fields/lib/utils';

import { usePricingEngine } from './contexts/pricing-context';

export function PricingTotalsSection() {
  const {
    totals, currency, config, locale
  } = usePricingEngine();

  const rows: Array<{
    label: string; value: number; bold?: boolean; negative?: boolean;
  }> = [{ label: tUi(locale, 'pepSubtotal'), value: totals.subtotal }];

  if (totals.totalDiscount > 0) {
    rows.push({ label: tUi(locale, 'pepDiscount'), value: totals.totalDiscount, negative: true });
  }

  rows.push({ label: tUi(locale, 'pepNetTotal'), value: totals.netTotal });

  if (config.enableVat && totals.vatTotal > 0) {
    rows.push({ label: tUi(locale, 'pepVatTotal'), value: totals.vatTotal });
  }

  if (config.enableAdjustment && totals.adjustment !== 0) {
    rows.push({
      label: tUi(locale, 'pepAdjustment'),
      value: totals.adjustment,
      negative: totals.adjustment < 0
    });
  }

  rows.push({ label: tUi(locale, 'pepGrandTotal'), value: totals.grandTotal, bold: true });

  return (
    <>
      <Separator />
      <div className="flex justify-end px-4 py-3">
        <div className="w-full max-w-xs space-y-1.5">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-sm ${
                row.bold ? 'border-t pt-2 text-base font-semibold' : ''
              }`}>
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`tabular-nums ${row.negative ? 'text-destructive' : ''}`}>
                {row.negative && row.value > 0 ? '-' : ''}
                {formatMoney(Math.abs(row.value), currency.code)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}