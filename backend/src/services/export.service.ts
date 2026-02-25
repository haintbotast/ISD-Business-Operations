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
  'Downtime (phút)', 'Phân loại', 'Phạm vi ảnh hưởng', 'Mức độ', 'Trạng thái',
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
        e.impactScope ?? 'Site',
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

  async buildWeeklyMatrixPdf(week: string, year: number, exportedBy?: string): Promise<Buffer> {
    const matrix = await dashboardService.getWeeklyMatrix(week, year);

    const now = new Date();
    const exportDateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const exportTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const locationList = matrix.locations.join('・');

    const locationHeaders = matrix.locations
      .map((loc) => `<th style="min-width:140px;padding:6px 8px;border:1px solid #b0b8c8">${loc}</th>`)
      .join('');

    const bodyRows = matrix.categories
      .map((cat) => {
        const isBad = cat.classification === 'Bad';
        const catCellStyle = isBad
          ? 'background:#fff0f0;border-left:3px solid #C00000'
          : 'background:#f0fff4;border-left:3px solid #70AD47';
        const cellStyle = 'padding:5px 7px;border:1px solid #d0d7e2;vertical-align:top;font-size:11px';
        const catCell = `<td style="${cellStyle};${catCellStyle};font-weight:600;white-space:nowrap;min-width:180px">
          <span style="font-size:10px;color:#666">${cat.mainGroup}</span><br/>${cat.category}
        </td>`;
        const locationCells = matrix.locations
          .map((loc) => {
            const key = `${loc}|||${cat.category}`;
            const events = matrix.cells[key] ?? [];
            const items = events
              .map((e) => {
                const borderColor = e.classification === 'Bad' ? '#C00000' : '#70AD47';
                return `<li style="margin-bottom:5px;padding-left:6px;border-left:2px solid ${borderColor};list-style:none">
                  <b>${e.description}</b><br/>
                  <span style="color:#666;font-size:10px">${e.severity} / ${e.status}${e.downtimeMinutes ? ` · ${e.downtimeMinutes}'` : ''}</span>
                </li>`;
              })
              .join('');
            return `<td style="${cellStyle}">${events.length ? `<ul style="margin:0;padding:0">${items}</ul>` : ''}</td>`;
          })
          .join('');
        return `<tr>${catCell}${locationCells}</tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  /* 帳票フォント — Noto Sans CJK JP (Alpine apk: font-noto font-noto-cjk) */
  * {
    box-sizing: border-box;
    font-family: 'Noto Sans CJK JP', 'Noto Sans JP', 'NotoSansCJK-Regular', 'Noto Sans', Arial, sans-serif;
  }
  html, body { margin: 0; padding: 0; font-size: 12px; color: #1a1a2e; }

  /* ─── 帳票ヘッダー ─────────────────────────────────────── */
  .report-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 12px 16px 10px; border-bottom: 2px solid #1e3a5f; margin-bottom: 12px;
  }
  .report-title h1 {
    margin: 0; font-size: 18px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.05em;
  }
  .report-title h2 {
    margin: 2px 0 0; font-size: 12px; font-weight: 400; color: #4a5568;
  }
  .report-meta { border-collapse: collapse; font-size: 11px; }
  .report-meta td { padding: 2px 10px; border: 1px solid #c8d4e3; }
  .report-meta td:first-child { background: #eef2f8; font-weight: 600; white-space: nowrap; }

  /* ─── 本表 ────────────────────────────────────────────── */
  table.matrix { border-collapse: collapse; width: 100%; table-layout: fixed; }
  table.matrix th {
    background: #1e3a5f; color: #fff; font-size: 11px; font-weight: 600;
    padding: 6px 8px; border: 1px solid #b0b8c8; text-align: center;
  }

  /* ─── 帳票フッター (位置固定) ─────────────────────────── */
  .report-footer {
    position: fixed; bottom: 0; left: 0; right: 0;
    padding: 4px 16px; font-size: 10px; color: #6b7280;
    border-top: 1px solid #d0d7e2; background: #f8fafc;
    display: flex; justify-content: space-between;
  }
  @media print {
    .report-footer { position: fixed; bottom: 0; }
  }
</style>
</head>
<body>

<!-- 帳票ヘッダー -->
<div class="report-header">
  <div class="report-title">
    <h1>週次運用報告書</h1>
    <h2>Báo Cáo Vận Hành Tuần</h2>
  </div>
  <table class="report-meta">
    <tr>
      <td>対象週 / Tuần báo cáo</td>
      <td>${week}/${year} &nbsp;(${matrix.weekRange})</td>
    </tr>
    <tr>
      <td>作成日 / Ngày xuất</td>
      <td>${exportDateStr}</td>
    </tr>
    <tr>
      <td>作成者 / Người xuất</td>
      <td>${exportedBy ?? 'システム / Hệ thống'}</td>
    </tr>
    <tr>
      <td>対象拠点 / Địa điểm</td>
      <td>${locationList}</td>
    </tr>
  </table>
</div>

<!-- 本表 -->
<table class="matrix">
  <thead>
    <tr>
      <th style="width:200px;text-align:left">カテゴリ / Danh mục</th>
      ${locationHeaders}
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table>

<!-- 帳票フッター -->
<div class="report-footer">
  <span>ISD-OMS v1.0 &nbsp;|&nbsp; 出力日時 / Xuất lúc: ${exportDateStr} ${exportTimeStr}</span>
  <span>対象週 ${week}/${year}</span>
</div>

</body>
</html>`;

    return htmlToPdfBuffer(html);
  },
};
