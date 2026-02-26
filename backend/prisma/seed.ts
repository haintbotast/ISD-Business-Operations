/**
 * Database seed for ISD-OMS v1.0
 *
 * Priority:
 * 1) Seed from Excel template (if available)
 * 2) Fallback to built-in master data (if Excel is missing)
 *
 * Excel source:
 * - BS24_ISD_Operations_Template_2026.xlsx
 * - Sheet "02_NHAT_KY"   -> Event data
 * - Sheet "03_DANH_MUC"  -> Master data (locations + hints)
 *
 * Run:
 *   cd backend && npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { resolve } from 'path';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

const EXCEL_FILE_NAME = 'BS24_ISD_Operations_Template_2026.xlsx';
const JOURNAL_SHEET = '02_NHAT_KY';
const MASTER_SHEET = '03_DANH_MUC';

type LocationSeed = { code: string; fullName: string; sortOrder: number };
type CategorySeed = { mainGroup: string; category: string; sortOrder: number };

type ExcelEventSeed = {
  year: number;
  weekCode: string;
  date: Date;
  locationCode: string;
  mainGroup: string;
  category: string;
  systemComponent: string | null;
  description: string;
  impact: string | null;
  rootCause: string | null;
  resolution: string | null;
  downtimeMinutes: number | null;
  classification: 'Good' | 'Bad' | 'Neutral';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdBy: string | null;
};

type ExcelSeedData = {
  sourcePath: string;
  locations: string[];
  categories: Array<{ mainGroup: string; category: string }>;
  events: ExcelEventSeed[];
};

type SeedMode = 'bootstrap' | 'import';

const KNOWN_LOCATIONS: LocationSeed[] = [
  { code: 'KDAMB', fullName: 'KDa MBien (KDAMB)', sortOrder: 1 },
  { code: 'KDAMN', fullName: 'KDa MNorth (KDAMN)', sortOrder: 2 },
  { code: 'OFFSHORE', fullName: 'Offshore', sortOrder: 3 },
  { code: 'HO', fullName: 'Head Office (HO)', sortOrder: 4 },
];

const FALLBACK_CATEGORIES: CategorySeed[] = [
  { mainGroup: 'Hạ tầng', category: 'Máy chủ / Server', sortOrder: 1 },
  { mainGroup: 'Hạ tầng', category: 'Lưu trữ / Storage', sortOrder: 2 },
  { mainGroup: 'Hạ tầng', category: 'Mạng / Network', sortOrder: 3 },
  { mainGroup: 'Hạ tầng', category: 'UPS / Điện', sortOrder: 4 },
  { mainGroup: 'Ứng dụng', category: 'Ứng dụng nội bộ', sortOrder: 5 },
  { mainGroup: 'Ứng dụng', category: 'API / Tích hợp', sortOrder: 6 },
  { mainGroup: 'Ứng dụng', category: 'Cơ sở dữ liệu', sortOrder: 7 },
  { mainGroup: 'Ứng dụng', category: 'Email / Collaboration', sortOrder: 8 },
  { mainGroup: 'Bảo mật', category: 'Tường lửa / Firewall', sortOrder: 9 },
  { mainGroup: 'Bảo mật', category: 'Antivirus / EDR', sortOrder: 10 },
  { mainGroup: 'Bảo mật', category: 'VPN / Remote Access', sortOrder: 11 },
  { mainGroup: 'Bảo mật', category: 'Sự cố bảo mật', sortOrder: 12 },
  { mainGroup: 'Vận hành', category: 'Bảo trì định kỳ', sortOrder: 13 },
  { mainGroup: 'Vận hành', category: 'Triển khai / Deployment', sortOrder: 14 },
  { mainGroup: 'Vận hành', category: 'Change Request', sortOrder: 15 },
  { mainGroup: 'Vận hành', category: 'Rollback', sortOrder: 16 },
  { mainGroup: 'Kết nối', category: 'Internet', sortOrder: 17 },
  { mainGroup: 'Kết nối', category: 'WAN / MPLS', sortOrder: 18 },
  { mainGroup: 'Kết nối', category: 'Mạng nội bộ LAN', sortOrder: 19 },
];

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeForMatch(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalLocationCode(raw: string): string {
  const normalized = normalizeText(raw).toUpperCase().replace(/\s+/g, '');
  if (!normalized) return '';
  if (normalized === 'OFFSHORE') return 'OFFSHORE';
  return normalized;
}

function normalizeWeekCode(raw: string): string | null {
  const value = normalizeText(raw).toUpperCase().replace(/\s+/g, '');
  if (!value) return null;
  const match = /^W?(\d{1,2})$/.exec(value);
  if (!match) return null;
  const week = Number(match[1]);
  if (!Number.isInteger(week) || week < 1 || week > 53) return null;
  return `W${String(week).padStart(2, '0')}`;
}

function toDateOnlyUtc(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0));
  }

  const raw = normalizeText(value);
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return new Date(Date.UTC(direct.getFullYear(), direct.getMonth(), direct.getDate(), 0, 0, 0, 0));
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(normalizeText(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDowntimeFromDescription(description: string): number | null {
  const text = normalizeForMatch(description);
  if (!text) return null;

  const hourMinute = /(\d+)\s*h(?:\s*(\d+)\s*(?:phut|p)?)?/.exec(text);
  if (hourMinute) {
    const hours = Number(hourMinute[1]);
    const minutes = hourMinute[2] ? Number(hourMinute[2]) : 0;
    const total = hours * 60 + minutes;
    if (total > 0) return total;
  }

  const minuteOnly = /(\d+)\s*(?:phut|p)\b/.exec(text);
  if (minuteOnly) {
    const minutes = Number(minuteOnly[1]);
    if (minutes > 0) return minutes;
  }

  return null;
}

function inferClassification(mainGroup: string, category: string): 'Good' | 'Bad' | 'Neutral' {
  const token = `${normalizeForMatch(mainGroup)} ${normalizeForMatch(category)}`;

  if (/(su co|downtime|tac dong|moi de doa|bao mat|truy cap|sao luu|kiem toan|ban va)/.test(token)) {
    return 'Bad';
  }
  if (/(toi uu|du an|trien khai|nang cap|tang|giam|hieu qua|chi phi)/.test(token)) {
    return 'Good';
  }

  return 'Bad';
}

function mapClassification(raw: string, mainGroup: string, category: string): 'Good' | 'Bad' | 'Neutral' {
  const value = normalizeForMatch(raw);
  if (value === 'good') return 'Good';
  if (value === 'bad') return 'Bad';
  if (value === 'neutral') return 'Neutral';
  return inferClassification(mainGroup, category);
}

function mapStatus(raw: string): 'Open' | 'In Progress' | 'Resolved' | 'Closed' {
  const value = normalizeForMatch(raw);

  if (/da dong|closed/.test(value)) return 'Closed';
  if (/resolved|da giai quyet/.test(value)) return 'Resolved';
  if (/dang xu ly|cho xac nhan|hoan|in progress/.test(value)) return 'In Progress';
  if (/mo|open/.test(value)) return 'Open';

  return 'Open';
}

function mapSeverity(raw: string, category: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const value = normalizeForMatch(raw);
  if (/nghiem trong|critical/.test(value)) return 'Critical';
  if (/cao|high/.test(value)) return 'High';
  if (/trung binh|medium/.test(value)) return 'Medium';
  if (/thap|low/.test(value)) return 'Low';

  const categoryToken = normalizeForMatch(category);
  if (/(downtime|su co|moi de doa|bao mat)/.test(categoryToken)) return 'High';
  return 'Medium';
}

function inferDowntimeMinutes(rawDowntime: unknown, description: string, category: string): number | null {
  const explicit = toNumber(rawDowntime);
  if (explicit != null && explicit >= 0) {
    return Math.round(explicit);
  }

  const categoryToken = normalizeForMatch(category);
  if (categoryToken.includes('downtime')) {
    return parseDowntimeFromDescription(description);
  }

  return null;
}

// -------- Excel column discovery --------

/**
 * Each entry maps a logical field name to its list of normalized header aliases
 * (diacritics stripped, lowercase) and a hardcoded fallback index for sheets
 * that have no header row or use an unexpected layout.
 */
