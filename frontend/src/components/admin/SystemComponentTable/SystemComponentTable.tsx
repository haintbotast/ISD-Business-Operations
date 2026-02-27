import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useSystemComponents, useCreateSystemComponent, useUpdateSystemComponent } from '@/hooks/useAdmin';
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
import type { SystemComponentMaster } from '@/types';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

interface ComponentDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: SystemComponentMaster;
}

function ComponentDialog({ open, onClose, initial }: ComponentDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateSystemComponent();
  const updateMutation = useUpdateSystemComponent();
  const isEdit = !!initial;

  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm | UpdateForm>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: {
      name: initial?.name ?? '',
      sortOrder: initial?.sortOrder ?? 0,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, ...data });
        toast.success(t('admin.systemComponent.updateSuccess'));
      } else {
        await createMutation.mutateAsync(data as CreateForm);
        toast.success(t('admin.systemComponent.createSuccess'));
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
            {isEdit ? t('admin.systemComponent.editTitle') : t('admin.systemComponent.createTitle')}
          </DialogTitle>
        </DialogHeader>
        {isEdit && (
          <p className="text-xs text-muted-foreground -mt-2">
            {t('admin.systemComponent.renameWarning')}
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.systemComponent.name')}</Label>
            <Input {...register('name')} placeholder="e.g. Telehub T3 Platform" />
            {(errors as { name?: { message?: string } }).name && (
              <p className="text-xs text-destructive">
                {(errors as { name?: { message?: string } }).name?.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t('admin.systemComponent.sortOrder')}</Label>
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

export function SystemComponentTable() {
  const { t } = useTranslation();
  const { data: items, isLoading } = useSystemComponents(true);
  const updateMutation = useUpdateSystemComponent();
  const [dialog, setDialog] = useState<{ open: boolean; item?: SystemComponentMaster }>({ open: false });

  const toggleActive = async (item: SystemComponentMaster) => {
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
          {t('admin.systemComponent.createTitle')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.systemComponent.name')}</TableHead>
              <TableHead className="w-20">{t('admin.systemComponent.sortOrder')}</TableHead>
              <TableHead className="w-20">{t('admin.systemComponent.isActive')}</TableHead>
              <TableHead className="w-20">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (items ?? []).map((item) => (
              <TableRow key={item.id} className={item.isActive ? '' : 'opacity-50'}>
                <TableCell className="text-sm font-medium">{item.name}</TableCell>
                <TableCell className="text-sm">{item.sortOrder}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => void toggleActive(item)}
                  >
                    {item.isActive ? '✓' : '✗'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDialog({ open: true, item })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ComponentDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        initial={dialog.item}
      />
    </div>
  );
}
