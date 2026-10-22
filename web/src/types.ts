export type RewardKind = 'item' | 'vehicle' | 'rank' | 'points' | 'money' | 'command'

export type Reward = {
  kind: RewardKind
  label: string
  amount: number
  days?: number | null
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  oldPrice?: number | null
  image?: string | null
  description?: string
  rewards: Reward[]
  featured?: boolean
  stock?: number | null
  limit?: number | null
  bought?: number
  startsAt?: number | null
  saleEndsAt?: number | null
}

export type Category = {
  id: string
  name: string
  icon: string
}

export type Banner = {
  id: string
  image?: string | null
  label: string
  productId?: string
}

export type CartLine = {
  id: string
  qty: number
}
