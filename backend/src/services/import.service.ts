import prisma from '../config/database';
import { parseXlsxBuffer } from '../utils/excelHelper';
import { sseManager } from '../utils/sseManager';
import type { ImportPreviewRow, ImportPreviewResponse, ImportExecuteResponse } from '../types';

// ─── Column definition (same format as seed.ts JOURNAL_COL_DEFS) ─────────────

interface ColDef {
  field: string;
  aliases: string[];
  fallback: number;
}

const JOURNAL_COL_DEFS: ColDef[] = [
  { field: 'date',           aliases: ['ngay', 'date', 'ngay thang'],          fallback: 1 },
  { field: 'weekCode',       aliases: ['tuan', 'week', 'so tuan'],              fallback: 2 },
  { field: 'locationCode',   aliases: ['dia diem', 'location', 'vi tri'],       fallback: 3 },
  { field: 'mainGroup',      aliases: ['nhom chinh', 'main group', 'nhom'],     fallback: 4 },
  { field: 'category',       aliases: ['danh muc', 'category', 'phan loai dm'], fallback: 5 },
  { field: 'systemComponent',aliases: ['thanh phan', 'component', 'he thong'],  fallback: 6 },
  { field: 'description',    aliases: ['mo ta', 'description', 'noi dung'],     fallback: 7 },
  { field: 'impact',         aliases: ['tac dong', 'impact', 'anh huong'],      fallback: 8 },
  { field: 'rootCause',      aliases: ['nguyen nhan', 'root cause', 'ngnhan'],  fallback: 9 },
  { field: 'resolution',     aliases: ['giai phap', 'resolution', 'xu ly'],     fallback: 10 },
  { field: 'downtime',       aliases: ['downtime', 'ngung hoat dong', 'phut'],  fallback: 11 },
  { field: 'classification', aliases: ['phan loai', 'classification', 'loai'],  fallback: 12 },
  { field: 'severity',       aliases: ['muc do', 'severity', 'cap do'],         fallback: 13 },
  { field: 'status',         aliases: ['trang thai', 'status'],                 fallback: 14 },
  { field: 'createdBy',      aliases: ['nguoi tao', 'created by', 'tao boi'],   fallback: 15 },
  { field: 'impactScope',    aliases: ['pham vi', 'impact scope', 'anh huong pham vi'], fallback: 16 },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function buildColMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const def of JOURNAL_COL_DEFS) {
    let found = -1;
    for (let i = 0; i < headerRow.length; i++) {
      const cell = normalize(String(headerRow[i] ?? ''));
      if (def.aliases.some((alias) => cell.includes(alias))) {
        found = i;
        break;
      }
    }
    map[def.field] = found >= 0 ? found : def.fallback;
  }
  return map;
}

