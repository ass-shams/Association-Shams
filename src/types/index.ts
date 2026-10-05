export type Role = 'visitor' | 'member' | 'admin'

export interface SessionUser {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: Role
  member_number: string | null
}

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}