const JOURNAL_COL_DEFS: Array<{ field: string; aliases: string[]; fallback: number }> = [
  { field: 'date',            aliases: ['ngay', 'date', 'ngay thang', 'thoi gian'],                    fallback: 1  },
  { field: 'weekCode',        aliases: ['tuan', 'week', 'so tuan', 'tuan le'],                          fallback: 2  },
  { field: 'locationCode',    aliases: ['vi tri', 'location', 'dia diem'],                              fallback: 3  },
  { field: 'mainGroup',       aliases: ['nhom chinh', 'main group', 'nhom'],                            fallback: 4  },
  { field: 'category',        aliases: ['hang muc', 'category', 'danh muc', 'loai su co'],              fallback: 5  },
  { field: 'systemComponent', aliases: ['he thong', 'system', 'component', 'thanh phan'],               fallback: 6  },
  { field: 'severity',        aliases: ['muc do', 'severity', 'cap do'],                                fallback: 8  },
  { field: 'status',          aliases: ['trang thai', 'status', 'tinh trang'],                          fallback: 9  },
  { field: 'createdByPri',    aliases: ['nguoi tao', 'created by', 'nguoi thuc hien'],                  fallback: 10 },
  { field: 'description',     aliases: ['mo ta', 'description', 'noi dung', 'chi tiet su co'],          fallback: 12 },
  { field: 'impact',          aliases: ['anh huong', 'impact', 'tac dong'],                             fallback: 13 },
  { field: 'downtimeRaw',     aliases: ['thoi gian down', 'downtime', 'so phut gian doan'],             fallback: 14 },
  { field: 'rootCause',       aliases: ['nguyen nhan', 'root cause', 'nguyen nhan goc'],                fallback: 15 },
  { field: 'resolution',      aliases: ['giai phap', 'resolution', 'xu ly', 'bien phap xu ly'],         fallback: 16 },
  { field: 'createdByAlt',    aliases: ['nguoi cap nhat', 'updated by', 'nhan vien'],                   fallback: 20 },
  { field: 'classification',  aliases: ['phan loai', 'classification', 'loai good bad', 'good bad'],    fallback: 21 },
];

