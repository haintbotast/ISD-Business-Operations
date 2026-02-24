import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, severityColor, statusColor } from '@/lib/utils';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Event, ApiList, ApiError } from '@/types';

const PAGE_SIZE = 20;

export function EventList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { eventFilters } = useUIStore();

  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  // Build query params (omit empty strings)
  const params = {
    page,
    limit: PAGE_SIZE,
    year: eventFilters.year,
    ...(eventFilters.weekCode && { weekCode: eventFilters.weekCode }),
    ...(eventFilters.locationCode && { locationCode: eventFilters.locationCode }),
    ...(eventFilters.classification && { classification: eventFilters.classification }),
    ...(eventFilters.status && { status: eventFilters.status }),
    ...(eventFilters.search && { search: eventFilters.search }),
  };

  const { data, isLoading, error } = useQuery<ApiList<Event>>({
    queryKey: ['events', params],
    queryFn: () => api.get('/events', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(t('event.deleteSuccess'));
      setDeleteTarget(null);
    },
    onError: (err: ApiError) => {
      toast.error(err?.message ?? t('common.error'));
    },
  });

  const isEditor = user?.role === 'Admin' || user?.role === 'Editor';
  const isAdmin = user?.role === 'Admin';

  const events = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / PAGE_SIZE) : 1;

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
        {t('common.error')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create button */}
      {isEditor && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => navigate('/events/new')}>
            <Plus className="mr-1 h-4 w-4" />
            {t('common.create')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t('event.fields.weekCode')}</TableHead>
              <TableHead className="w-24">{t('event.fields.date')}</TableHead>
              <TableHead className="w-28">{t('event.fields.location')}</TableHead>
              <TableHead>{t('event.fields.description')}</TableHead>
              <TableHead className="w-24">{t('event.fields.classification')}</TableHead>
              <TableHead className="w-24">{t('event.fields.severity')}</TableHead>
              <TableHead className="w-28">{t('event.fields.status')}</TableHead>
              {(isEditor || isAdmin) && <TableHead className="w-20">{t('common.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                >
                  <TableCell className="font-mono text-xs">{event.weekCode}</TableCell>
                  <TableCell className="text-sm">{formatDate(event.date)}</TableCell>
                  <TableCell className="text-sm">{event.locationCode}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{event.description}</TableCell>
                  <TableCell>
                    <ClassificationBadge value={event.classification as 'Good' | 'Bad'} />
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColor(event.severity)}`}>
                      {t(`event.severity.${event.severity}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                      {t(`event.status.${event.status}`)}
                    </span>
                  </TableCell>
                  {(isEditor || isAdmin) && (
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {isEditor && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => navigate(`/events/${event.id}/edit`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t('pagination.showing', {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, pagination.total),
              total: pagination.total,
            })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              {t('pagination.page', { page, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('event.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
