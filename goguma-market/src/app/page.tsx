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
      <Header location="우리 동네" showSearch showBell />

      {/* 카테고리 필터 */}
      <div style={{
        background: 'white', borderBottom: '1px solid #EBEBEB',
        overflowX: 'auto', display: 'flex',
        padding: '12px 16px', whiteSpace: 'nowrap',
      }}>
        {[{ id: null, name: '전체', icon: '🏠' }, ...categories].map(cat => (
          <button
            key={cat.id ?? 'all'}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              flexShrink: 0, border: 'none', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, cursor: 'pointer',
              background: selectedCategory === cat.id ? '#FF6B35' : '#F4F4F4',
              color: selectedCategory === cat.id ? 'white' : '#1A1A1A',
              fontWeight: selectedCategory === cat.id ? 700 : 400,
              marginRight: 8,
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
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
