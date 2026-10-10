import { adminFetch, readAdminError } from './adminApi';

export type ContactStatus = 'new' | 'in_progress' | 'resolved';

export interface ContactRequest {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly subject: string | null;
  readonly message: string;
  readonly status: ContactStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ContactRequestsQuery {
  readonly status?: ContactStatus | 'all';
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ContactRequestsResult {
  readonly data: ContactRequest[];
  readonly count: number;
  readonly page: number;
  readonly pageSize: number;
}

const ENDPOINT = '/api/admin/contact-requests';
const LOAD_ERROR = 'تعذّر تحميل طلبات الاتصال. المرجو المحاولة مرة أخرى.';
const UPDATE_ERROR = 'تعذّر تحديث حالة الطلب. المرجو المحاولة مرة أخرى.';

/** Newest-first, paginated list with optional status filter and search. */
export async function listContactRequests(
  query: ContactRequestsQuery = {},
): Promise<ContactRequestsResult> {
  const params = new URLSearchParams();
  if (query.status && query.status !== 'all') {
    params.set('status', query.status);
  }
  if (query.search && query.search.trim()) {
    params.set('q', query.search.trim());
  }
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 20));

  const response = await adminFetch(`${ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw await readAdminError(response, LOAD_ERROR);
  }

  return (await response.json()) as ContactRequestsResult;
}

/** Total number of contact requests (for the dashboard metric). */
export async function countContactRequests(): Promise<number> {
  const result = await listContactRequests({ pageSize: 1 });
  return result.count;
}

/** Update a request's workflow status; returns the updated record. */
export async function updateContactRequestStatus(
  id: string,
  status: ContactStatus,
): Promise<ContactRequest> {
  const response = await adminFetch(ENDPOINT, {
    method: 'PATCH',
    body: JSON.stringify({ id, status }),
  });

  if (!response.ok) {
    throw await readAdminError(response, UPDATE_ERROR);
  }

  const payload = (await response.json()) as { request: ContactRequest };
  return payload.request;
}
