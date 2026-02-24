import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LocationMaster, CategoryMaster } from '@/types';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const CLASSIFICATIONS = ['Good', 'Bad'];

export function EventFilters() {
  const { t } = useTranslation();
  const { eventFilters, setEventFilters, resetEventFilters } = useUIStore();

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

  const mainGroups = [...new Set(categories.map((c) => c.mainGroup))];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Year */}
      <Select
        value={String(eventFilters.year)}
        onValueChange={(v) => setEventFilters({ year: Number(v) })}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Location */}
      <Select
        value={eventFilters.locationCode || '__all__'}
        onValueChange={(v) => setEventFilters({ locationCode: v === '__all__' ? '' : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('event.filters.allLocations')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('event.filters.allLocations')}</SelectItem>
          {locations.map((loc) => (
            <SelectItem key={loc.code} value={loc.code}>
              {loc.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Main group (category) */}
      <Select
        value={eventFilters.mainGroup || '__all__'}
        onValueChange={(v) => setEventFilters({ mainGroup: v === '__all__' ? '' : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('event.filters.allCategories')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('event.filters.allCategories')}</SelectItem>
          {mainGroups.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Classification */}
      <Select
        value={eventFilters.classification || '__all__'}
        onValueChange={(v) => setEventFilters({ classification: v === '__all__' ? '' : v })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('event.filters.allClassifications')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('event.filters.allClassifications')}</SelectItem>
          {CLASSIFICATIONS.map((c) => (
            <SelectItem key={c} value={c}>
              {t(`event.classification.${c}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={eventFilters.status || '__all__'}
        onValueChange={(v) => setEventFilters({ status: v === '__all__' ? '' : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('event.filters.allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('event.filters.allStatuses')}</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`event.status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={t('event.filters.searchPlaceholder')}
          value={eventFilters.search}
          onChange={(e) => setEventFilters({ search: e.target.value })}
        />
      </div>

      {/* Reset */}
      <Button variant="outline" size="icon" onClick={resetEventFilters} title={t('common.reset')}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