/**
 * Builds a field-name → column-index map by matching normalized header cell
 * values against known aliases.  Falls back to hardcoded index when a header
 * is not found so the import still works on headerless / reordered sheets.
 */
function buildJournalColMap(headerRow: unknown[]): Record<string, number> {
  const colMap: Record<string, number> = {};
  const usedByHeader: string[] = [];

  for (const def of JOURNAL_COL_DEFS) {
    let found = false;
    for (let i = 0; i < headerRow.length; i += 1) {
      const cell = normalizeForMatch(normalizeText(headerRow[i]));
      if (!cell) continue;
      const matched = def.aliases.some(
        (alias) => cell === alias || cell.includes(alias) || (alias.includes(cell) && cell.length > 2),
      );
      if (matched) {
        colMap[def.field] = i;
        usedByHeader.push(def.field);
        found = true;
        break;
      }
    }
    if (!found) {
      colMap[def.field] = def.fallback;
    }
  }

  if (usedByHeader.length > 0) {
    console.log(`[SEED] Journal header detection: ${usedByHeader.length}/${JOURNAL_COL_DEFS.length} columns matched by name.`);
  } else {
    console.log('[SEED] Journal header detection: no headers matched — using fallback column indices.');
  }

  return colMap;
}

function resolveExcelPath(): string | null {
  const envPath = process.env.EXCEL_TEMPLATE_PATH?.trim();

  const candidates = [
    envPath ? resolve(process.cwd(), envPath) : null,
    resolve(process.cwd(), EXCEL_FILE_NAME),
    resolve(process.cwd(), '..', EXCEL_FILE_NAME),
    resolve(process.cwd(), '..', '..', EXCEL_FILE_NAME),
    resolve(__dirname, '..', EXCEL_FILE_NAME),
    resolve(__dirname, '..', '..', EXCEL_FILE_NAME),
    resolve(__dirname, '..', '..', '..', EXCEL_FILE_NAME),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

function loadExcelSeedData(): ExcelSeedData | null {
  const excelPath = resolveExcelPath();
  if (!excelPath) {
    console.log(`[SEED] Excel not found (${EXCEL_FILE_NAME}). Using fallback master data.`);
    return null;
  }

  const workbook = XLSX.readFile(excelPath, { cellDates: true });
  const journalSheet = workbook.Sheets[JOURNAL_SHEET];
  const masterSheet = workbook.Sheets[MASTER_SHEET];

  if (!journalSheet || !masterSheet) {
    console.log(`[SEED] Missing sheets "${JOURNAL_SHEET}" or "${MASTER_SHEET}". Using fallback master data.`);
    return null;
  }

  const journalRows = XLSX.utils.sheet_to_json<unknown[]>(journalSheet, { header: 1, defval: '' });
  const masterRows = XLSX.utils.sheet_to_json<unknown[]>(masterSheet, { header: 1, defval: '' });

  // Build column map from header row (row index 5 = Excel row 6).
  // Falls back to hardcoded indices when headers are not detected.
  const journalHeaderRow = journalRows[5] ?? [];
  const colMap = buildJournalColMap(journalHeaderRow);

  const locationSet = new Set<string>();

  // Master sheet location list (column A, row 6+)
  for (let i = 5; i < masterRows.length; i += 1) {
    const row = masterRows[i] ?? [];
    const code = canonicalLocationCode(normalizeText(row[0]));
    if (code) locationSet.add(code);
  }

  const events: ExcelEventSeed[] = [];
  const categoryStats = new Map<string, { mainGroup: string; category: string }>();

  // Journal data rows start after header (row index 6 = Excel row 7)
  for (let i = 6; i < journalRows.length; i += 1) {
    const row = journalRows[i] ?? [];

    const date = toDateOnlyUtc(row[colMap['date']]);
    const weekCode = normalizeWeekCode(normalizeText(row[colMap['weekCode']]));
    const locationCode = canonicalLocationCode(normalizeText(row[colMap['locationCode']]));
    const mainGroup = normalizeText(row[colMap['mainGroup']]);
    const category = normalizeText(row[colMap['category']]);
    const systemComponent = normalizeText(row[colMap['systemComponent']]) || null;
    const rawSeverity = normalizeText(row[colMap['severity']]);
    const rawStatus = normalizeText(row[colMap['status']]);
    const createdBy =
      normalizeText(row[colMap['createdByPri']]) ||
      normalizeText(row[colMap['createdByAlt']]) ||
      'excel-import';
    const description = normalizeText(row[colMap['description']]) || `${mainGroup} - ${category}`;
    const impact = normalizeText(row[colMap['impact']]) || null;
    const rawDowntime = row[colMap['downtimeRaw']];
    const rootCause = normalizeText(row[colMap['rootCause']]) || null;
    const resolution = normalizeText(row[colMap['resolution']]) || null;
    const rawClassification = normalizeText(row[colMap['classification']]);

    // Skip blank/invalid rows
    if (!date || !weekCode || !locationCode || !mainGroup || !category) continue;

    const year = date.getUTCFullYear();
    const classification = mapClassification(rawClassification, mainGroup, category);
    const severity = mapSeverity(rawSeverity, category);
    const status = mapStatus(rawStatus);
    const downtimeMinutes = inferDowntimeMinutes(rawDowntime, description, category);

    const event: ExcelEventSeed = {
      year,
      weekCode,
      date,
      locationCode,
      mainGroup,
      category,
      systemComponent,
      description,
      impact,
      rootCause,
      resolution,
      downtimeMinutes,
      classification,
      severity,
      status,
      createdBy,
    };

    events.push(event);
    locationSet.add(locationCode);

    const key = `${mainGroup}|||${category}`;
    if (!categoryStats.has(key)) {
      categoryStats.set(key, { mainGroup, category });
    }
  }

  const categories = Array.from(categoryStats.values())
    .sort((a, b) => a.mainGroup.localeCompare(b.mainGroup) || a.category.localeCompare(b.category));

  console.log(
    `[SEED] Excel loaded: ${events.length} events, ${categories.length} categories, ${locationSet.size} locations from ${excelPath}`,
  );

  return {
    sourcePath: excelPath,
    locations: Array.from(locationSet.values()).sort((a, b) => a.localeCompare(b)),
    categories,
    events,
  };
}

// -------- Week reference generator --------

function getIsoWeekDates(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 1=Mon, 7=Sun
  const mondayOfW1 = new Date(jan4.getTime() - (jan4Day - 1) * 86_400_000);
  const start = new Date(mondayOfW1.getTime() + (week - 1) * 7 * 86_400_000);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  return { start, end };
}

function isoWeeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const dec28Day = dec28.getUTCDay() || 7;
  const weekNum =
    Math.floor((dec28.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (7 * 86_400_000)) + 1;
  return dec28Day <= 4 && weekNum >= 52 ? 53 : 52;
}

async function seedWeekReferences() {
  const years = [2024, 2025, 2026, 2027];
  const records: Array<{ year: number; weekCode: string; startDate: Date; endDate: Date }> = [];

  for (const year of years) {
    const totalWeeks = isoWeeksInYear(year);
    for (let w = 1; w <= totalWeeks; w += 1) {
      const weekCode = `W${String(w).padStart(2, '0')}`;
      const { start, end } = getIsoWeekDates(year, w);
      records.push({ year, weekCode, startDate: start, endDate: end });
    }
  }

  for (const r of records) {
    await prisma.weekReference.upsert({
      where: { year_weekCode: { year: r.year, weekCode: r.weekCode } },
      update: { startDate: r.startDate, endDate: r.endDate },
      create: r,
    });
  }

  console.log(`[SEED] WeekReference: ${records.length} records (2024-2027)`);
}

async function seedLocations(excelData: ExcelSeedData | null) {
  const knownByCode = new Map<string, LocationSeed>();
  for (const location of KNOWN_LOCATIONS) {
    knownByCode.set(location.code, location);
  }

  const merged = new Map<string, LocationSeed>();

  for (const base of KNOWN_LOCATIONS) {
    merged.set(base.code, base);
  }

  if (excelData) {
    let nextSortOrder = KNOWN_LOCATIONS.length + 1;
    for (const code of excelData.locations) {
      if (merged.has(code)) continue;
      const known = knownByCode.get(code);
      if (known) {
        merged.set(code, known);
      } else {
        merged.set(code, { code, fullName: code, sortOrder: nextSortOrder });
        nextSortOrder += 1;
      }
    }
  }

  const locations = Array.from(merged.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code),
  );

  for (const loc of locations) {
    await prisma.locationMaster.upsert({
      where: { code: loc.code },
      update: { fullName: loc.fullName, sortOrder: loc.sortOrder, isActive: true },
      create: loc,
    });
  }

  console.log(`[SEED] LocationMaster: ${locations.length} locations`);
}

async function seedCategories(excelData: ExcelSeedData | null) {
  const excelCategories = excelData?.categories ?? [];
  const useExcelCategories = excelCategories.length > 0;
  const categories: CategorySeed[] =
    useExcelCategories
      ? excelCategories.map((cat, index) => ({
          mainGroup: cat.mainGroup,
          category: cat.category,
          sortOrder: index + 1,
        }))
      : FALLBACK_CATEGORIES;

  await prisma.$transaction(async (tx) => {
    await tx.categoryMaster.deleteMany({});
    await tx.categoryMaster.createMany({
      data: categories.map((cat) => ({
        mainGroup: cat.mainGroup,
        category: cat.category,
        sortOrder: cat.sortOrder,
        isActive: true,
      })),
    });
  });

  const source = useExcelCategories && excelData ? `Excel (${excelData.sourcePath})` : 'fallback';
  console.log(`[SEED] CategoryMaster: ${categories.length} categories from ${source}`);
}

async function seedUsers() {
  const SALT_ROUNDS = 10;
  const users = [
    { username: 'admin', password: 'admin123', displayName: 'Administrator', role: 'Admin' },
    { username: 'editor', password: 'editor123', displayName: 'ISD Editor', role: 'Editor' },
    { username: 'viewer', password: 'viewer123', displayName: 'Viewer', role: 'Viewer' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, displayName: u.displayName, role: u.role, isActive: true },
      create: { username: u.username, passwordHash, displayName: u.displayName, role: u.role },
    });
  }

  console.log(`[SEED] Users: ${users.length} users (admin/editor/viewer)`);
  console.log('[SEED] WARNING: default passwords are for development only.');
}

