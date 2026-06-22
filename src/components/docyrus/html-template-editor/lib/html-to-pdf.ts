// @ts-nocheck
/* eslint-disable */
/*
 * Client-side HTML → PDF for the editor's PDF tab.
 *
 * The editor only ever holds *HTML* (the compiled Handlebars output). The
 * PDF tab needs a real PDF to feed the embedpdf-based `<PDFViewer>`. Rather
 * than depend on a server round-trip (Puppeteer/Gotenberg), this rasterizes
 * the compiled HTML onto an offscreen A4 surface with `html2canvas-pro`, then
 * stitches the bitmap into a multi-page A4 PDF with `pdf-lib`. Both packages
 * are already direct dependencies of `@docyrus/ui`, so no new runtime dep is
 * introduced.
 *
 * Fidelity note: this is a *rasterized* render (the page becomes an image per
 * A4 slice), so the text isn't selectable in the resulting PDF. That's the
 * accepted trade-off for a zero-server preview; a server-side Puppeteer export
 * remains the path for production-grade, text-selectable PDFs.
 */

import html2canvas from 'html2canvas-pro';
import { PDFDocument } from 'pdf-lib';

/* A4 @ 96 DPI — must match the Visual/Preview tab surface in the editor. */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const A4_PADDING_PX = 64;

/* A4 in PDF points (1pt = 1/72 inch). */
const A4_POINT_WIDTH = 595.28;
const A4_POINT_HEIGHT = 841.89;

/*
 * Page stylesheet for the offscreen render surface. Mirrors the editor's
 * `A4_PREVIEW_CSS` but scoped to `.dy-pdf-page` (so it can't leak into the
 * host document) and folds the page chrome (width / padding / typography)
 * onto that single root element instead of a `html,body` + `.page` pair.
 */
const PDF_PAGE_CSS = `
  .dy-pdf-page, .dy-pdf-page *, .dy-pdf-page *::before, .dy-pdf-page *::after { box-sizing: border-box; }
  .dy-pdf-page {
    width: ${A4_WIDTH_PX}px;
    min-height: ${A4_HEIGHT_PX}px;
    padding: ${A4_PADDING_PX}px;
    margin: 0;
    background: #ffffff;
    font-family: 'Inter','Helvetica Neue','Segoe UI',sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #0f172a;
  }
  .dy-pdf-page h1 { font-size: 28px; margin: 0 0 12px; font-weight: 700; letter-spacing: -.02em; }
  .dy-pdf-page h2 { font-size: 22px; margin: 24px 0 10px; font-weight: 600; }
  .dy-pdf-page h3 { font-size: 18px; margin: 18px 0 8px; font-weight: 600; }
  .dy-pdf-page p { margin: 0 0 10px; }
  .dy-pdf-page table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  .dy-pdf-page th, .dy-pdf-page td { padding: 8px 10px; text-align: left; vertical-align: top; }
  .dy-pdf-page th { font-weight: 600; }
  .dy-pdf-page hr { border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  .dy-pdf-page a { color: #1d4ed8; text-decoration: underline; }
  .dy-pdf-page ul, .dy-pdf-page ol { margin: 0 0 10px; padding-left: 24px; }
  .dy-pdf-page blockquote { border-left: 3px solid #cbd5f5; padding: 4px 12px; margin: 8px 0; color: #475569; font-style: italic; }
`;

export interface HtmlToPdfOptions {
  /** Device-pixel multiplier for the rasterized capture. Higher = sharper, larger. Default 2. */
  scale?: number;
}

/**
 * Render compiled template HTML into a multi-page A4 PDF and return its bytes.
 * Runs entirely in the browser; throws if invoked outside a DOM environment.
 */
export async function htmlTemplateToPdf(
  html: string,
  options: HtmlToPdfOptions = {}
): Promise<Uint8Array> {
  if (typeof document === 'undefined') {
    throw new Error('htmlTemplateToPdf must run in a browser environment');
  }

  const scale = options.scale ?? 2;

  /*
   * Offscreen render surface — kept in-flow (not display:none) so html2canvas
   * can resolve computed styles, but pushed far off-viewport.
   */
  const container = document.createElement('div');

  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = `${A4_WIDTH_PX}px`;
  container.style.background = '#ffffff';
  container.style.zIndex = '-1';
  container.style.pointerEvents = 'none';
  container.innerHTML = `<style>${PDF_PAGE_CSS}</style><div class="dy-pdf-page">${html}</div>`;
  document.body.appendChild(container);

  try {
    const target = container.querySelector('.dy-pdf-page') as HTMLElement | null;

    if (!target) throw new Error('Failed to build PDF render surface');

    const canvas = await html2canvas(target, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX
    });

    const pdf = await PDFDocument.create();
    const pageHeightPx = Math.max(1, Math.round(A4_HEIGHT_PX * scale));
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let i = 0; i < totalPages; i += 1) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - i * pageHeightPx);

      /*
       * Each PDF page is a full A4-height slice of the tall capture. The last
       * slice is padded with white so every page keeps the A4 aspect ratio.
       */
      const sliceCanvas = document.createElement('canvas');

      sliceCanvas.width = canvas.width;
      sliceCanvas.height = pageHeightPx;

      const ctx = sliceCanvas.getContext('2d');

      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        i * pageHeightPx,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const pngBytes = sliceCanvas.toDataURL('image/png');
      const png = await pdf.embedPng(pngBytes);
      const page = pdf.addPage([A4_POINT_WIDTH, A4_POINT_HEIGHT]);

      page.drawImage(png, {
        x: 0,
        y: 0,
        width: A4_POINT_WIDTH,
        height: A4_POINT_HEIGHT
      });
    }

    return await pdf.save();
  } finally {
    document.body.removeChild(container);
  }
}

/** Convenience: produce an object URL for a generated PDF (caller must revoke). */
export function pdfBytesToObjectUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });

  return URL.createObjectURL(blob);
}