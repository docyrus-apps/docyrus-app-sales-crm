import { FINANCIAL_PRECISION } from '../constants';
import {
  type ILineItem, type ILineItemCalculated, type ILineItemRow,
  type IPricingConfig, type ITotals, type IVatSummaryRow
} from '../interfaces';

/**
 * Banker's rounding (round half to even) for financial precision.
 */
export function bankersRound(value: number, decimals: number = FINANCIAL_PRECISION): number {
  const multiplier = 10 ** decimals;
  const shifted = value * multiplier;
  const floored = Math.floor(shifted);
  const diff = shifted - floored;

  if (Math.abs(diff - 0.5) < 1e-10) {
    return floored % 2 === 0 ? floored / multiplier : (floored + 1) / multiplier;
  }

  return Math.round(shifted) / multiplier;
}

/**
 * Calculate all derived fields for a single line item.
 */
export function calculateLineItem(
  item: ILineItem,
  config: Pick<IPricingConfig, 'discountBeforeVat' | 'enableVat' | 'enableLineDiscount'>
): ILineItemCalculated {
  const lineSubtotal = bankersRound(item.quantity * item.unitPrice);
  const discountPercent = config.enableLineDiscount ? item.discountPercent : 0;
  const vatRate = config.enableVat ? item.vatRate : 0;

  if (config.discountBeforeVat) {
    const discountAmount = bankersRound(lineSubtotal * discountPercent / 100);
    const netAfterDiscount = bankersRound(lineSubtotal - discountAmount);
    const vatAmount = bankersRound(netAfterDiscount * vatRate / 100);
    const grossTotal = bankersRound(netAfterDiscount + vatAmount);

    return {
      lineSubtotal, discountAmount, netAfterDiscount, vatAmount, grossTotal
    };
  }

  const vatAmount = bankersRound(lineSubtotal * vatRate / 100);
  const discountBase = lineSubtotal + vatAmount;
  const discountAmount = bankersRound(discountBase * discountPercent / 100);
  const netAfterDiscount = bankersRound(lineSubtotal - bankersRound(lineSubtotal * discountPercent / 100));
  const grossTotal = bankersRound(discountBase - discountAmount);

  return {
    lineSubtotal, discountAmount, netAfterDiscount, vatAmount, grossTotal
  };
}

/**
 * Merge line items with their calculated fields.
 */
export function buildLineItemRows(
  items: ILineItem[],
  config: Pick<IPricingConfig, 'discountBeforeVat' | 'enableVat' | 'enableLineDiscount'>
): ILineItemRow[] {
  return items.map(item => ({
    ...item,
    ...calculateLineItem(item, config)
  }));
}

/**
 * Calculate document-level totals from all line item rows.
 */
export function calculateTotals(
  rows: ILineItemRow[],
  globalDiscountPercent: number,
  adjustment: number,
  config: Pick<IPricingConfig, 'enableVat' | 'enableGlobalDiscount' | 'enableAdjustment'>
): ITotals {
  const subtotal = bankersRound(rows.reduce((sum, r) => sum + r.lineSubtotal, 0));
  const lineDiscountTotal = bankersRound(rows.reduce((sum, r) => sum + r.discountAmount, 0));

  const effectiveGlobalPercent = config.enableGlobalDiscount ? globalDiscountPercent : 0;
  const afterLineDiscounts = bankersRound(subtotal - lineDiscountTotal);
  const globalDiscountAmount = bankersRound(afterLineDiscounts * effectiveGlobalPercent / 100);
  const totalDiscount = bankersRound(lineDiscountTotal + globalDiscountAmount);
  const netTotal = bankersRound(subtotal - totalDiscount);

  let vatTotal: number;

  if (effectiveGlobalPercent > 0 && afterLineDiscounts > 0) {
    const globalFactor = 1 - effectiveGlobalPercent / 100;

    vatTotal = bankersRound(
      rows.reduce((sum, r) => sum + bankersRound(r.vatAmount * globalFactor), 0)
    );
  } else {
    vatTotal = config.enableVat ? bankersRound(rows.reduce((sum, r) => sum + r.vatAmount, 0)) : 0;
  }

  const effectiveAdjustment = config.enableAdjustment ? adjustment : 0;
  const grandTotal = bankersRound(netTotal + vatTotal + effectiveAdjustment);

  return {
    subtotal,
    lineDiscountTotal,
    globalDiscountAmount,
    totalDiscount,
    netTotal,
    vatTotal,
    adjustment: effectiveAdjustment,
    grandTotal
  };
}

/**
 * Build VAT summary grouped by rate.
 */
export function buildVatSummary(
  rows: ILineItemRow[],
  globalDiscountPercent: number,
  config: Pick<IPricingConfig, 'enableVat' | 'enableGlobalDiscount'>
): IVatSummaryRow[] {
  if (!config.enableVat) return [];

  const effectiveGlobalPercent = config.enableGlobalDiscount ? globalDiscountPercent : 0;
  const globalFactor = 1 - effectiveGlobalPercent / 100;

  const grouped = new Map<number, { taxable: number; vat: number }>();

  for (const row of rows) {
    if (row.vatRate === 0) continue;

    const existing = grouped.get(row.vatRate) ?? { taxable: 0, vat: 0 };

    existing.taxable += row.netAfterDiscount * globalFactor;
    existing.vat += row.vatAmount * globalFactor;
    grouped.set(row.vatRate, existing);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([rate, { taxable, vat }]) => ({
      rate,
      taxableAmount: bankersRound(taxable),
      vatAmount: bankersRound(vat)
    }));
}

/**
 * Convert an amount from primary to secondary currency.
 */
export function convertCurrency(amount: number, exchangeRate: number): number {
  return bankersRound(amount * exchangeRate);
}