async function seedEventsFromExcel(excelData: ExcelSeedData | null) {
  if (!excelData || excelData.events.length === 0) {
    console.log('[SEED] Event: skipped (no Excel event rows found).');
    return;
  }

  const BATCH_SIZE = 200;

  // Wrap delete + all inserts in a single transaction so a failed batch
  // does not leave the table empty (all-or-nothing import).
  await prisma.$transaction(
    async (tx) => {
      await tx.event.deleteMany({});

      for (let i = 0; i < excelData.events.length; i += BATCH_SIZE) {
        const chunk = excelData.events.slice(i, i + BATCH_SIZE);
        await tx.event.createMany({
          data: chunk.map((event) => ({
            year: event.year,
            weekCode: event.weekCode,
            date: event.date,
            locationCode: event.locationCode,
            mainGroup: event.mainGroup,
            category: event.category,
            systemComponent: event.systemComponent,
            description: event.description,
            impact: event.impact,
            rootCause: event.rootCause,
            resolution: event.resolution,
            downtimeMinutes: event.downtimeMinutes,
            classification: event.classification,
            severity: event.severity,
            status: event.status,
            createdBy: event.createdBy,
          })),
        });
      }
    },
    { timeout: 60_000 }, // large imports may take >5 s (Prisma default)
  );

  console.log(`[SEED] Event: imported ${excelData.events.length} rows from Excel`);
}

function getSeedMode(): SeedMode {
  const raw = (process.env.SEED_MODE ?? 'bootstrap').trim().toLowerCase();
  if (raw === 'import') return 'import';
  return 'bootstrap';
}

async function main() {
  const mode = getSeedMode();
  console.log(`[SEED] Starting database seed (mode=${mode})...`);

  const excelData = loadExcelSeedData();

  if (mode === 'import' && !excelData) {
    throw new Error(
      `[SEED] Excel import mode requires file "${EXCEL_FILE_NAME}". Set EXCEL_TEMPLATE_PATH or mount file before running import.`,
    );
  }

  await seedWeekReferences();
  await seedLocations(excelData);
  await seedCategories(excelData);

  if (mode === 'bootstrap') {
    await seedUsers();
  } else {
    console.log('[SEED] Users: skipped (import mode).');
  }

  await seedEventsFromExcel(excelData);

  console.log('[SEED] Done.');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
