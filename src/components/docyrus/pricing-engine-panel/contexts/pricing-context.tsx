'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode
} from 'react';

import { type UiI18nLocale } from '@/lib/ui-i18n';

import { DEFAULT_CURRENCY_CONFIG, DEFAULT_PRICING_CONFIG } from '../constants';
import {
  type ICategoryCatalogItem, type ICurrencyConfig, type ILineItem,
  type ILineItemRow, type IPricingConfig, type IPricingDocumentData,
  type IProductCatalogItem, type ITotals, type IVatSummaryRow
} from '../interfaces';
import { buildLineItemRows, buildVatSummary, calculateTotals } from '../lib/calculations';
import {
  addLineItemToList, createLineItem, duplicateLineItemInList,
  removeLineItemFromList, reorderLineItemList, updateLineItemInList
} from '../lib/line-item-helpers';
import { type TPricingDocumentStatus } from '../types';

interface IPricingEngineContext {
  lineItems: ILineItem[];
  globalDiscountPercent: number;
  adjustment: number;
  currency: ICurrencyConfig;
  config: IPricingConfig;
  description: string;
  termsAndConditions: string;
  status: TPricingDocumentStatus;

  lineItemRows: ILineItemRow[];
  totals: ITotals;
  vatSummary: IVatSummaryRow[];

  addLineItem: (item?: Partial<ILineItem>) => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, updates: Partial<ILineItem>) => void;
  duplicateLineItem: (id: string) => void;
  reorderLineItems: (fromIndex: number, toIndex: number) => void;
  setLineItemFromProduct: (lineId: string, product: IProductCatalogItem) => void;
  setLineItemCategory: (lineId: string, category: ICategoryCatalogItem) => void;

  setGlobalDiscountPercent: (percent: number) => void;
  setAdjustment: (amount: number) => void;
  setCurrency: (config: Partial<ICurrencyConfig>) => void;
  setConfig: (config: Partial<IPricingConfig>) => void;
  setDescription: (value: string) => void;
  setTermsAndConditions: (value: string) => void;

  save: () => void;
  saveDraft: () => void;

  readOnly: boolean;
  locale: UiI18nLocale | undefined;

  productCatalog: IProductCatalogItem[] | undefined;
  categoryCatalog: ICategoryCatalogItem[] | undefined;
  onProductSelect?: (lineId: string, callback: (product: IProductCatalogItem) => void) => void;
  onCategorySelect?: (lineId: string, callback: (category: ICategoryCatalogItem) => void) => void;
}

const PricingEngineContext = createContext({} as IPricingEngineContext);

export interface PricingEngineProviderProps {
  children: ReactNode;
  defaultValue?: Partial<IPricingDocumentData>;
  value?: Partial<IPricingDocumentData>;
  onLineItemsChange?: (items: ILineItem[]) => void;
  onTotalsChange?: (totals: ITotals) => void;
  onSave?: (data: IPricingDocumentData) => void;
  onSaveDraft?: (data: IPricingDocumentData) => void;
  onProductSelect?: (lineId: string, callback: (product: IProductCatalogItem) => void) => void;
  onCategorySelect?: (lineId: string, callback: (category: ICategoryCatalogItem) => void) => void;
  productCatalog?: IProductCatalogItem[];
  categoryCatalog?: ICategoryCatalogItem[];
  config?: Partial<IPricingConfig>;
  defaultCurrency?: string;
  readOnly?: boolean;
  locale?: UiI18nLocale;
}

