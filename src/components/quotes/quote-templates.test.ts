import { describe, expect, it } from 'vitest'

import { createEditorTemplateEngine } from '@/components/docyrus/html-template-editor/lib/editor-template-engine'
import { numberToWordsTR } from '@/components/docyrus/html-template-editor/lib/locale-tr'
import { QUOTE_TEMPLATE_PRESETS } from '@/components/quotes/quote-templates'

/**
 * Renders every quote template through the SAME engine the editor uses
 * (`createEditorTemplateEngine` + the `numberToWordsTR` extra helper) against a
 * realistic data payload and asserts the line items / totals come out as
 * locale-aware currency — guarding against the "raw number" regression.
 */

const SAMPLE = {
  quote: {
    title: 'Kurumsal Yazılım Aboneliği',
    no: 'TKF-2026-0042',
    date: '25.06.2026',
    validUntil: '25.07.2026'
  },
  customer: {
    name: 'Acme Teknoloji A.Ş.',
    address: 'Levent Mah. No:12, İstanbul',
    taxNumber: '1234567890',
    email: 'satinalma@acme.com',
    phone: '+90 212 555 0142'
  },
  intro:
    'Talebiniz doğrultusunda hazırladığımız teklifimizi bilgilerinize sunarız.',
  terms: 'Bu teklif 30 gün geçerlidir. Fiyatlara KDV ayrıca yansıtılmıştır.',
  currency: 'TRY',
  locale: 'tr-TR',
  lineItems: [
    {
      name: 'Yıllık Kurumsal Lisans',
      qty: 25,
      unitPrice: 40,
      discount: 10,
      taxRate: 20,
      net: 900,
      gross: 1080
    },
    {
      name: 'Premium Destek Paketi',
      qty: 1,
      unitPrice: 500,
      discount: 0,
      taxRate: 20,
      net: 500,
      gross: 600
    }
  ],
  totals: { subtotal: 1400, tax: 280, grandTotal: 1680 }
}

describe('quote templates', () => {
  for (const preset of QUOTE_TEMPLATE_PRESETS) {
    it(`renders "${preset.id}" with formatted currency and no leftover tokens`, async () => {
      const engine = createEditorTemplateEngine({
        extraHelpers: { numberToWordsTR }
      })
      const html = await engine.compileTpl(preset.body)(SAMPLE)

      // Locale-aware currency (TRY → ₺1.680,00), not raw numbers.
      expect(html).toContain('₺1.680,00') // grand total
      expect(html).toContain('₺900,00') // line 1 net
      expect(html).toContain('₺500,00') // line 2 net
      expect(html).toContain('₺1.400,00') // subtotal

      // Amount-in-words helper resolved.
      expect(html).toContain('Bin Altı Yüz Seksen Türk Lirası')

      // Line item names rendered.
      expect(html).toContain('Yıllık Kurumsal Lisans')
      expect(html).toContain('Premium Destek Paketi')

      // No unresolved Handlebars / bad values.
      expect(html).not.toContain('{{')
      expect(html).not.toContain('}}')
      expect(html).not.toContain('NaN')
      expect(html).not.toContain('undefined')
    })
  }
})
