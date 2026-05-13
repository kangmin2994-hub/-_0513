'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ProductCard from '@/components/ProductCard'
import { supabase, Product, Category } from '@/lib/supabase'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchProducts() }, [selectedCategory])

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
          <span style={{ fontSize: 26 }}>🍠</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#FF6B35', letterSpacing: '-0.5px' }}>고구마마켓</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ border: 'none', background: 'none', padding: 8, cursor: 'pointer', fontSize: 20 }}>🔍</button>
          <button style={{ border: 'none', background: 'none', padding: 8, cursor: 'pointer', fontSize: 20 }}>🔔</button>
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
                  border: 'none', background: 'none', cursor: 'pointer',
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
