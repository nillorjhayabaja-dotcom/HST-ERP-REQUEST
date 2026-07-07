import { useApiQuery, useApiMutation } from '../hooks.js';

export function useNotifications(params?: { is_read?: boolean; type?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.is_read !== undefined) query.set('is_read', String(params.is_read));
  if (params?.type) query.set('type', params.type);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const queryString = query.toString();
  return useApiQuery<{ notifications: any[]; total: number; page: number; limit: number }>(
    ['notifications', JSON.stringify(params || {})],
    `/notifications${queryString ? `?${queryString}` : ''}`
  );
}

export function useMarkNotificationRead() {
  return useApiMutation<any>('PUT', '/notifications', [['notifications']]);
}

export function useDeleteNotification() {
  return useApiMutation<any>('DELETE', '/notifications', [['notifications']]);
}