import { useApiQuery, useApiMutation } from '../hooks.js';

export function useProfiles(params?: { page?: number; limit?: number; search?: string; department_id?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.department_id) query.set('department_id', params.department_id);
  const queryString = query.toString();
  return useApiQuery<{ profiles: any[]; total: number; page: number; limit: number }>(
    ['profiles', JSON.stringify(params || {})],
    `/profiles${queryString ? `?${queryString}` : ''}`
  );
}

export function useProfile(id: string) {
  return useApiQuery<any>(['profile', id], `/profiles/${id}`);
}

export function useCreateProfile() {
  return useApiMutation<any>('POST', '/profiles', [['profiles']]);
}

export function useUpdateProfile() {
  return useApiMutation<any>('PUT', '/profiles', [['profiles']]);
}

export function useDeleteProfile() {
  return useApiMutation<any>('DELETE', '/profiles', [['profiles']]);
}