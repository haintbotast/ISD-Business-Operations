/**
 * Database seed for ISD-OMS v1.0
 *
 * ⚠️  IMPORTANT — Categories must be updated from actual Excel source:
 *     Open BS24_ISD_Operations_Template_2026.xlsx → sheet "03_DANH_MUC"
 *     Replace placeholder categories below with actual data.
 *
 * Run: cd backend && npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Week Reference Generator ─────────────────────────────────────────────────

/**
 * Returns start (Monday) and end (Sunday) dates for the given ISO week.
 * Based on ISO 8601: W01 = week containing the first Thursday of the year.
 */
function getIsoWeekDates(year: number, week: number): { start: Date; end: Date } {
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 1=Mon, 7=Sun
  const mondayOfW1 = new Date(jan4.getTime() - (jan4Day - 1) * 86_400_000);
  const start = new Date(mondayOfW1.getTime() + (week - 1) * 7 * 86_400_000);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  return { start, end };
}

/** Number of ISO weeks in a year (52 or 53). */
function isoWeeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const dec28Day = dec28.getUTCDay() || 7;
  // W53 exists if Dec 28 is in the 53rd week
  const weekNum = Math.floor((dec28.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (7 * 86_400_000)) + 1;
  return dec28Day <= 4 && weekNum >= 52 ? 53 : 52;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seedWeekReferences() {
  const years = [2024, 2025, 2026, 2027];
  const records: Array<{ year: number; weekCode: string; startDate: Date; endDate: Date }> = [];

  for (const year of years) {
    const totalWeeks = isoWeeksInYear(year);
    for (let w = 1; w <= totalWeeks; w++) {
      const weekCode = `W${String(w).padStart(2, '0')}`;
      const { start, end } = getIsoWeekDates(year, w);
      records.push({ year, weekCode, startDate: start, endDate: end });
    }
  }

  // Upsert to allow re-running seed without errors
  let created = 0;
  for (const r of records) {
    await prisma.weekReference.upsert({
      where: { year_weekCode: { year: r.year, weekCode: r.weekCode } },
      update: { startDate: r.startDate, endDate: r.endDate },
      create: r,
    });
    created++;
  }
  console.log(`[SEED] WeekReference: ${created} records (2024–2027)`);
}

async function seedLocations() {
  const locations = [
    { code: 'KDAMB', fullName: 'KDa MBien (KDAMB)', sortOrder: 1 },
    { code: 'KDAMN', fullName: 'KDa MNorth (KDAMN)', sortOrder: 2 },
    { code: 'OFFSHORE', fullName: 'Offshore', sortOrder: 3 },
    { code: 'HO', fullName: 'Head Office (HO)', sortOrder: 4 },
  ];

  for (const loc of locations) {
    await prisma.locationMaster.upsert({
      where: { code: loc.code },
      update: { fullName: loc.fullName, sortOrder: loc.sortOrder },
      create: loc,
    });
  }
  console.log(`[SEED] LocationMaster: ${locations.length} locations`);
}

async function seedCategories() {
  // ⚠️  PLACEHOLDER — replace with actual data from 03_DANH_MUC sheet
  // Classification: "Good" = planned/normal, "Bad" = incident/problem
  const categories = [
    // Infrastructure (Hạ tầng CNTT) — typically incidents → Bad
    { mainGroup: 'Hạ tầng', category: 'Máy chủ / Server', classification: 'Bad', sortOrder: 1 },
    { mainGroup: 'Hạ tầng', category: 'Lưu trữ / Storage', classification: 'Bad', sortOrder: 2 },
    { mainGroup: 'Hạ tầng', category: 'Mạng / Network', classification: 'Bad', sortOrder: 3 },
    { mainGroup: 'Hạ tầng', category: 'UPS / Điện', classification: 'Bad', sortOrder: 4 },

    // Application (Ứng dụng) — incidents → Bad
    { mainGroup: 'Ứng dụng', category: 'Ứng dụng nội bộ', classification: 'Bad', sortOrder: 1 },
    { mainGroup: 'Ứng dụng', category: 'API / Tích hợp', classification: 'Bad', sortOrder: 2 },
    { mainGroup: 'Ứng dụng', category: 'Cơ sở dữ liệu', classification: 'Bad', sortOrder: 3 },
    { mainGroup: 'Ứng dụng', category: 'Email / Collaboration', classification: 'Bad', sortOrder: 4 },

    // Security (Bảo mật) — incidents → Bad
    { mainGroup: 'Bảo mật', category: 'Tường lửa / Firewall', classification: 'Bad', sortOrder: 1 },
    { mainGroup: 'Bảo mật', category: 'Antivirus / EDR', classification: 'Bad', sortOrder: 2 },
    { mainGroup: 'Bảo mật', category: 'VPN / Remote Access', classification: 'Bad', sortOrder: 3 },
    { mainGroup: 'Bảo mật', category: 'Sự cố bảo mật', classification: 'Bad', sortOrder: 4 },

    // Operations — planned activities → Good
    { mainGroup: 'Vận hành', category: 'Bảo trì định kỳ', classification: 'Good', sortOrder: 1 },
    { mainGroup: 'Vận hành', category: 'Triển khai / Deployment', classification: 'Good', sortOrder: 2 },
    { mainGroup: 'Vận hành', category: 'Change Request', classification: 'Good', sortOrder: 3 },
    { mainGroup: 'Vận hành', category: 'Rollback', classification: 'Bad', sortOrder: 4 },

    // Connectivity (Kết nối)
    { mainGroup: 'Kết nối', category: 'Internet', classification: 'Bad', sortOrder: 1 },
    { mainGroup: 'Kết nối', category: 'WAN / MPLS', classification: 'Bad', sortOrder: 2 },
    { mainGroup: 'Kết nối', category: 'Mạng nội bộ LAN', classification: 'Bad', sortOrder: 3 },
  ];

  for (const cat of categories) {
    await prisma.categoryMaster.upsert({
      where: { mainGroup_category: { mainGroup: cat.mainGroup, category: cat.category } },
      update: { classification: cat.classification, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`[SEED] CategoryMaster: ${categories.length} categories (placeholder — update from 03_DANH_MUC)`);
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
      update: { passwordHash, displayName: u.displayName, role: u.role },
      create: { username: u.username, passwordHash, displayName: u.displayName, role: u.role },
    });
  }
  console.log(`[SEED] Users: ${users.length} users (admin/editor/viewer)`);
  console.log('[SEED] ⚠️  Default passwords are for development only — change before production!');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[SEED] Starting database seed...');
  await seedWeekReferences();
  await seedLocations();
  await seedCategories();
  await seedUsers();
  console.log('[SEED] Done.');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
