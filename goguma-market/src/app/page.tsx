'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ProductCard from '@/components/ProductCard'
import { supabase, Product, Category } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { fetchCategories(); fetchUnreadCount() }, [])
  useEffect(() => { fetchProducts() }, [selectedCategory])

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    if (!rooms || rooms.length === 0) return
    const roomIds = rooms.map((r: any) => r.id)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('room_id', roomIds)
      .neq('sender_id', user.id)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id')
    if (data) setCategories(data)
  }

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, profiles(nickname, location), categories(name, icon), likes(count)')
      .neq('status', '거래완료')
      .order('created_at', { ascending: false })
      .limit(30)
    if (selectedCategory) query = query.eq('category_id', selectedCategory)
    const { data } = await query
    if (data) setProducts(data as unknown as Product[])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      {/* 타이틀 헤더 */}
      <div style={{
        background: 'white', borderBottom: '1px solid #EBEBEB',
        padding: '12px 16px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="https://cdn.crowdpic.net/detail-thumb/thumb_d_7680BA8248CCF072ECD487231BBB233D.png"
            alt="고구마"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#74261e', fontFamily: "'KerisKeduLine', sans-serif", letterSpacing: '0px' }}>고구마마켓</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => router.push('/search')} style={{ border: 'none', background: 'none', padding: 8, cursor: 'pointer', fontSize: 20 }}>🔍</button>
          <button
            onClick={() => router.push('/notifications')}
            style={{ border: 'none', background: 'none', padding: 8, cursor: 'pointer', fontSize: 20, position: 'relative' }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#FF6B35', color: 'white',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 카테고리 그리드 */}
      <div style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '12px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {[{ id: null, name: '전체', icon: '🏠' }, ...categories].map(cat => {
            const active = selectedCategory === cat.id
            return (
              <button
                key={cat.id ?? 'all'}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '10px 4px', borderRadius: 10,
                  background: active ? '#FFF0EB' : 'transparent',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: active ? '#FF6B35' : '#F4F4F4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  boxShadow: active ? '0 2px 8px rgba(255,107,53,0.35)' : 'none',
                }}>
                  {cat.icon}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: active ? 700 : 400,
                  color: active ? '#FF6B35' : '#555',
                  textAlign: 'center', lineHeight: 1.2,
                }}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 상품 목록 */}
      <div style={{ paddingBottom: 70 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#767676' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🍠</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>등록된 상품이 없어요</p>
            <p style={{ fontSize: 14 }}>첫 번째로 물건을 올려보세요!</p>
          </div>
        ) : (
          products.map(p => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
