import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: number
  seller_id: string
  title: string
  category_id: number
  price: number
  description: string
  condition: '미사용' | '거의새것' | '사용감있음'
  trade_type: '직거래' | '택배' | '모두가능'
  allow_price_offer: boolean
  status: '판매중' | '예약중' | '거래완료'
  location: string
  views: number
  image_urls: string[]
  created_at: string
  profiles?: Profile
  categories?: Category
  likes?: { count: number }[]
}

export type Profile = {
  id: string
  nickname: string
  avatar_url: string | null
  location: string
  manner_temperature: number
  created_at: string
}

export type Category = {
  id: number
  name: string
  icon: string
}

export type ChatRoom = {
  id: number
  product_id: number
  buyer_id: string
  seller_id: string
  created_at: string
  products?: Product
  buyer?: Profile
  seller?: Profile
  messages?: Message[]
}

export type Message = {
  id: number
  room_id: number
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export const formatPrice = (price: number) =>
  price === 0 ? '무료나눔' : `${price.toLocaleString('ko-KR')}원`

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR')
}