function cellStr(row: unknown[], idx: number): string {
  return String(row[idx] ?? '').trim();
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // Try DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
  // Try ISO
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function parseWeekCode(raw: string): string | null {
  const m = raw.match(/W(\d{1,2})/i);
  if (!m) return null;
  return `W${String(m[1]).padStart(2, '0')}`;
}

// ─── Parse rows from sheet ────────────────────────────────────────────────────

interface ParsedRow {
  rowNumber: number;
  year: number | null;
  weekCode: string | null;
  date: string | null;
  locationCode: string;
  mainGroup: string;
  category: string;
  systemComponent: string;
  description: string;
  impact: string;
  rootCause: string;
  resolution: string;
  downtimeMinutes: number | null;
  classification: string;
  impactScope: string;
  severity: string;
  status: string;
  createdBy: string;
  parseError: string | null;
}

function parseRows(rows: unknown[][]): ParsedRow[] {
  // Find header row — look for row containing "tuan" or "week" in first 10 rows
  let headerRowIdx = 4; // default row 5 (0-indexed 4)
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const joined = rows[i].map((c) => normalize(String(c ?? ''))).join('|');
    if (joined.includes('tuan') || joined.includes('week')) {
      headerRowIdx = i;
      break;
    }
  }

  const colMap = buildColMap(rows[headerRowIdx] ?? []);
  const dataRows = rows.slice(headerRowIdx + 1);
  const parsed: ParsedRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = headerRowIdx + 2 + i; // 1-indexed sheet row

    // Skip empty rows
    if (row.every((c) => !String(c ?? '').trim())) continue;

    const rawDate = cellStr(row, colMap['date']);
    const rawWeek = cellStr(row, colMap['weekCode']);
    const description = cellStr(row, colMap['description']);

    const dateObj = parseDate(rawDate);
    const weekCode = parseWeekCode(rawWeek);

    let parseError: string | null = null;
    if (!dateObj) parseError = `Invalid date: "${rawDate}"`;
    else if (!weekCode) parseError = `Invalid week code: "${rawWeek}"`;
    else if (!description) parseError = 'Description is required';

    const rawDowntime = cellStr(row, colMap['downtime']);
    const downtimeMinutes = rawDowntime ? parseInt(rawDowntime, 10) || null : null;

    const rawClassification = cellStr(row, colMap['classification']);
    const classification = rawClassification.toLowerCase().includes('good') ? 'Good' : 'Bad';

    const rawScope = cellStr(row, colMap['impactScope']);
    const scopeMap: Record<string, string> = {
      individual: 'Individual', 'ca nhan': 'Individual',
      team: 'Team', nhom: 'Team', 'bo phan': 'Team',
      site: 'Site', 'chi nhanh': 'Site', 'ra point': 'Site',
      multisite: 'MultiSite', 'lien chi nhanh': 'MultiSite', 'nhieu site': 'MultiSite',
      enterprise: 'Enterprise', 'toan to chuc': 'Enterprise', 'toan cong ty': 'Enterprise',
    };
    const impactScope = scopeMap[normalize(rawScope)] ?? 'Site';

    const rawSeverity = cellStr(row, colMap['severity']);
    const severityMap: Record<string, string> = {
      critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
      'nghiem trong': 'Critical', cao: 'High', 'trung binh': 'Medium', thap: 'Low',
    };
    const severity = severityMap[normalize(rawSeverity)] ?? 'Medium';

    const rawStatus = cellStr(row, colMap['status']);
    let status = 'Open';
    const normStatus = normalize(rawStatus);
    if (normStatus.includes('progress') || normStatus.includes('dang')) status = 'In Progress';
    else if (normStatus.includes('resolv') || normStatus.includes('giai quyet')) status = 'Resolved';
    else if (normStatus.includes('clos') || normStatus.includes('dong')) status = 'Closed';

    const year = dateObj ? dateObj.getUTCFullYear() : null;

    parsed.push({
      rowNumber,
      year,
      weekCode,
      date: dateObj ? dateObj.toISOString() : null,
      locationCode: cellStr(row, colMap['locationCode']),
      mainGroup: cellStr(row, colMap['mainGroup']),
      category: cellStr(row, colMap['category']),
      systemComponent: cellStr(row, colMap['systemComponent']),
      description,
      impact: cellStr(row, colMap['impact']),
      rootCause: cellStr(row, colMap['rootCause']),
      resolution: cellStr(row, colMap['resolution']),
      downtimeMinutes,
      classification,
      impactScope,
      severity,
      status,
      createdBy: cellStr(row, colMap['createdBy']),
      parseError,
    });
  }
  return parsed;
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

async function findDuplicateKeys(parsedRows: ParsedRow[]): Promise<Set<string>> {
  const validRows = parsedRows.filter((r) => !r.parseError && r.year && r.weekCode);
  if (!validRows.length) return new Set();

  const existing = await prisma.event.findMany({
    where: {
      deletedAt: null,
      OR: validRows.map((r) => ({
        year: r.year!,
        weekCode: r.weekCode!,
        locationCode: r.locationCode,
        description: r.description,
      })),
    },
    select: { year: true, weekCode: true, locationCode: true, description: true },
  });

  return new Set(existing.map((e) => `${e.year}|${e.weekCode}|${e.locationCode}|${e.description}`));
}

// ─── Public service ───────────────────────────────────────────────────────────

