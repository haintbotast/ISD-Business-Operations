import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/hooks/useAdmin';
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
import type { CategoryMaster } from '@/types';

const schema = z.object({
  mainGroup: z.string().min(1),
  category: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
type FormValues = z.infer<typeof schema>;

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: CategoryMaster;
}

function CategoryDialog({ open, onClose, initial }: CategoryDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isEdit = !!initial;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mainGroup: initial?.mainGroup ?? '',
      category: initial?.category ?? '',
      sortOrder: initial?.sortOrder ?? 0,
    },
  });

  const onSubmit = handleSubmit(async (data: FormValues) => {
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          mainGroup: data.mainGroup,
          category: data.category,
          sortOrder: data.sortOrder,
        });
        toast.success(t('admin.category.updateSuccess'));
      } else {
        await createMutation.mutateAsync(data);
        toast.success(t('admin.category.createSuccess'));
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
            {isEdit ? t('admin.category.editTitle') : t('admin.category.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.category.mainGroup')}</Label>
            <Input {...register('mainGroup')} placeholder="Hạ tầng" />
            {errors.mainGroup && <p className="text-xs text-destructive">{errors.mainGroup.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('admin.category.category')}</Label>
            <Input {...register('category')} placeholder="Máy chủ / Server" />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            {isEdit && (
              <p className="text-xs text-muted-foreground">{t('admin.category.renameWarning')}</p>
            )}
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

export function CategoryTable() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();
  const updateMutation = useUpdateCategory();
  const [dialog, setDialog] = useState<{ open: boolean; item?: CategoryMaster }>({ open: false });

  const toggleActive = async (item: CategoryMaster) => {
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
          {t('admin.category.createTitle')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.category.mainGroup')}</TableHead>
              <TableHead>{t('admin.category.category')}</TableHead>
              <TableHead className="w-20">{t('admin.category.isActive')}</TableHead>
              <TableHead className="w-20">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (categories ?? []).map((cat) => (
              <TableRow key={cat.id} className={cat.isActive ? '' : 'opacity-50'}>
                <TableCell className="text-sm">{cat.mainGroup}</TableCell>
                <TableCell className="text-sm">{cat.category}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => void toggleActive(cat)}
                  >
                    {cat.isActive ? '✓' : '✗'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDialog({ open: true, item: cat })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        initial={dialog.item}
      />
    </div>
  );
}