export function PricingEngineProvider({
  children,
  defaultValue,
  value: controlledValue,
  onLineItemsChange,
  onTotalsChange,
  onSave,
  onSaveDraft,
  onProductSelect,
  onCategorySelect,
  productCatalog,
  categoryCatalog,
  config: configOverrides,
  defaultCurrency,
  readOnly = false,
  locale
}: PricingEngineProviderProps) {
  const isControlled = controlledValue !== undefined;
  const isInternalChange = useRef(false);

  const initialConfig: IPricingConfig = {
    ...DEFAULT_PRICING_CONFIG,
    ...configOverrides,
    ...defaultValue?.config
  };

  const initialCurrency: ICurrencyConfig = {
    ...DEFAULT_CURRENCY_CONFIG,
    ...(defaultCurrency ? { code: defaultCurrency } : {}),
    ...defaultValue?.currency
  };

  const [lineItems, setLineItems] = useState<ILineItem[]>(
    defaultValue?.lineItems ?? []
  );
  const [globalDiscountPercent, setGlobalDiscountPercentState] = useState(
    defaultValue?.globalDiscountPercent ?? 0
  );
  const [adjustment, setAdjustmentState] = useState(
    defaultValue?.adjustment ?? 0
  );
  const [currency, setCurrencyState] = useState<ICurrencyConfig>(initialCurrency);
  const [config, setConfigState] = useState<IPricingConfig>(initialConfig);
  const [description, setDescriptionState] = useState(
    defaultValue?.description ?? ''
  );
  const [termsAndConditions, setTermsAndConditionsState] = useState(
    defaultValue?.termsAndConditions ?? ''
  );
  const [status, setStatus] = useState<TPricingDocumentStatus>(
    defaultValue?.status ?? 'draft'
  );

  useEffect(() => {
    if (!isControlled || isInternalChange.current) {
      isInternalChange.current = false;

      return;
    }
    if (controlledValue.lineItems) setLineItems(controlledValue.lineItems);
    if (controlledValue.globalDiscountPercent !== undefined) setGlobalDiscountPercentState(controlledValue.globalDiscountPercent);
    if (controlledValue.adjustment !== undefined) setAdjustmentState(controlledValue.adjustment);
    if (controlledValue.currency) setCurrencyState(prev => ({ ...prev, ...controlledValue.currency }));
    if (controlledValue.config) setConfigState(prev => ({ ...prev, ...controlledValue.config }));
    if (controlledValue.description !== undefined) setDescriptionState(controlledValue.description);
    if (controlledValue.termsAndConditions !== undefined) setTermsAndConditionsState(controlledValue.termsAndConditions);
    if (controlledValue.status) setStatus(controlledValue.status);
  }, [controlledValue, isControlled]);

  const lineItemRows = useMemo(
    () => buildLineItemRows(lineItems, config),
    [lineItems, config]
  );

  const totals = useMemo(
    () => calculateTotals(lineItemRows, globalDiscountPercent, adjustment, config),
    [
      lineItemRows,
      globalDiscountPercent,
      adjustment,
      config
    ]
  );

  const vatSummary = useMemo(
    () => buildVatSummary(lineItemRows, globalDiscountPercent, config),
    [lineItemRows, globalDiscountPercent, config]
  );

  useEffect(() => {
    onLineItemsChange?.(lineItems);
  }, [lineItems, onLineItemsChange]);

  useEffect(() => {
    onTotalsChange?.(totals);
  }, [totals, onTotalsChange]);

  const buildDocumentData = useCallback((): IPricingDocumentData => ({
    lineItems,
    globalDiscountPercent,
    adjustment,
    currency,
    config,
    description,
    termsAndConditions,
    status,
    totals
  }), [
    lineItems,
    globalDiscountPercent,
    adjustment,
    currency,
    config,
    description,
    termsAndConditions,
    status,
    totals
  ]);

  const addLineItem = useCallback((overrides?: Partial<ILineItem>) => {
    isInternalChange.current = true;
    setLineItems(prev => addLineItemToList(prev, createLineItem(config, overrides)));
  }, [config]);

  const removeLineItem = useCallback((id: string) => {
    isInternalChange.current = true;
    setLineItems(prev => removeLineItemFromList(prev, id));
  }, []);

  const updateLineItem = useCallback((id: string, updates: Partial<ILineItem>) => {
    isInternalChange.current = true;
    setLineItems(prev => updateLineItemInList(prev, id, updates));
  }, []);

  const duplicateLineItem = useCallback((id: string) => {
    isInternalChange.current = true;
    setLineItems(prev => duplicateLineItemInList(prev, id));
  }, []);

  const reorderLineItems = useCallback((fromIndex: number, toIndex: number) => {
    isInternalChange.current = true;
    setLineItems(prev => reorderLineItemList(prev, fromIndex, toIndex));
  }, []);

  const setLineItemFromProduct = useCallback((lineId: string, product: IProductCatalogItem) => {
    isInternalChange.current = true;
    setLineItems(prev => updateLineItemInList(prev, lineId, {
      productId: product.id,
      name: product.name,
      category: product.category,
      categoryId: product.categoryId ?? null,
      unitPrice: product.unitPrice,
      vatRate: product.vatRate ?? config.defaultVatRate
    }));
  }, [config.defaultVatRate]);

  const setLineItemCategory = useCallback((lineId: string, cat: ICategoryCatalogItem) => {
    isInternalChange.current = true;
    setLineItems(prev => updateLineItemInList(prev, lineId, {
      categoryId: cat.id,
      category: cat.name
    }));
  }, []);

  const setGlobalDiscountPercent = useCallback((percent: number) => {
    isInternalChange.current = true;
    setGlobalDiscountPercentState(Math.max(0, Math.min(100, percent)));
  }, []);

  const setAdjustmentFn = useCallback((amount: number) => {
    isInternalChange.current = true;
    setAdjustmentState(amount);
  }, []);

  const setCurrency = useCallback((updates: Partial<ICurrencyConfig>) => {
    isInternalChange.current = true;
    setCurrencyState(prev => ({ ...prev, ...updates }));
  }, []);

  const setConfig = useCallback((updates: Partial<IPricingConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  const setDescription = useCallback((value: string) => {
    isInternalChange.current = true;
    setDescriptionState(value);
  }, []);

  const setTermsAndConditions = useCallback((value: string) => {
    isInternalChange.current = true;
    setTermsAndConditionsState(value);
  }, []);

  const save = useCallback(() => {
    setStatus('saved');
    onSave?.(buildDocumentData());
  }, [buildDocumentData, onSave]);

  const saveDraft = useCallback(() => {
    setStatus('draft');
    onSaveDraft?.(buildDocumentData());
  }, [buildDocumentData, onSaveDraft]);

  const contextValue = useMemo(() => ({
    lineItems,
    globalDiscountPercent,
    adjustment,
    currency,
    config,
    description,
    termsAndConditions,
    status,
    lineItemRows,
    totals,
    vatSummary,
    addLineItem,
    removeLineItem,
    updateLineItem,
    duplicateLineItem,
    reorderLineItems,
    setLineItemFromProduct,
    setLineItemCategory,
    setGlobalDiscountPercent,
    setAdjustment: setAdjustmentFn,
    setCurrency,
    setConfig,
    setDescription,
    setTermsAndConditions,
    save,
    saveDraft,
    readOnly,
    locale,
    productCatalog,
    categoryCatalog,
    onProductSelect,
    onCategorySelect
  }), [
    lineItems,
    globalDiscountPercent,
    adjustment,
    currency,
    config,
    description,
    termsAndConditions,
    status,
    lineItemRows,
    totals,
    vatSummary,
    addLineItem,
    removeLineItem,
    updateLineItem,
    duplicateLineItem,
    reorderLineItems,
    setLineItemFromProduct,
    setLineItemCategory,
    setGlobalDiscountPercent,
    setAdjustmentFn,
    setCurrency,
    setConfig,
    setDescription,
    setTermsAndConditions,
    save,
    saveDraft,
    readOnly,
    locale,
    productCatalog,
    categoryCatalog,
    onProductSelect,
    onCategorySelect
  ]);

  return (
    <PricingEngineContext.Provider value={contextValue}>
      {children}
    </PricingEngineContext.Provider>
  );
}

export function usePricingEngine(): IPricingEngineContext {
  const context = useContext(PricingEngineContext);

  if (!context) {
    throw new Error('usePricingEngine must be used within a PricingEngineProvider.');
  }

  return context;
}