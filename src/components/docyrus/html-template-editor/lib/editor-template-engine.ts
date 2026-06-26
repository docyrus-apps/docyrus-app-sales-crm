// @ts-nocheck
/* eslint-disable */
import { createTemplateEngine, type DateUtils, type NumberUtils } from '@docyrus/app-utils';

import { type ExtraHandlebarsHelper } from '../types';
import {
  add,
  avgProperty,
  countItems,
  divide,
  eq,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  gt,
  lineNet,
  lineNetKeyed,
  lineTotalWithTax,
  lt,
  maxProperty,
  minProperty,
  multiply,
  subtract,
  sumGrandTotal,
  sumLineExpr,
  sumLineGeneric,
  sumLineGrossKeyed,
  sumLineNets,
  sumLineNetsKeyed,
  sumLineTaxes,
  sumLineTaxesKeyed,
  sumProperty
} from './handlebars-helpers';

export interface EditorTemplateEngineConfig {
  /**
   * Consumer-supplied Handlebars helpers, registered after the editor set.
   * Use for domain/locale-specific functions (e.g. `numberToWordsTR`).
   */
  extraHelpers?: Record<string, ExtraHandlebarsHelper>;
  /**
   * Additional JSONata bindings available inside `{{formula '…'}}` expressions.
   */
  extraJsonataBindings?: Record<string, unknown>;
  /**
   * Locale-aware date utilities from `@docyrus/app-utils`. When provided,
   * `createTemplateEngine` registers locale-aware `formatDate` / `formatDateTime`
   * helpers. Without it the editor's standalone `formatDate` is used as a fallback.
   */
  dateUtils?: DateUtils;
  /**
   * Locale-aware number utilities from `@docyrus/app-utils`. When provided,
   * `createTemplateEngine` registers a locale-aware `formatNumber` helper.
   * Without it the editor's standalone `formatNumber` is used as a fallback.
   */
  numberUtils?: NumberUtils;
}

export interface EditorTemplateEngine {
  /**
   * Compile a Handlebars template string. Returns an async renderer so that
   * `{{formula '…'}}` (JSONata) and `{{repeat n}}` (async block) work correctly.
   *
   * The returned function renders `data` against the template with the full
   * registered helper set — editor-specific helpers (formatCurrency, lineNet,
   * sumGrandTotal, eq/gt/lt, …) plus the complete app-utils helper set
   * (formula/JSONata, repeat, sum, path, json, formatDurationAs*,
   * formatNumberToWords, locale-aware formatDate/formatNumber when utils provided).
   */
  compileTpl(templateString: string): (data: unknown) => Promise<string>;
}

/**
 * Create an isolated Handlebars engine for the HtmlTemplateEditor.
 *
 * Delegates to `@docyrus/app-utils`'s `createTemplateEngine` which handles the
 * base helper set (formula/JSONata, repeat, sum, path, json,
 * formatDurationAsTime/Words/Hours, formatNumberToWords, and locale-aware
 * formatDate/formatDateTime/formatNumber when dateUtils/numberUtils are supplied).
 *
 * On top of that, the editor registers its own helpers via `additionalHelpers`:
 *
 * - **Formatting**: `formatCurrency`, `formatPercent`
 *   (+ standalone `formatDate`/`formatNumber` as fallbacks when no locale utils)
 * - **Arithmetic**: `multiply`, `add`, `subtract`, `divide`
 * - **Aggregation**: `sumProperty`, `avgProperty`, `minProperty`, `maxProperty`,
 *   `countItems`
 * - **Invoice line maths**: `lineNet`, `lineTotal`, `sumLineNets`, `sumLineTaxes`,
 *   `sumGrandTotal`, `lineNetKeyed`, `sumLineNetsKeyed`, `sumLineTaxesKeyed`,
 *   `sumLineGrossKeyed`, `sumLineGeneric`, `sumLineExpr`
 * - **Comparison**: `eq`, `gt`, `lt`
 * - **Consumer extras**: anything passed in `config.extraHelpers`
 */
export function createEditorTemplateEngine(
  config: EditorTemplateEngineConfig = {}
): EditorTemplateEngine {
  const {
    extraHelpers = {},
    extraJsonataBindings,
    dateUtils,
    numberUtils
  } = config;

  const editorHelpers: Record<string, ExtraHandlebarsHelper> = {
    formatCurrency,
    formatPercent,
    multiply,
    add,
    subtract,
    divide,
    sumProperty,
    avgProperty,
    minProperty,
    maxProperty,
    countItems,
    lineNet,
    lineTotal: lineTotalWithTax,
    sumLineNets,
    sumLineTaxes,
    sumGrandTotal,
    lineNetKeyed,
    sumLineNetsKeyed,
    sumLineTaxesKeyed,
    sumLineGrossKeyed,
    sumLineGeneric,
    sumLineExpr,
    eq,
    gt,
    lt
  };

  /*
   * Fallback locale helpers — only registered when no locale utils are
   * provided. `createTemplateEngine` registers locale-aware versions when
   * dateUtils/numberUtils are present; the editor's standalone versions serve
   * as fallbacks for bare editor use (no tenant context).
   */
  if (!dateUtils) {
    editorHelpers.formatDate = formatDate;
  }
  if (!numberUtils) {
    editorHelpers.formatNumber = formatNumber;
  }

  const engine = createTemplateEngine({
    dateUtils,
    numberUtils,
    extraJsonataBindings,
    additionalHelpers: {
      ...editorHelpers,
      ...extraHelpers
    }
  });

  return { compileTpl: engine.compileTpl };
}