export const importService = {
  async preview(buffer: Buffer): Promise<ImportPreviewResponse> {
    const rows = parseXlsxBuffer(buffer);
    const parsed = parseRows(rows);
    const dupKeys = await findDuplicateKeys(parsed);

    const previewRows: ImportPreviewRow[] = parsed.slice(0, 20).map((r) => ({
      rowNumber: r.rowNumber,
      weekCode: r.weekCode ?? '',
      date: r.date ?? '',
      locationCode: r.locationCode,
      mainGroup: r.mainGroup,
      category: r.category,
      description: r.description,
      isDuplicate: dupKeys.has(`${r.year}|${r.weekCode}|${r.locationCode}|${r.description}`),
      parseError: r.parseError ?? undefined,
    }));

    const valid = parsed.filter((r) => !r.parseError && r.year && r.weekCode).length;
    const parseErrors = parsed.filter((r) => !!r.parseError).length;
    const duplicates = parsed.filter((r) =>
      dupKeys.has(`${r.year}|${r.weekCode}|${r.locationCode}|${r.description}`),
    ).length;

    return {
      total: parsed.length,
      valid,
      duplicates,
      parseErrors,
      previewRows,
    };
  },

  async execute(
    buffer: Buffer,
    duplicateAction: 'skip' | 'replace',
    importedBy: string,
  ): Promise<ImportExecuteResponse> {
    const rows = parseXlsxBuffer(buffer);
    const parsed = parseRows(rows);
    const dupKeys = await findDuplicateKeys(parsed);

    let imported = 0;
    let skipped = 0;
    let replaced = 0;
    let errors = 0;
    const errorDetails: Array<{ rowNumber: number; error: string }> = [];

    for (const row of parsed) {
      if (row.parseError) {
        errors++;
        errorDetails.push({ rowNumber: row.rowNumber, error: row.parseError });
        continue;
      }
      if (!row.year || !row.weekCode || !row.date) {
        errors++;
        errorDetails.push({ rowNumber: row.rowNumber, error: 'Missing required fields' });
        continue;
      }

      const dupKey = `${row.year}|${row.weekCode}|${row.locationCode}|${row.description}`;
      const isDup = dupKeys.has(dupKey);

      try {
        // Verify weekCode exists in WeekReference
        const weekRef = await prisma.weekReference.findUnique({
          where: { year_weekCode: { year: row.year, weekCode: row.weekCode } },
        });
        if (!weekRef) {
          errors++;
          errorDetails.push({
            rowNumber: row.rowNumber,
            error: `Week ${row.weekCode}/${row.year} not found in reference table`,
          });
          continue;
        }

        if (isDup && duplicateAction === 'skip') {
          skipped++;
          continue;
        }

        if (isDup && duplicateAction === 'replace') {
          // Soft-delete existing then create new
          await prisma.event.updateMany({
            where: {
              year: row.year,
              weekCode: row.weekCode,
              locationCode: row.locationCode,
              description: row.description,
              deletedAt: null,
            },
            data: { deletedAt: new Date() },
          });
          replaced++;
        }

        await prisma.event.create({
          data: {
            year: row.year,
            weekCode: row.weekCode,
            date: new Date(row.date),
            locationCode: row.locationCode,
            mainGroup: row.mainGroup,
            category: row.category,
            systemComponent: row.systemComponent || null,
            description: row.description,
            impact: row.impact || null,
            rootCause: row.rootCause || null,
            resolution: row.resolution || null,
            downtimeMinutes: row.downtimeMinutes,
            classification: row.classification,
            impactScope: row.impactScope,
            severity: row.severity,
            status: row.status,
            createdBy: row.createdBy || importedBy,
          },
        });

        if (!isDup) imported++;
      } catch (err) {
        errors++;
        errorDetails.push({
          rowNumber: row.rowNumber,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Broadcast SSE so open clients refresh their event list
    if (imported + replaced > 0) {
      sseManager.broadcast('created', 'bulk', importedBy);
    }

    return { imported, skipped, replaced, errors, errorDetails };
  },
};
