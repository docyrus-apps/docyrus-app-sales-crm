'use client';

import { type ComponentProps } from 'react';

import { forwardRef } from 'react';

import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { type UiI18nLocale } from '@/lib/ui-i18n';

import { PricingEngineProvider } from './contexts/pricing-context';
import {
  type ICategoryCatalogItem, type ICurrencyConfig, type ILineItem,
  type IPricingConfig, type IPricingDocumentData, type IProductCatalogItem,
  type ITotals
} from './interfaces';
import { PricingActionsBar } from './pricing-actions-bar';
import { PricingContentSection } from './pricing-content-section';
import { PricingCurrencyBar } from './pricing-currency-bar';
import { PricingDiscountSection } from './pricing-discount-section';
import { PricingHeader } from './pricing-header';
import { PricingLineTable } from './pricing-line-table';
import { PricingTotalsSection } from './pricing-totals-section';
import { PricingVatSummary } from './pricing-vat-summary';
import { type TPricingViewMode } from './types';

const pricingEnginePanelVariants = cva('w-full border rounded-xl bg-card text-card-foreground', {
  variants: {
    variant: {
      default: '',
      bordered: 'border-2 shadow-sm',
      compact: 'text-xs [&_input]:h-7 [&_input]:text-xs'
    },
    size: {
      sm: 'max-w-3xl mx-auto',
      default: 'max-w-5xl mx-auto',
      lg: '',
      full: 'w-full'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
});

export interface PricingEnginePanelProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange' | 'defaultValue'> {
  value?: Partial<IPricingDocumentData>;
  defaultValue?: Partial<IPricingDocumentData>;
  showVatColumn?: boolean;
  showDiscountColumn?: boolean;
  showGrossColumn?: boolean;
  showCategoryColumn?: boolean;
  discountBeforeVat?: boolean;
  enableVat?: boolean;
  enableLineDiscount?: boolean;
  enableGlobalDiscount?: boolean;
  enableAdjustment?: boolean;
  defaultVatRate?: number;
  vatRates?: number[];
  defaultCurrency?: string;
  viewMode?: TPricingViewMode;
  onLineItemsChange?: (items: ILineItem[]) => void;
  onTotalsChange?: (totals: ITotals) => void;
  onSave?: (data: IPricingDocumentData) => void;
  onSaveDraft?: (data: IPricingDocumentData) => void;
  onProductSelect?: (lineId: string, callback: (product: IProductCatalogItem) => void) => void;
  onCategorySelect?: (lineId: string, callback: (category: ICategoryCatalogItem) => void) => void;
  productCatalog?: IProductCatalogItem[];
  categoryCatalog?: ICategoryCatalogItem[];
  title?: string;
  readOnly?: boolean;
  showDescription?: boolean;
  showTerms?: boolean;
  showActions?: boolean;
  locale?: UiI18nLocale;
  variant?: 'default' | 'bordered' | 'compact';
  size?: 'sm' | 'default' | 'lg' | 'full';
}

const PricingEnginePanel = forwardRef<HTMLDivElement, PricingEnginePanelProps>(({
  value,
  defaultValue,
  showVatColumn = true,
  showDiscountColumn = true,
  showGrossColumn = true,
  showCategoryColumn = true,
  discountBeforeVat = true,
  enableVat = true,
  enableLineDiscount = true,
  enableGlobalDiscount = true,
  enableAdjustment = true,
  defaultVatRate = 18,
  vatRates = [
    0,
    1,
    8,
    10,
    18,
    20
  ],
  defaultCurrency = 'USD',
  viewMode = 'net',
  onLineItemsChange,
  onTotalsChange,
  onSave,
  onSaveDraft,
  onProductSelect,
  onCategorySelect,
  productCatalog,
  categoryCatalog,
  title,
  readOnly = false,
  showDescription = true,
  showTerms = true,
  showActions = true,
  locale,
  variant,
  size,
  className,
  ...props
}, ref) => {
  const configOverrides: Partial<IPricingConfig> = {
    showVatColumn,
    showDiscountColumn,
    showGrossColumn,
    showCategoryColumn,
    discountBeforeVat,
    enableVat,
    enableLineDiscount,
    enableGlobalDiscount,
    enableAdjustment,
    defaultVatRate,
    vatRates,
    viewMode
  };

  const currencyOverrides: Partial<ICurrencyConfig> | undefined = defaultCurrency !== 'USD' ? { code: defaultCurrency } : undefined;

  return (
    <PricingEngineProvider
      value={value}
      defaultValue={{
        ...defaultValue,
        currency: { ...defaultValue?.currency, ...currencyOverrides } as ICurrencyConfig
      }}
      config={configOverrides}
      defaultCurrency={defaultCurrency}
      onLineItemsChange={onLineItemsChange}
      onTotalsChange={onTotalsChange}
      onSave={onSave}
      onSaveDraft={onSaveDraft}
      onProductSelect={onProductSelect}
      onCategorySelect={onCategorySelect}
      productCatalog={productCatalog}
      categoryCatalog={categoryCatalog}
      readOnly={readOnly}
      locale={locale}>
      <div
        ref={ref}
        className={cn(pricingEnginePanelVariants({ variant, size }), className)}
        {...props}>
        <PricingHeader title={title} />
        <PricingLineTable />
        <PricingDiscountSection />
        <PricingTotalsSection />
        <PricingVatSummary />
        <PricingCurrencyBar />
        <PricingContentSection showDescription={showDescription} showTerms={showTerms} />
        <PricingActionsBar showActions={showActions} />
      </div>
    </PricingEngineProvider>
  );
});

PricingEnginePanel.displayName = 'PricingEnginePanel';

export { PricingEnginePanel, pricingEnginePanelVariants };