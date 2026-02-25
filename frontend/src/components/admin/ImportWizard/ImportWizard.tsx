import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useImportPreview, useImportExecute } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ImportPreviewData } from '@/types';

type Step = 1 | 2 | 3;
type DupAction = 'skip' | 'replace';

export function ImportWizard() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [dupAction, setDupAction] = useState<DupAction>('skip');
  const [result, setResult] = useState<{
    imported: number;
    replaced: number;
    errors: number;
    skipped: number;
  } | null>(null);

  const previewMutation = useImportPreview();
  const executeMutation = useImportExecute();

  const handleFile = async (f: File) => {
    setFile(f);
    try {
      const data = await previewMutation.mutateAsync(f);
      setPreview(data);
      setStep(2);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? t('common.error'));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) void handleFile(f);
    else toast.error(t('import.selectFile'));
  };

  const handleExecute = async () => {
    if (!file) return;
    try {
      const data = await executeMutation.mutateAsync({ file, duplicateAction: dupAction });
      setResult(data);
      setStep(3);
      toast.success(
        t('import.importSuccess', {
          imported: data.imported,
          replaced: data.replaced,
          errors: data.errors,
        }),
      );
    } catch (err) {
      toast.error((err as { message?: string }).message ?? t('common.error'));
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {s}
            </span>
            <span className={step >= s ? 'font-medium' : 'text-muted-foreground'}>
              {t(`import.step${s}`)}
            </span>
            {s < 3 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">{t('import.dragDrop')}</p>
          <p className="mb-4 text-xs text-muted-foreground">{t('import.selectFile')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={previewMutation.isPending}
          >
            {previewMutation.isPending ? t('import.uploading') : t('common.actions')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="rounded bg-muted px-2 py-1">
              {t('import.previewTitle', { total: preview.total })}
            </span>
            <span className="rounded bg-green-100 px-2 py-1 text-green-800">
              {t('import.validRows', { count: preview.valid })}
            </span>
            {preview.duplicates > 0 && (
              <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-800">
                {t('import.duplicateRows', { count: preview.duplicates })}
              </span>
            )}
            {preview.parseErrors > 0 && (
              <span className="rounded bg-red-100 px-2 py-1 text-red-800">
                {t('import.errorRows', { count: preview.parseErrors })}
              </span>
            )}
          </div>

          {/* Duplicate action */}
          {preview.duplicates > 0 && (
            <div className="flex items-center gap-4 rounded-md border p-3">
              <span className="text-sm font-medium">{t('import.duplicateAction')}:</span>
              {(['skip', 'replace'] as DupAction[]).map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="dupAction"
                    value={opt}
                    checked={dupAction === opt}
                    onChange={() => setDupAction(opt)}
                  />
                  {t(`import.${opt}`)}
                </label>
              ))}
            </div>
          )}

          {/* Preview table */}
          <div className="max-h-80 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t('import.columns.row')}</TableHead>
                  <TableHead className="w-16">{t('import.columns.weekCode')}</TableHead>
                  <TableHead className="w-24">{t('import.columns.date')}</TableHead>
                  <TableHead className="w-24">{t('import.columns.location')}</TableHead>
                  <TableHead>{t('import.columns.description')}</TableHead>
                  <TableHead className="w-20">{t('import.columns.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.previewRows.map((row) => (
                  <TableRow
                    key={row.rowNumber}
                    className={cn(
                      row.parseError && 'bg-red-50',
                      row.isDuplicate && !row.parseError && 'bg-yellow-50',
                    )}
                  >
                    <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{row.weekCode}</TableCell>
                    <TableCell className="text-xs">{row.date.slice(0, 10)}</TableCell>
                    <TableCell className="text-xs">{row.locationCode}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {row.parseError ? (
                        <span className="text-destructive">{row.parseError}</span>
                      ) : (
                        row.description
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.parseError ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : row.isDuplicate ? (
                        <span className="text-xs text-yellow-700">dup</span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>{t('common.back')}</Button>
            <Button
              onClick={() => void handleExecute()}
              disabled={executeMutation.isPending || preview.valid === 0}
            >
              {executeMutation.isPending ? t('import.importing') : t('import.executeImport')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-lg border p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h3 className="text-lg font-semibold">{t('import.step3')}</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded bg-green-100 px-3 py-1 text-green-800">
                {t('import.validRows', { count: result.imported })} nhập
              </span>
              {result.replaced > 0 && (
                <span className="rounded bg-blue-100 px-3 py-1 text-blue-800">
                  {result.replaced} ghi đè
                </span>
              )}
              {result.skipped > 0 && (
                <span className="rounded bg-gray-100 px-3 py-1 text-gray-700">
                  {result.skipped} bỏ qua
                </span>
              )}
              {result.errors > 0 && (
                <span className="rounded bg-red-100 px-3 py-1 text-red-800">
                  {result.errors} lỗi
                </span>
              )}
            </div>
          </div>
          <Button onClick={reset}>{t('common.back')}</Button>
        </div>
      )}
    </div>
  );
}
