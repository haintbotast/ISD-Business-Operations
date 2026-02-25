import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useLocations, useCreateLocation, useUpdateLocation } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LocationMaster } from '@/types';

const createSchema = z.object({
  code: z.string().min(1).max(20),
  fullName: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
const updateSchema = z.object({
  fullName: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: LocationMaster;
}

function LocationDialog({ open, onClose, initial }: LocationDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const isEdit = !!initial;

  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm | UpdateForm>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: {
      ...(isEdit ? {} : { code: '' }),
      fullName: initial?.fullName ?? '',
      sortOrder: initial?.sortOrder ?? 0,
    } as CreateForm,
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && initial) {
        const d = data as UpdateForm;
        await updateMutation.mutateAsync({ id: initial.id, ...d });
        toast.success(t('admin.location.updateSuccess'));
      } else {
        const d = data as CreateForm;
        await createMutation.mutateAsync(d);
        toast.success(t('admin.location.createSuccess'));
      }
      onClose();
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e.message ?? t('common.error'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.location.editTitle') : t('admin.location.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-1">
              <Label>{t('admin.location.code')}</Label>
              <Input {...register('code')} placeholder="KDAMB" className="uppercase" />
              {(errors as { code?: { message?: string } }).code && (
                <p className="text-xs text-destructive">{(errors as { code?: { message?: string } }).code?.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1">
            <Label>{t('admin.location.fullName')}</Label>
            <Input {...register('fullName')} placeholder="KDA Miền Bắc" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('admin.location.sortOrder')}</Label>
            <Input type="number" {...register('sortOrder')} min={0} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LocationTable() {
  const { t } = useTranslation();
  const { data: locations, isLoading } = useLocations();
  const updateMutation = useUpdateLocation();
  const [dialog, setDialog] = useState<{ open: boolean; item?: LocationMaster }>({ open: false });

  const toggleActive = async (item: LocationMaster) => {
    try {
      await updateMutation.mutateAsync({ id: item.id, isActive: !item.isActive });
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ open: true })}>
          <Plus className="mr-1 h-4 w-4" />
          {t('admin.location.createTitle')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">{t('admin.location.code')}</TableHead>
              <TableHead>{t('admin.location.fullName')}</TableHead>
              <TableHead className="w-20">{t('admin.location.sortOrder')}</TableHead>
              <TableHead className="w-20">{t('admin.location.isActive')}</TableHead>
              <TableHead className="w-20">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (locations ?? []).map((loc) => (
              <TableRow key={loc.id} className={loc.isActive ? '' : 'opacity-50'}>
                <TableCell className="font-mono font-medium">{loc.code}</TableCell>
                <TableCell className="text-sm">{loc.fullName}</TableCell>
                <TableCell className="text-sm">{loc.sortOrder}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => void toggleActive(loc)}
                  >
                    {loc.isActive ? '✓' : '✗'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDialog({ open: true, item: loc })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LocationDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        initial={dialog.item}
      />
    </div>
  );
}
