import type { BaseEntity } from '@/types'

export interface Product extends BaseEntity {
  name: string
  slug: string
  description: string
  price: number
  image_url: string | null
  active: boolean
}

export interface Order extends BaseEntity {
  user_id: string
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'refunded'
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
}
