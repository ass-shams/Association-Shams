import type { BaseEntity } from '@/types'

export interface Meeting extends BaseEntity {
  title: string
  meeting_date: string
  status: 'scheduled' | 'held' | 'cancelled'
  minutes_url: string | null
  is_published: boolean
}
