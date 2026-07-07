import { useApiQuery, useApiMutation } from '../hooks.js';

export function useApprovalRequests(params?: { module?: string; status?: string; requested_by?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.module) query.set('module', params.module);
  if (params?.status) query.set('status', params.status);
  if (params?.requested_by) query.set('requested_by', params.requested_by);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const queryString = query.toString();
  return useApiQuery<{ requests: any[]; total: number; page: number; limit: number }>(
    ['approval-requests', JSON.stringify(params || {})],
    `/approval-requests${queryString ? `?${queryString}` : ''}`
  );
}

export function useApprovalRequest(id: string) {
  return useApiQuery<any>(['approval-request', id], `/approval-requests/${id}`);
}

export function useCreateApprovalRequest() {
  return useApiMutation<any>('POST', '/approval-requests', [['approval-requests']]);
}

export function useApproveRequest() {
  return useApiMutation<any>('POST', '/approval-requests', [['approval-requests']]);
}

export function useRejectRequest() {
  return useApiMutation<any>('POST', '/approval-requests', [['approval-requests']]);
}

export function useApprovalWorkflows(params?: { module?: string; is_active?: boolean }) {
  const query = new URLSearchParams();
  if (params?.module) query.set('module', params.module);
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
  const queryString = query.toString();
  return useApiQuery<any[]>(['approval-workflows', JSON.stringify(params || {})], `/approval-workflows${queryString ? `?${queryString}` : ''}`);
}

export function useCreateWorkflow() {
  return useApiMutation<any>('POST', '/approval-workflows', [['approval-workflows']]);
}

export function useUpdateWorkflow() {
  return useApiMutation<any>('PUT', '/approval-workflows', [['approval-workflows']]);
}

export function useDeleteWorkflow() {
  return useApiMutation<any>('DELETE', '/approval-workflows', [['approval-workflows']]);
}