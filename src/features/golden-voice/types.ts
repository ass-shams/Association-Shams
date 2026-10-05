import type { BaseEntity } from '@/types'

export interface CompetitionEntry extends BaseEntity {
  user_id: string
  full_name: string
  song_title: string
  video_url: string
  status: 'pending' | 'approved' | 'rejected'
}
