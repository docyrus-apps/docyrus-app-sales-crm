import { type TPricingDocumentStatus, type TPricingViewMode } from './types';

/** A single product/service line item in the pricing engine. */
export interface ILineItem {
  id: string;
  position: number;
  productId: string | null;
  categoryId: string | null;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent: number;
}

/** Calculated values for a single line item (derived, never stored). */
export interface ILineItemCalculated {
  lineSubtotal: number;
  discountAmount: number;
  netAfterDiscount: number;
  vatAmount: number;
  grossTotal: number;
}

/** Combined line item with its calculated fields for display. */
export interface ILineItemRow extends ILineItem, ILineItemCalculated {}

/** Summary totals for the entire document. */
export interface ITotals {
  subtotal: number;
  lineDiscountTotal: number;
  globalDiscountAmount: number;
  totalDiscount: number;
  netTotal: number;
  vatTotal: number;
  adjustment: number;
  grandTotal: number;
}

/** VAT summary row (one per unique VAT rate). */
export interface IVatSummaryRow {
  rate: number;
  taxableAmount: number;
  vatAmount: number;
}

/** Currency configuration for the panel. */
export interface ICurrencyConfig {
  code: string;
  secondaryCurrencyCode: string | null;
  exchangeRate: number;
}

/** Feature flag + display configuration. */
export interface IPricingConfig {
  showVatColumn: boolean;
  showDiscountColumn: boolean;
  showGrossColumn: boolean;
  showCategoryColumn: boolean;
  discountBeforeVat: boolean;
  enableVat: boolean;
  enableLineDiscount: boolean;
  enableGlobalDiscount: boolean;
  enableAdjustment: boolean;
  defaultVatRate: number;
  vatRates: number[];
  viewMode: TPricingViewMode;
}

/** The complete document state (for save/load). */
export interface IPricingDocumentData {
  lineItems: ILineItem[];
  globalDiscountPercent: number;
  adjustment: number;
  currency: ICurrencyConfig;
  config: IPricingConfig;
  description: string;
  termsAndConditions: string;
  status: TPricingDocumentStatus;
  totals: ITotals;
}

/** Product returned from external catalog callback. */
export interface IProductCatalogItem {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  unitPrice: number;
  vatRate?: number;
}

/** A category node in the catalog (supports nested hierarchy). */
export interface ICategoryCatalogItem {
  id: string;
  name: string;
  parentId: string | null;
  children?: ICategoryCatalogItem[];
}