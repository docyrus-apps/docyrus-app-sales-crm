// @ts-nocheck
/* eslint-disable */
import { createContext, use } from 'react';

import {
  DEFAULT_HELPERS,
  type ComputedTableSchema,
  type HandlebarsBlockHelper,
  type HandlebarsVariable
} from '../types';

interface HbsContextValue {
  variables: HandlebarsVariable[];
  /**
   * Block helpers list (e.g. `if`, `each`, `with`) — used by the edit popover
   * on existing `{{#…}}` chips so it can read helper-specific metadata
   * (description, default expression) consistent with the insert popover.
   */
  helpers: HandlebarsBlockHelper[];
  /**
   * Map of `schemaId` → schema. The `<computed-table>` element looks up its
   * schema here every render so consumers can update labels / columns at
   * runtime (e.g. live i18n changes) without rewriting the document.
   */
  tableSchemas: Record<string, ComputedTableSchema>;
  /**
   * Parsed JSON data the editor was mounted with (live mirror of the Data
   * tab). The table configuration dialog browses this to surface array-of-
   * object paths and infer fields. `null` when the data string is empty or
   * fails to parse.
   */
  data: unknown;
  /**
   * Default currency code wired through from `<HtmlTemplateEditor>`'s
   * `defaultCurrency` prop. Used when ad-hoc tables serialize a `currency`
   * column. Falls back to `'USD'` when the consumer doesn't pass one.
   */
  defaultCurrency: string;
}

export const HbsContext = createContext<HbsContextValue>({
  variables: [],
  helpers: DEFAULT_HELPERS,
  tableSchemas: {},
  data: null,
  defaultCurrency: 'USD'
});

export function useHbsContext() {
  return use(HbsContext);
}