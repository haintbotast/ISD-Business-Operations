import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/types';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: () =>
      api.get('/auth/me').then((r) => r.data.data as User).catch(() => null),
    staleTime: 5 * 60_000,   // 5 minutes
    retry: 0,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      api.post('/auth/login', credentials).then((r) => r.data.data as User),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    logout: logoutMutation,
  };
}
