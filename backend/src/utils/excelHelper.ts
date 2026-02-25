import * as XLSX from 'xlsx';

/**
 * Build an xlsx Buffer from a 2-D array (array-of-arrays).
 * First row is the header row.
 */
export function buildXlsxBuffer(data: unknown[][], sheetName = 'Sheet1'): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer);
}

/**
 * Parse an xlsx Buffer into a 2-D array of raw cell values.
 * cellDates:true converts date cells to JS Date objects.
 */
export function parseXlsxBuffer(buffer: Buffer): unknown[][] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false });
}
