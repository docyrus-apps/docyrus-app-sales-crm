import { type ICurrencyConfig, type IPricingConfig } from './interfaces';

export const DEFAULT_PRICING_CONFIG: IPricingConfig = {
  showVatColumn: true,
  showDiscountColumn: true,
  showGrossColumn: true,
  showCategoryColumn: true,
  discountBeforeVat: true,
  enableVat: true,
  enableLineDiscount: true,
  enableGlobalDiscount: true,
  enableAdjustment: true,
  defaultVatRate: 18,
  vatRates: [
    0,
    1,
    8,
    10,
    18,
    20
  ],
  viewMode: 'net'
};

export const DEFAULT_CURRENCY_CONFIG: ICurrencyConfig = {
  code: 'USD',
  secondaryCurrencyCode: null,
  exchangeRate: 1
};

export const FINANCIAL_PRECISION = 2;