import type { BaseEntity } from '@/types'

export interface DocumentCategory extends BaseEntity {
  name: string
  slug: string
}

export interface Document extends BaseEntity {
  title: string
  category_id: string | null
  file_url: string
  is_public: boolean
  published_at: string | null
}
