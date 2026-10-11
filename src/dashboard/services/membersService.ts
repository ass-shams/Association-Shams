import { adminFetch, readAdminError } from './adminApi';

export type MemberGender = 'male' | 'female';

/** A membership application as returned by the admin API. */
export interface Member {
  readonly id: string;
  readonly full_name: string;
  readonly phone: string;
  readonly city: string;
  readonly age: number;
  readonly gender: MemberGender;
  readonly interests: string[];
  readonly expectations: string | null;
  readonly created_at: string;
}

export interface MembersQuery {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface MembersResult {
  readonly data: Member[];
  readonly count: number;
  readonly page: number;
  readonly pageSize: number;
}

const ENDPOINT = '/api/admin/members';
const LOAD_ERROR = 'تعذّر تحميل المنخرطين. المرجو المحاولة مرة أخرى.';

/** Newest-first, paginated list with optional search by name, phone or city. */
export async function listMembers(query: MembersQuery = {}): Promise<MembersResult> {
  const params = new URLSearchParams();
  if (query.search && query.search.trim()) {
    params.set('q', query.search.trim());
  }
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 20));

  const response = await adminFetch(`${ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw await readAdminError(response, LOAD_ERROR);
  }

  return (await response.json()) as MembersResult;
}

/** Total number of members (for the dashboard metric). */
export async function countMembers(): Promise<number> {
  const result = await listMembers({ pageSize: 1 });
  return result.count;
}
