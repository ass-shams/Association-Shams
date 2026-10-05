import type { BaseEntity } from '@/types'

export interface MembershipType extends BaseEntity {
  name: string
  description: string
  price: number
  duration_months: number
  active: boolean
}

export interface Member extends BaseEntity {
  user_id: string
  membership_type_id: string
  member_number: string
  started_at: string
  expires_at: string
  status: 'active' | 'expired' | 'suspended'
}
