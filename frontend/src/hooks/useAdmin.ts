import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  ApiSuccess,
  CategoryMaster,
  CreateUserDto,
  ImportExecuteData,
  ImportPreviewData,
  LocationMaster,
  SystemComponentMaster,
  UpdateUserDto,
  UserDto,
} from '@/types';

// ─── Categories ────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<CategoryMaster[]>({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<CategoryMaster[]>>('/categories', { params: { all: 'true' } });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { mainGroup: string; category: string; sortOrder?: number }) =>
      api.post<ApiSuccess<CategoryMaster>>('/categories', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; mainGroup?: string; category?: string; isActive?: boolean; sortOrder?: number }) =>
      api.put<ApiSuccess<CategoryMaster>>(`/categories/${id}`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ─── Locations ────────────────────────────────────────────────────────────────

export function useLocations() {
  return useQuery<LocationMaster[]>({
    queryKey: ['locations', 'all'],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<LocationMaster[]>>('/locations', { params: { all: 'true' } });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; fullName: string; sortOrder?: number }) =>
      api.post<ApiSuccess<LocationMaster>>('/locations', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; fullName?: string; isActive?: boolean; sortOrder?: number }) =>
      api.put<ApiSuccess<LocationMaster>>(`/locations/${id}`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

// ─── System Components ────────────────────────────────────────────────────────

export function useSystemComponents(all = false) {
  return useQuery<SystemComponentMaster[]>({
    queryKey: ['system-components', all ? 'all' : 'active'],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<SystemComponentMaster[]>>('/system-components', {
        params: all ? { all: 'true' } : {},
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateSystemComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; sortOrder?: number }) =>
      api.post<ApiSuccess<SystemComponentMaster>>('/system-components', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-components'] }),
  });
}

export function useUpdateSystemComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; isActive?: boolean; sortOrder?: number }) =>
      api.put<ApiSuccess<SystemComponentMaster>>(`/system-components/${id}`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-components'] }),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery<UserDto[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<UserDto[]>>('/users');
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) =>
      api.post<ApiSuccess<UserDto>>('/users', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateUserDto) =>
      api.put<ApiSuccess<UserDto>>(`/users/${id}`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.put(`/users/${id}/password`, { newPassword }),
  });
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function useImportPreview() {
  return useMutation({
    mutationFn: (file: File) => {
      return api
        .post<ApiSuccess<ImportPreviewData>>('/import/excel?preview=true', file, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        })
        .then((r) => r.data.data);
    },
  });
}

export function useImportExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, duplicateAction }: { file: File; duplicateAction: 'skip' | 'replace' }) => {
      return api
        .post<ApiSuccess<ImportExecuteData>>(`/import/excel?duplicateAction=${duplicateAction}`, file, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
