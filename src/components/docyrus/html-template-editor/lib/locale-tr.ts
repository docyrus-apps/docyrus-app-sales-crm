// @ts-nocheck
/* eslint-disable */
/*
 * Turkish locale pack — opt-in.
 *
 * The default helper set bundled with `<HtmlTemplateEditor>` is intentionally
 * locale-neutral (formatCurrency / formatDate / numeric aggregates only).
 * Locale-specific helpers like Turkish number-to-words live here, and consumers
 * register them by passing through the `extraHelpers` prop:
 *
 *   import { numberToWordsTR } from '@docyrus/ui/components/html-template-editor/locale-tr';
 *
 *   <HtmlTemplateEditor
 *     extraHelpers={{ numberToWordsTR }}
 *     ... />
 *
 * Handles values from 0 up to 999.999.999.999,99. Used in classic Turkish
 * quote / invoice culture where the grand total is written out as words
 * ("Yazıyla: …") so recipients can verify the figure isn't tampered.
 */

const TR_ONES = [
  '',
  'Bir',
  'İki',
  'Üç',
  'Dört',
  'Beş',
  'Altı',
  'Yedi',
  'Sekiz',
  'Dokuz'
] as const;

const TR_TENS = [
  '',
  'On',
  'Yirmi',
  'Otuz',
  'Kırk',
  'Elli',
  'Altmış',
  'Yetmiş',
  'Seksen',
  'Doksan'
] as const;

const TR_SCALES = [
  '',
  'Bin',
  'Milyon',
  'Milyar',
  'Trilyon'
] as const;

const TR_CURRENCY_NAMES: Record<string, { major: string; minor: string }> = {
  TRY: { major: 'Türk Lirası', minor: 'Kuruş' },
  USD: { major: 'ABD Doları', minor: 'Cent' },
  EUR: { major: 'Euro', minor: 'Cent' },
  GBP: { major: 'İngiliz Sterlini', minor: 'Penny' }
};

function trChunkToWords(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;

  if (h > 0) parts.push(h === 1 ? 'Yüz' : `${TR_ONES[h]} Yüz`);
  if (t > 0) parts.push(TR_TENS[t] ?? '');
  if (o > 0) parts.push(TR_ONES[o] ?? '');

  return parts.join(' ').trim();
}

function trIntegerToWords(value: number): string {
  if (value === 0) return 'Sıfır';
  if (value < 0) return `Eksi ${trIntegerToWords(-value)}`;

  let n = Math.floor(value);
  let scaleIdx = 0;
  let result = '';

  while (n > 0) {
    const chunk = n % 1000;

    if (chunk > 0) {
      let chunkWords = trChunkToWords(chunk);

      /*
       * "Bir Bin" → "Bin": singular thousand omits "bir" (but singular
       * million / milyar / trilyon KEEPS bir, so we only special-case scaleIdx=1).
       */
      if (scaleIdx === 1 && chunk === 1) chunkWords = '';
      const scale = TR_SCALES[scaleIdx] ?? '';
      const piece = `${chunkWords}${chunkWords && scale ? ' ' : ''}${scale}`.trim();

      result = `${piece}${result ? ` ${result}` : ''}`;
    }
    n = Math.floor(n / 1000);
    scaleIdx += 1;
  }

  return result;
}

/**
 * Convert a number into its Turkish written form, suffixed with the currency
 * major/minor unit names where known.
 *
 *   numberToWordsTR(869640.50)         → "Sekiz Yüz Altmış Dokuz Bin Altı Yüz Kırk Türk Lirası Elli Kuruş"
 *   numberToWordsTR(1500, "USD")       → "Bin Beş Yüz ABD Doları"
 *   numberToWordsTR(1500, "JPY")       → "Bin Beş Yüz JPY" (unknown code passes through)
 */
export function numberToWordsTR(value: unknown, currency: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '';
  const code = typeof currency === 'string' && currency ? currency : 'TRY';
  const names = TR_CURRENCY_NAMES[code] ?? { major: code, minor: '' };

  const intPart = Math.floor(Math.abs(amount));
  const decPart = Math.round((Math.abs(amount) - intPart) * 100);
  const intWords = trIntegerToWords(intPart);
  const decWords = decPart > 0 ? trIntegerToWords(decPart) : '';

  const sign = amount < 0 ? 'Eksi ' : '';
  const major = `${sign}${intWords} ${names.major}`.trim();

  if (decPart === 0 || !names.minor) return major;

  return `${major} ${decWords} ${names.minor}`;
}