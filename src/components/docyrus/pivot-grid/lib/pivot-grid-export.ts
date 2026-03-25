import { type PivotGridRenderedColumnKind, type PivotGridRenderedRow } from '../types';

export interface PivotGridExportColumn {
  id: string;
  headerPath: Array<string>;
  width: number;
  kind: PivotGridRenderedColumnKind;
}

export interface PivotGridExportSnapshot<TData> {
  fileName: string;
  headerDepth: number;
  rowHeaderLabels: Array<string>;
  rowHeaderWidths: Array<number>;
  valueColumns: Array<PivotGridExportColumn>;
  rows: Array<PivotGridRenderedRow<TData>>;
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

export function downloadTextFile(content: string, fileName: string): void {
  downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), fileName);
}

export function buildPivotGridCsv(snapshot: PivotGridExportSnapshot<unknown>): string {
  const headerRow = [
    ...snapshot.rowHeaderLabels,
    ...snapshot.valueColumns.map((column) => {
      const labels = column.headerPath.filter(Boolean);

      return labels.length > 0 ? labels.join(' / ') : 'Value';
    })
  ];

  const bodyRows = snapshot.rows.map((row) => {
    const rowHeaders = row.headerCells.map(cell => cell.label);
    const values = snapshot.valueColumns.map(
      column => row.cellMap.get(column.id)?.formattedValue ?? ''
    );

    return [...rowHeaders, ...values];
  });

  return [headerRow, ...bodyRows]
    .map(row => row.map(value => escapeCsvValue(value ?? '')).join(','))
    .join('\n');
}

function buildHeaderMatrix(snapshot: PivotGridExportSnapshot<unknown>): Array<Array<string>> {
  const headerMatrix = Array.from(
    { length: snapshot.headerDepth },
    () => Array.from(
      { length: snapshot.rowHeaderLabels.length + snapshot.valueColumns.length },
      () => ''
    )
  );

  snapshot.rowHeaderLabels.forEach((label, columnIndex) => {
    (headerMatrix[0] as string[])[columnIndex] = label;
  });

  snapshot.valueColumns.forEach((column, columnIndex) => {
    column.headerPath.forEach((label, level) => {
      (headerMatrix[level] as string[])[snapshot.rowHeaderLabels.length + columnIndex] = label;
    });
  });

  return headerMatrix;
}

export async function exportPivotGridExcel(
  snapshot: PivotGridExportSnapshot<unknown>
): Promise<void> {
  const { Workbook } = await import('exceljs');

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Pivot Grid', {
    views: [
      {
        state: 'frozen',
        xSplit: snapshot.rowHeaderLabels.length,
        ySplit: snapshot.headerDepth
      }
    ]
  });

  const headerMatrix = buildHeaderMatrix(snapshot);
  const valueColumnOffset = snapshot.rowHeaderLabels.length;

  headerMatrix.forEach((row) => {
    worksheet.addRow(row);
  });

  for (let columnIndex = 0; columnIndex < snapshot.rowHeaderLabels.length; columnIndex += 1) {
    if (snapshot.headerDepth > 1) {
      worksheet.mergeCells(1, columnIndex + 1, snapshot.headerDepth, columnIndex + 1);
    }
  }

  for (let level = 0; level < snapshot.headerDepth; level += 1) {
    let startIndex = valueColumnOffset;
    const levelRow = headerMatrix[level] as string[];
    let previousValue = levelRow[valueColumnOffset] ?? '';

    for (let columnIndex = valueColumnOffset + 1; columnIndex <= levelRow.length; columnIndex += 1) {
      const nextValue = levelRow[columnIndex] ?? '';

      if (
        previousValue
        && previousValue === nextValue
      ) {
        continue;
      }

      if (previousValue && columnIndex - startIndex > 1) {
        worksheet.mergeCells(level + 1, startIndex + 1, level + 1, columnIndex);
      }

      startIndex = columnIndex;
      previousValue = nextValue;
    }
  }

  snapshot.rows.forEach((row) => {
    worksheet.addRow([
      ...row.headerCells.map(cell => cell.label),
      ...snapshot.valueColumns.map(
        column => row.cellMap.get(column.id)?.formattedValue ?? ''
      )
    ]);
  });

  worksheet.columns = [...snapshot.rowHeaderWidths.map(width => ({ width: Math.max(12, width / 8) })), ...snapshot.valueColumns.map(column => ({ width: Math.max(12, column.width / 8) }))];

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, columnNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      if (rowNumber <= snapshot.headerDepth) {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };

        return;
      }

      const dataRow = snapshot.rows[rowNumber - snapshot.headerDepth - 1];

      if (!dataRow) {
        return;
      }

      const isValueColumn = columnNumber > snapshot.rowHeaderLabels.length;
      const valueColumn = isValueColumn ? snapshot.valueColumns[columnNumber - snapshot.rowHeaderLabels.length - 1] : null;

      if (dataRow.kind === 'grand-total') {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7EB' }
        };
      } else if (dataRow.kind === 'subtotal') {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      if (valueColumn?.kind === 'grand-total' && dataRow.kind !== 'grand-total') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7EB' }
        };
      } else if (valueColumn?.kind === 'subtotal' && dataRow.kind === 'leaf') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    `${snapshot.fileName}.xlsx`
  );
}

export async function exportPivotGridPdf(params: {
  element: HTMLElement;
  fileName: string;
}): Promise<void> {
  const { element, fileName } = params;
  const { default: html2canvas } = await import('html2canvas-pro');
  const PDFLib = await import('pdf-lib');

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const pdfDocument = await PDFLib.PDFDocument.create();
  const page = pdfDocument.addPage([canvas.width, canvas.height]);
  const image = await pdfDocument.embedPng(canvas.toDataURL('image/png'));

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  });

  const pdfBytes = await pdfDocument.save();
  const pdfArray = Uint8Array.from(pdfBytes);

  downloadBlob(
    new Blob([pdfArray.buffer], { type: 'application/pdf' }),
    `${fileName}.pdf`
  );
}