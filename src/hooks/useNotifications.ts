import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/portalApi";

export function useNotifications(enabled = true) {
  const queryClient = useQueryClient();
  const { activeOrgId, podeCarregarOperacional } = usePermissions();
  const queryKey = orgQueryKey(activeOrgId, "notifications");

  const query = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(true),
    enabled: enabled && podeCarregarOperacional,
    staleTime: 60_000,
  });

  const readOne = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(queryKey, (prev: Awaited<ReturnType<typeof fetchNotifications>> | undefined) => {
        if (!prev) return { results: [], unreadCount: data.unreadCount };
        return {
          unreadCount: data.unreadCount,
          results: prev.results.filter((item) => item.id !== id),
        };
      });
    },
  });

  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, () => ({
        results: [],
        unreadCount: data.unreadCount,
      }));
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  return {
    notifications: query.data?.results ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    readOne,
    readAll,
    refresh,
  };
}
