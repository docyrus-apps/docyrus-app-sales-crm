/**
 * Shared quote "document" fields persisted on the sales_order record
 * (`quote_doc_json`). They drive both the live build editor and the PDF that
 * gets generated for download / email — so the build screen and any other
 * consumer (e.g. Quote Detail) agree on the same shape.
 *
 * @docyrus: [[features#Quotes (Teklif)]]
 */
export interface QuoteDocFields {
  docTitle: string;
  validUntil: string;
  billingEmail: string;
  billingAddress: string;
  intro: string;
  terms: string;
  templateBody: string;
  templateBodyTemplateId: string;
}

export const EMPTY_DOC: QuoteDocFields = {
  docTitle: '',
  validUntil: '',
  billingEmail: '',
  billingAddress: '',
  intro: '',
  terms: '',
  templateBody: '',
  templateBodyTemplateId: ''
}

/** Coerce a stored `quote_doc_json` value (object or JSON string) into the canonical shape. */
export function normalizeQuoteDoc(value: unknown): QuoteDocFields | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return normalizeQuoteDoc(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (typeof value !== 'object') return null

  return { ...EMPTY_DOC, ...(value as Partial<QuoteDocFields>) }
}
