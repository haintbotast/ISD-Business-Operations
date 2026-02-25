import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useUsers, useCreateUser, useUpdateUser, useResetPassword } from '@/hooks/useAdmin';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserDto } from '@/types';

const createSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
});
const updateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional(),
});
const passwordSchema = z.object({
  newPassword: z.string().min(8),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type DialogMode = 'create' | 'edit' | 'password' | null;

function roleBadge(role: string) {
  const map: Record<string, string> = {
    Admin: 'bg-red-100 text-red-800',
    Editor: 'bg-blue-100 text-blue-800',
    Viewer: 'bg-gray-100 text-gray-700',
  };
  return `rounded-full px-2 py-0.5 text-xs font-medium ${map[role] ?? map.Viewer}`;
}

interface UserFormDialogProps {
  open: boolean;
  mode: DialogMode;
  user?: UserDto;
  onClose: () => void;
}

function UserFormDialog({ open, mode, user, onClose }: UserFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const resetMutation = useResetPassword();

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', password: '', displayName: '', role: 'Viewer' },
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { displayName: user?.displayName ?? '', role: user?.role ?? 'Viewer' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '' },
  });

  const onCreateSubmit = createForm.handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success(t('admin.user.createSuccess'));
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? t('common.error'));
    }
  });

  const onUpdateSubmit = updateForm.handleSubmit(async (data) => {
    if (!user) return;
    try {
      await updateMutation.mutateAsync({ id: user.id, ...data });
      toast.success(t('admin.user.updateSuccess'));
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? t('common.error'));
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (data) => {
    if (!user) return;
    try {
      await resetMutation.mutateAsync({ id: user.id, newPassword: data.newPassword });
      toast.success(t('admin.user.resetPasswordSuccess'));
      onClose();
    } catch (err) {
      toast.error((err as { message?: string }).message ?? t('common.error'));
    }
  });

  const roleField = (form: typeof createForm | typeof updateForm, name: 'role') => {
    const val = form.watch(name) as string;
    return (
      <div className="space-y-1">
        <Label>{t('admin.user.role')}</Label>
        <Select value={val} onValueChange={(v) => form.setValue(name, v as 'Admin' | 'Editor' | 'Viewer')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">{t('admin.roles.Admin')}</SelectItem>
            <SelectItem value="Editor">{t('admin.roles.Editor')}</SelectItem>
            <SelectItem value="Viewer">{t('admin.roles.Viewer')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && t('admin.user.createTitle')}
            {mode === 'edit' && t('admin.user.editTitle')}
            {mode === 'password' && t('admin.user.resetPasswordTitle')}
          </DialogTitle>
        </DialogHeader>

        {mode === 'create' && (
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('admin.user.username')}</Label>
              <Input {...createForm.register('username')} placeholder="john_doe" />
              {createForm.formState.errors.username && (
                <p className="text-xs text-destructive">{createForm.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{t('admin.user.displayName')}</Label>
              <Input {...createForm.register('displayName')} placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.user.password')}</Label>
              <Input type="password" {...createForm.register('password')} />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            {roleField(createForm, 'role')}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending}>{t('common.save')}</Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'edit' && (
          <form onSubmit={onUpdateSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('admin.user.displayName')}</Label>
              <Input {...updateForm.register('displayName')} />
            </div>
            {roleField(updateForm, 'role')}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{t('common.save')}</Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'password' && (
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('admin.user.newPassword')}</Label>
              <Input type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={resetMutation.isPending}>{t('common.save')}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UserTable() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useUsers();
  const updateMutation = useUpdateUser();
  const [dialog, setDialog] = useState<{ mode: DialogMode; user?: UserDto }>({ mode: null });

  const toggleActive = async (user: UserDto) => {
    try {
      await updateMutation.mutateAsync({ id: user.id, isActive: !user.isActive });
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ mode: 'create' })}>
          <Plus className="mr-1 h-4 w-4" />
          {t('admin.user.createTitle')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.user.username')}</TableHead>
              <TableHead>{t('admin.user.displayName')}</TableHead>
              <TableHead className="w-28">{t('admin.user.role')}</TableHead>
              <TableHead className="w-20">{t('admin.user.isActive')}</TableHead>
              <TableHead className="w-24">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (users ?? []).map((user) => (
              <TableRow key={user.id} className={user.isActive ? '' : 'opacity-50'}>
                <TableCell className="font-mono text-sm">{user.username}</TableCell>
                <TableCell className="text-sm">{user.displayName}</TableCell>
                <TableCell>
                  <span className={roleBadge(user.role)}>{t(`admin.roles.${user.role}`)}</span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => void toggleActive(user)}
                  >
                    {user.isActive ? '✓' : '✗'}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDialog({ mode: 'edit', user })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDialog({ mode: 'password', user })}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={dialog.mode !== null}
        mode={dialog.mode}
        user={dialog.user}
        onClose={() => setDialog({ mode: null })}
      />
    </div>
  );
}
