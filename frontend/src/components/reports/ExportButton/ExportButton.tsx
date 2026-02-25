import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';

type ExportTarget = 'events' | 'weekly-matrix';
type ExportFormat = 'xlsx' | 'pdf';

interface ExportButtonProps {
  target: ExportTarget;
  params?: Record<string, string | number | undefined>;
  disabled?: boolean;
}

function mimeType(format: ExportFormat): string {
  return format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

function filename(target: ExportTarget, format: ExportFormat, params: Record<string, string | number | undefined>): string {
  if (target === 'weekly-matrix') {
    return `weekly-matrix-${params.week ?? ''}-${params.year ?? ''}.${format}`;
  }
  return `events-${params.year ?? 'all'}.${format}`;
}

export function ExportButton({ target, params = {}, disabled }: ExportButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  const doExport = async (format: ExportFormat) => {
    setLoading(format);
    try {
      const endpoint = `/export/${target}`;
      const response = await api.get(endpoint, {
        params: { ...params, format },
        responseType: 'blob',
      });
      const blob = new Blob([response.data as BlobPart], { type: mimeType(format) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename(target, format, params);
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isLoading}>
          <Download className="mr-1 h-4 w-4" />
          {isLoading ? t('reports.exporting') : t('common.actions')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void doExport('xlsx')}>
          <Table2 className="mr-2 h-4 w-4" />
          {t('reports.exportExcel')}
        </DropdownMenuItem>
        {target === 'weekly-matrix' && (
          <DropdownMenuItem onClick={() => void doExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            {t('reports.exportPdf')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
