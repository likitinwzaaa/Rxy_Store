import type { Banner, Category, Product } from '../types'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

export const categories: Category[] = [
  { id: 'item', name: 'ไอเทม', icon: 'box' },
  { id: 'vehicle', name: 'รถ', icon: 'car' },
  { id: 'vip', name: 'VIP', icon: 'crown' },
  { id: 'points', name: 'พอยท์', icon: 'coin' },
]

export const banners: Banner[] = [
  { id: 'b1', label: 'โปรเปิดเซิร์ฟ รถลด 30%', productId: 'sultan_rs' },
  { id: 'b2', label: 'VIP Gold ได้พอยท์เพิ่ม 2 เท่า', productId: 'vip_gold' },
  { id: 'b3', label: 'ชุดฮาโลวีน มาแล้ว 31 ต.ค.' },
]

export const products: Product[] = [
  {
    id: 'noroi_skin',
    name: 'บัตรสกิน Noroi ทุกชิ้น',
    category: 'item',
    price: 299,
    featured: true,
    rewards: [{ kind: 'item', label: 'บัตรสกิน Noroi', amount: 9 }],
  },
  {
    id: 'sultan_rs',
    name: 'Sultan RS Classic',
    category: 'vehicle',
    price: 455,
    oldPrice: 650,
    featured: true,
    description: 'รถสายแข่งท่อแต่งมาให้แล้ว ซื้อแล้วได้ชุดซ่อมกับเงินติดตัวไปด้วย',
    limit: 1,
    bought: 0,
    saleEndsAt: now + 2 * 60 * 60 * 1000,
    rewards: [
      { kind: 'vehicle', label: 'Sultan RS Classic', amount: 1 },
      { kind: 'item', label: 'ชุดซ่อมรถ', amount: 2 },
      { kind: 'money', label: 'เงินในเกม', amount: 5000 },
    ],
  },
  {
    id: 'vip_gold',
    name: 'VIP Gold 30 วัน',
    category: 'vip',
    price: 199,
    featured: true,
    rewards: [{ kind: 'rank', label: 'VIP Gold', amount: 1, days: 30 }],
  },
  {
    id: 'points_1000',
    name: '1,000 พอยท์',
    category: 'points',
    price: 100,
    featured: true,
    rewards: [{ kind: 'points', label: 'พอยท์', amount: 1000 }],
  },
  {
    id: 'starter_pack',
    name: 'ชุดเริ่มต้น ข้าวกล่อง น้ำ ผ้าพันแผล',
    category: 'item',
    price: 59,
    featured: true,
    stock: 12,
    limit: 3,
    bought: 0,
    rewards: [
      { kind: 'item', label: 'ข้าวกล่อง', amount: 5 },
      { kind: 'item', label: 'น้ำเปล่า', amount: 5 },
      { kind: 'item', label: 'ผ้าพันแผล', amount: 3 },
    ],
  },
  {
    id: 'birthday_box',
    name: 'กล่องของขวัญวันเกิดเซิร์ฟ',
    category: 'item',
    price: 89,
    featured: true,
    stock: 0,
    rewards: [{ kind: 'item', label: 'กล่องของขวัญ', amount: 1 }],
  },
  {
    id: 'halloween_set',
    name: 'ชุดฮาโลวีน',
    category: 'item',
    price: 129,
    featured: true,
    startsAt: now + 9 * day,
    rewards: [{ kind: 'item', label: 'ชุดฮาโลวีน', amount: 1, days: 14 }],
  },
  {
    id: 'custom_plate',
    name: 'ป้ายทะเบียนสั่งทำ',
    category: 'item',
    price: 149,
    featured: true,
    limit: 1,
    bought: 1,
    rewards: [{ kind: 'item', label: 'ป้ายทะเบียน', amount: 1 }],
  },
  {
    id: 'macan_gts',
    name: 'Porsche Macan GTS',
    category: 'vehicle',
    price: 890,
    rewards: [{ kind: 'vehicle', label: 'Porsche Macan GTS', amount: 1 }],
  },
  {
    id: 'elegy_rent',
    name: 'Elegy Retro Custom เช่า 7 วัน',
    category: 'vehicle',
    price: 150,
    rewards: [{ kind: 'vehicle', label: 'Elegy Retro Custom', amount: 1, days: 7 }],
  },
  {
    id: 'tractor',
    name: 'Tractor Mach II',
    category: 'vehicle',
    price: 120,
    rewards: [{ kind: 'vehicle', label: 'Tractor Mach II', amount: 1 }],
  },
  {
    id: 'machete_skin',
    name: 'บัตรสกิน Machete Noroi',
    category: 'item',
    price: 59,
    rewards: [{ kind: 'item', label: 'บัตรสกิน Machete', amount: 1 }],
  },
  {
    id: 'macaron',
    name: 'MACARON กล่อง 10 ชิ้น',
    category: 'item',
    price: 25,
    rewards: [{ kind: 'item', label: 'มาการอง', amount: 10 }],
  },
  {
    id: 'vip_silver',
    name: 'VIP Silver 7 วัน',
    category: 'vip',
    price: 59,
    rewards: [{ kind: 'rank', label: 'VIP Silver', amount: 1, days: 7 }],
  },
  {
    id: 'points_5000',
    name: '5,000 พอยท์',
    category: 'points',
    price: 450,
    oldPrice: 500,
    rewards: [{ kind: 'points', label: 'พอยท์', amount: 5000 }],
  },
]

export const inboxCount = 3
