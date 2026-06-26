'use client';

// @ts-nocheck
/* eslint-disable */
import { createPlatePlugin } from 'platejs/react';

import {
  COMPUTED_TABLE_KEY,
  type ComputedColumnConfig,
  type ComputedFooterConfig,
  type ComputedRow
} from '../types';

interface ComputedTablePayload {
  schemaId?: string;
  rows?: ComputedRow[];
  currency?: string;
  locale?: string;
  columnVisibility?: Record<string, boolean>;
  dataPath?: string;
  label?: string;
  columns?: ComputedColumnConfig[];
  footer?: ComputedFooterConfig[];
}

function safeParse(raw: string): ComputedTablePayload {
  try {
    return JSON.parse(decodeURIComponent(raw)) as ComputedTablePayload;
  } catch {
    return {};
  }
}

/*
 * Generic block-level, void Plate element. The schema (columns, footer math,
 * labels, currency options, default rows) lives in `<HtmlTemplateEditor>`'s
 * `tableSchemas` prop and is looked up at render-time by `schemaId`. The node
 * itself only stores per-instance state: row data, currency override, column
 * visibility. Designing this way lets the same primitive serve quote / invoice
 * / expense / time-sheet / any-line-item-table the consumer dreams up.
 *
 * Round-trip envelope:
 *   <div data-computed-table="1" data-config="<urlencoded JSON>">
 *     <table>…static pre-rendered preview for PDF/iframe…</table>
 *   </div>
 *
 * On deserialize, the inner children are discarded (`withoutChildren: true`);
 * the editor reconstructs the table from `data-config` + schema lookup.
 */
export const ComputedTablePlugin = createPlatePlugin({
  key: COMPUTED_TABLE_KEY,
  node: {
    isElement: true,
    isInline: false,
    isVoid: true
  },
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        withoutChildren: true,
        rules: [
          {
            validNodeName: 'DIV',
            validAttribute: { 'data-computed-table': '1' }
          }
        ],
        parse: ({ element }) => {
          const payload = safeParse(element.getAttribute('data-config') ?? '');

          return {
            type: COMPUTED_TABLE_KEY,
            schemaId: typeof payload.schemaId === 'string' ? payload.schemaId : '',
            rows: Array.isArray(payload.rows) ? payload.rows : [],
            currency: typeof payload.currency === 'string' ? payload.currency : undefined,
            locale: typeof payload.locale === 'string' ? payload.locale : undefined,
            columnVisibility: payload.columnVisibility && typeof payload.columnVisibility === 'object' ? payload.columnVisibility : undefined,
            dataPath: typeof payload.dataPath === 'string' ? payload.dataPath : undefined,
            label: typeof payload.label === 'string' ? payload.label : undefined,
            columns: Array.isArray(payload.columns) ? payload.columns : undefined,
            footer: Array.isArray(payload.footer) ? payload.footer : undefined,
            children: [{ text: '' }]
          };
        }
      }
    }
  }
});