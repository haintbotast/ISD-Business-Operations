import prisma from '../config/database';
import { buildXlsxBuffer } from '../utils/excelHelper';
import { htmlToPdfBuffer } from '../utils/pdfGenerator';
import { dashboardService } from './dashboard.service';
import type { EventFilters } from '../types';

// ─── Events xlsx ─────────────────────────────────────────────────────────────

const EVENTS_HEADERS = [
  'ID', 'Năm', 'Tuần', 'Ngày', 'Địa điểm',
  'Nhóm chính', 'Danh mục', 'Thành phần HT',
  'Mô tả', 'Tác động', 'Nguyên nhân', 'Giải pháp',
  'Downtime (phút)', 'Phân loại', 'Mức độ', 'Trạng thái',
  'Người tạo', 'Ngày tạo',
];

function formatDateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const exportService = {
  async buildEventsXlsx(filters: EventFilters): Promise<Buffer> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filters.year) where.year = filters.year;
    if (filters.weekCode) where.weekCode = filters.weekCode;
    if (filters.locationCode) where.locationCode = filters.locationCode;
    if (filters.mainGroup) where.mainGroup = filters.mainGroup;
    if (filters.category) where.category = filters.category;
    if (filters.classification) where.classification = filters.classification;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { systemComponent: { contains: filters.search } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [{ year: 'desc' }, { weekCode: 'desc' }, { date: 'asc' }],
    });

    const rows: unknown[][] = [EVENTS_HEADERS];
    for (const e of events) {
      rows.push([
        e.id,
        e.year,
        e.weekCode,
        formatDateIso(e.date),
        e.locationCode,
        e.mainGroup,
        e.category,
        e.systemComponent ?? '',
        e.description,
        e.impact ?? '',
        e.rootCause ?? '',
        e.resolution ?? '',
        e.downtimeMinutes ?? '',
        e.classification,
        e.severity,
        e.status,
        e.createdBy ?? '',
        formatDateIso(e.createdAt),
      ]);
    }

    return buildXlsxBuffer(rows, 'Nhật ký sự kiện');
  },

  // ─── Weekly Matrix xlsx ────────────────────────────────────────────────────

  async buildWeeklyMatrixXlsx(week: string, year: number): Promise<Buffer> {
    const matrix = await dashboardService.getWeeklyMatrix(week, year);

    // Header row: blank + location codes
    const header: unknown[] = [`${week}/${year} — ${matrix.weekRange}`, ...matrix.locations];
    const rows: unknown[][] = [header];

    for (const cat of matrix.categories) {
      const categoryLabel = `[${cat.classification}] ${cat.mainGroup} / ${cat.category}`;
      const row: unknown[] = [categoryLabel];
      for (const loc of matrix.locations) {
        const key = `${loc}|||${cat.category}`;
        const cells = matrix.cells[key] ?? [];
        const cellText = cells
          .map(
            (c) =>
              `• ${c.description} [${c.severity}/${c.status}]${c.downtimeMinutes ? ` (${c.downtimeMinutes}')` : ''}`,
          )
          .join('\n');
        row.push(cellText || '');
      }
      rows.push(row);
    }

    return buildXlsxBuffer(rows, 'Weekly Matrix');
  },

  // ─── Weekly Matrix PDF ─────────────────────────────────────────────────────

  async buildWeeklyMatrixPdf(week: string, year: number): Promise<Buffer> {
    const matrix = await dashboardService.getWeeklyMatrix(week, year);

    const badStyle = 'background:#fee2e2;color:#991b1b;';
    const goodStyle = 'background:#dcfce7;color:#166534;';

    const locationHeaders = matrix.locations
      .map((loc) => `<th style="min-width:160px;padding:8px;border:1px solid #ccc">${loc}</th>`)
      .join('');

    const bodyRows = matrix.categories
      .map((cat) => {
        const labelStyle = cat.classification === 'Bad' ? badStyle : goodStyle;
        const cellStyle = 'padding:6px;border:1px solid #ccc;vertical-align:top;font-size:12px';
        const catCell = `<td style="${cellStyle};${labelStyle};font-weight:600;white-space:nowrap">${cat.mainGroup}<br/>${cat.category}</td>`;
        const locationCells = matrix.locations
          .map((loc) => {
            const key = `${loc}|||${cat.category}`;
            const events = matrix.cells[key] ?? [];
            const items = events
              .map(
                (e) =>
                  `<li style="margin-bottom:4px"><b>${e.severity}</b> ${e.description}<br/><span style="color:#666">${e.status}${e.downtimeMinutes ? ` · ${e.downtimeMinutes}'` : ''}</span></li>`,
              )
              .join('');
            return `<td style="${cellStyle}">${events.length ? `<ul style="margin:0;padding-left:16px">${items}</ul>` : ''}</td>`;
          })
          .join('');
        return `<tr>${catCell}${locationCells}</tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { margin: 0; padding: 16px; font-size: 13px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p { margin: 0 0 12px; color: #555; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th { background: #f1f5f9; font-size: 12px; font-weight: 700; }
</style>
</head>
<body>
<h1>Weekly Matrix — ${week}/${year}</h1>
<p>${matrix.weekRange}</p>
<table>
  <thead>
    <tr>
      <th style="width:200px;padding:8px;border:1px solid #ccc;text-align:left">Danh mục</th>
      ${locationHeaders}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;

    return htmlToPdfBuffer(html);
  },
};
