// @ts-nocheck
/* eslint-disable */
import { describe, expect, it } from 'vitest'
import { createPlateEditor } from 'platejs/react'

import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit'
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit'
import { FontKit } from '@/components/editor/plugins/font-kit'
import { AlignKit } from '@/components/editor/plugins/align-kit'
import { TableKit } from '@/components/editor/plugins/table-kit'
import {
  HandlebarsBlockClosePlugin,
  HandlebarsBlockOpenPlugin,
  HandlebarsElsePlugin,
  HandlebarsNormalizerPlugin,
  HandlebarsVariablePlugin
} from '@/components/docyrus/html-template-editor/plugins/handlebars-plugin'
import { preprocessHbsHtml } from '@/components/docyrus/html-template-editor/lib/deserialize'
import { serializePlateToHbs } from '@/components/docyrus/html-template-editor/lib/serialize'
import { createEditorTemplateEngine } from '@/components/docyrus/html-template-editor/lib/editor-template-engine'
import { numberToWordsTR } from '@/components/docyrus/html-template-editor/lib/locale-tr'
import { QUOTE_TEMPLATE_PRESETS } from '@/components/quotes/quote-templates'

const SAMPLE = {
  quote: { title: 'BENZERSIZ_BASLIK', no: 'T-1', date: '25.06.2026', validUntil: '25.07.2026' },
  customer: { name: 'Acme A.Ş.', address: 'İstanbul', taxNumber: '123', email: 'a@b.co', phone: '+90' },
  intro: 'Giriş notu.',
  terms: 'Şartlar.',
  currency: 'TRY',
  locale: 'tr-TR',
  lineItems: [
    { name: 'Lisans', qty: 25, unitPrice: 40, discount: 10, taxRate: 20, net: 900, gross: 1080 },
    { name: 'Destek', qty: 1, unitPrice: 500, discount: 0, taxRate: 20, net: 500, gross: 600 }
  ],
  totals: { subtotal: 1400, tax: 280, grandTotal: 1680 }
}

const SERIALIZE_OPTS = {
  defaultCurrency: 'TRY',
  messages: {
    adhocNoColumns: 'x',
    adhocNoDataPath: 'x',
    missingSchema: () => 'x'
  }
}

/** Replicates the editor's mount-time HTML → Plate → HTML round-trip. */
function roundTrip(html: string): string {
  const editor = createPlateEditor({
    plugins: [
      ...BasicBlocksKit,
      ...BasicMarksKit,
      ...FontKit,
      ...AlignKit,
      ...TableKit,
      HandlebarsVariablePlugin,
      HandlebarsBlockOpenPlugin,
      HandlebarsBlockClosePlugin,
      HandlebarsElsePlugin,
      HandlebarsNormalizerPlugin
    ]
  })
  const container = document.createElement('div')

  container.innerHTML = preprocessHbsHtml(html)
  const nodes = editor.api.html.deserialize({
    element: container,
    collapseWhiteSpace: false
  })

  return serializePlateToHbs(nodes, {}, SERIALIZE_OPTS)
}

describe('quote templates survive the Plate round-trip', () => {
  for (const preset of QUOTE_TEMPLATE_PRESETS) {
    it(`"${preset.id}" keeps formatting + accent colors after round-trip`, async () => {
      const roundTripped = roundTrip(preset.body)
      const engine = createEditorTemplateEngine({ extraHelpers: { numberToWordsTR } })
      const html = await engine.compileTpl(roundTripped)(SAMPLE)

      // Currency must still format after the round-trip.
      expect(html).toContain('₺1.680,00')
      expect(html).toContain('₺900,00')

      // Line item rows + totals must survive.
      expect(html).toContain('Lisans')
      expect(html).toContain('₺1.400,00')

      // Header title (h1 + {{#if}} + variable) and the colored label literal
      // must survive — these were the parts the round-trip silently dropped
      // when styling lived on a variable / <div>.
      expect(html).toContain('BENZERSIZ_BASLIK')
      expect(roundTripped).toContain('TEKLİF')

      // Accent fills must survive the round-trip. They live on table CELLS
      // (background-color), which Plate preserves — unlike <tr>/<div> styles.
      expect(roundTripped).toContain('background-color')
      // Header panel + line-item header + grand-total bar = 3+ filled cells.
      const fills = roundTripped.match(/background-color/g) ?? []

      expect(fills.length).toBeGreaterThanOrEqual(3)
    })
  }
})
