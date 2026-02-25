import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/api';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Event, LocationMaster, CategoryMaster, ApiError } from '@/types';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  year: z.number().int().min(2024).max(2030),
  weekCode: z.string().regex(/^W\d{2}$/, 'Format: W01'),
  date: z.string().min(1),
  locationCode: z.string().min(1),
  mainGroup: z.string().min(1),
  category: z.string().min(1),
  systemComponent: z.string().optional(),
  description: z.string().min(5),
  impact: z.string().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  downtimeMinutes: z.coerce.number().int().min(0).optional(),
  classification: z.enum(['Good', 'Bad']),
  impactScope: z.enum(['Individual', 'Team', 'Site', 'MultiSite', 'Enterprise']).default('Site'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
});

type EventFormValues = z.infer<typeof eventSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface EventFormProps {
  eventId?: string;             // undefined → create mode; UUID → edit mode
}

export function EventForm({ eventId }: EventFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = !!eventId;

  // ── Fetch master data ──────────────────────────────────────────────────────

  const { data: locations = [] } = useQuery<LocationMaster[]>({
    queryKey: ['locations'],
    queryFn: () => api.get('/locations').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  const { data: categories = [] } = useQuery<CategoryMaster[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  // ── Load existing event (edit mode) ───────────────────────────────────────

  const { data: existingEvent } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then((r) => r.data.data),
    enabled: isEditMode,
    staleTime: 10_000,
  });

  // ── Form setup ────────────────────────────────────────────────────────────

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      year: currentIsoYear(),
      weekCode: currentWeekCode(),
      date: new Date().toISOString().split('T')[0],
      locationCode: '',
      mainGroup: '',
      category: '',
      classification: 'Bad',
      impactScope: 'Site',
      severity: 'Medium',
      status: 'Open',
    },
  });

  const watchedMainGroup = form.watch('mainGroup');
  const watchedClassification = form.watch('classification');

  // Derive sub-categories from selected main group
  const subCategories = categories
    .filter((c) => c.mainGroup === watchedMainGroup)
    .map((c) => c.category);

  // Auto-set classification from category master when category changes
  const handleCategoryChange = useCallback(
    (category: string) => {
      const cat = categories.find(
        (c) => c.mainGroup === watchedMainGroup && c.category === category,
      );
      if (cat) {
        form.setValue('classification', cat.classification as 'Good' | 'Bad');
      }
      form.setValue('category', category);
    },
    [categories, watchedMainGroup, form],
  );

  // ── Populate form from existing event ─────────────────────────────────────

  useEffect(() => {
    if (existingEvent) {
      form.reset({
        year: existingEvent.year,
        weekCode: existingEvent.weekCode,
        date: existingEvent.date.split('T')[0],
        locationCode: existingEvent.locationCode,
        mainGroup: existingEvent.mainGroup,
        category: existingEvent.category,
        systemComponent: existingEvent.systemComponent ?? '',
        description: existingEvent.description,
        impact: existingEvent.impact ?? '',
        rootCause: existingEvent.rootCause ?? '',
        resolution: existingEvent.resolution ?? '',
        downtimeMinutes: existingEvent.downtimeMinutes ?? undefined,
        classification: existingEvent.classification as 'Good' | 'Bad',
        impactScope: (existingEvent.impactScope ?? 'Site') as EventFormValues['impactScope'],
        severity: existingEvent.severity as EventFormValues['severity'],
        status: existingEvent.status as EventFormValues['status'],
      });
    }
  }, [existingEvent, form]);

  // ── SSE conflict warning ───────────────────────────────────────────────────

  const isConflicted = useQuery({
    queryKey: ['event-modified', eventId],
    queryFn: () => queryClient.getQueryData<boolean>(['event-modified', eventId]) ?? false,
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isConflicted.data) {
      toast.warning(t('event.conflict'));
      // Reload the event
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.setQueryData(['event-modified', eventId], false);
    }
  }, [isConflicted.data, eventId, queryClient, t]);

  // ── Draft auto-save (30s interval) ────────────────────────────────────────

  const draftMutation = useMutation({
    mutationFn: (formData: Partial<EventFormValues>) =>
      api.post('/events/draft', {
        event_id: eventId ?? null,
        form_data: formData,
      }),
    onSuccess: () => {
      toast.info(t('event.draftSaved'), { duration: 1500 });
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty) {
        draftMutation.mutate(form.getValues());
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore draft on create mode open
  const { data: draft } = useQuery({
    queryKey: ['draft', eventId ?? 'new'],
    queryFn: () =>
      api
        .get('/events/draft', { params: { event_id: eventId ?? 'new' } })
        .then((r) => r.data.data)
        .catch(() => null),
    enabled: !isEditMode,   // Only restore draft in create mode
    staleTime: 0,
  });

  useEffect(() => {
    if (draft?.form_data && !isEditMode) {
      form.reset(draft.form_data);
      toast.info(t('event.draftRestored'));
    }
  }, [draft, isEditMode, form, t]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: EventFormValues) => api.post('/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Delete draft after successful submit
      api.delete('/events/draft', { params: { event_id: 'new' } }).catch(() => {});
      toast.success(t('event.createSuccess'));
      navigate('/events');
    },
    onError: (err: ApiError) => {
      toast.error(err?.message ?? t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EventFormValues) =>
      api.put(`/events/${eventId}`, {
        ...data,
        version: existingEvent!.version,  // OCC — required
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      // Delete draft after successful update
      api.delete('/events/draft', { params: { event_id: eventId } }).catch(() => {});
      toast.success(t('event.updateSuccess'));
      navigate('/events');
    },
    onError: (err: ApiError) => {
      if (err?.code === 'EVENT_CONFLICT') {
        toast.warning(t('event.conflict'));
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      } else {
        toast.error(err?.message ?? t('common.error'));
      }
    },
  });

  const onSubmit = (values: EventFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? t('event.editTitle') : t('event.createTitle')}
        </h1>
        {isEditMode && existingEvent && (
          <ClassificationBadge value={watchedClassification} />
        )}
      </div>

      {/* ── Section 1: Time + Location ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('event.fields.date')} & {t('event.fields.location')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Year */}
          <div className="space-y-1">
            <Label>{t('event.fields.year')}</Label>
            <Input
              type="number"
              {...form.register('year', { valueAsNumber: true })}
              className={form.formState.errors.year ? 'border-destructive' : ''}
            />
          </div>

          {/* Week code */}
          <div className="space-y-1">
            <Label>{t('event.fields.weekCode')}</Label>
            <Input
              placeholder="W01"
              {...form.register('weekCode')}
              className={form.formState.errors.weekCode ? 'border-destructive' : ''}
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label>{t('event.fields.date')}</Label>
            <Input
              type="date"
              {...form.register('date')}
              className={form.formState.errors.date ? 'border-destructive' : ''}
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <Label>{t('event.fields.location')}</Label>
            <Select
              value={form.watch('locationCode')}
              onValueChange={(v) => form.setValue('locationCode', v, { shouldValidate: true })}
            >
              <SelectTrigger className={form.formState.errors.locationCode ? 'border-destructive' : ''}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.code} value={loc.code}>
                    {loc.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Category ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('event.fields.category')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Main group */}
          <div className="space-y-1">
            <Label>{t('event.fields.mainGroup')}</Label>
            <Select
              value={form.watch('mainGroup')}
              onValueChange={(v) => {
                form.setValue('mainGroup', v, { shouldValidate: true });
                form.setValue('category', '');   // Reset sub-category on group change
              }}
            >
              <SelectTrigger className={form.formState.errors.mainGroup ? 'border-destructive' : ''}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(categories.map((c) => c.mainGroup))].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>{t('event.fields.category')}</Label>
            <Select
              value={form.watch('category')}
              onValueChange={handleCategoryChange}
              disabled={!watchedMainGroup}
            >
              <SelectTrigger className={form.formState.errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Classification (auto-set, but editable) */}
          <div className="space-y-1">
            <Label>{t('event.fields.classification')}</Label>
            <Select
              value={form.watch('classification')}
              onValueChange={(v) => form.setValue('classification', v as 'Good' | 'Bad', { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Good">{t('event.classification.Good')}</SelectItem>
                <SelectItem value="Bad">{t('event.classification.Bad')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* System component */}
          <div className="space-y-1 md:col-span-3">
            <Label>{t('event.fields.systemComponent')}</Label>
            <Input
              placeholder="e.g. API Gateway, DB Server 01"
              {...form.register('systemComponent')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('event.fields.description')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>
              {t('event.fields.description')}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Textarea
              rows={3}
              {...form.register('description')}
              className={form.formState.errors.description ? 'border-destructive' : ''}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('event.fields.impact')}</Label>
              <Textarea rows={2} {...form.register('impact')} />
            </div>
            <div className="space-y-1">
              <Label>{t('event.fields.rootCause')}</Label>
              <Textarea rows={2} {...form.register('rootCause')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('event.fields.resolution')}</Label>
            <Textarea rows={2} {...form.register('resolution')} />
          </div>

          <div className="w-40 space-y-1">
            <Label>{t('event.fields.downtimeMinutes')}</Label>
            <Input
              type="number"
              min={0}
              {...form.register('downtimeMinutes', { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Severity + Status ── */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="space-y-1">
            <Label>{t('event.fields.severity')}</Label>
            <Select
              value={form.watch('severity')}
              onValueChange={(v) => form.setValue('severity', v as EventFormValues['severity'], { shouldValidate: true })}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Critical', 'High', 'Medium', 'Low'] as const).map((s) => (
                  <SelectItem key={s} value={s}>{t(`event.severity.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('event.fields.impactScope')}</Label>
            <Select
              value={form.watch('impactScope')}
              onValueChange={(v) => form.setValue('impactScope', v as EventFormValues['impactScope'], { shouldValidate: true })}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Individual', 'Team', 'Site', 'MultiSite', 'Enterprise'] as const).map((s) => (
                  <SelectItem key={s} value={s}>{t(`event.impactScope.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('event.fields.status')}</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(v) => form.setValue('status', v as EventFormValues['status'], { shouldValidate: true })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map((s) => (
                  <SelectItem key={s} value={s}>{t(`event.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Footer actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate('/events')}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="mr-1 h-4 w-4" />
          {isPending ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
