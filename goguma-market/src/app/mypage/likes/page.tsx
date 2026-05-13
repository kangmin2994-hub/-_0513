'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import BottomNav from '@/components/BottomNav'
import { supabase, Product } from '@/lib/supabase'

export default function LikesPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data } = await supabase
      .from('likes')
      .select('product_id, products(*, profiles(nickname, location), categories(name, icon))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      const prods = data.map((item: any) => item.products).filter(Boolean)
      setProducts(prods as unknown as Product[])
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'white', borderBottom: '1px solid #EBEBEB',
        display: 'flex', alignItems: 'center', padding: '0 16px', height: 52,
      }}>
        <button onClick={() => router.back()} style={{
          border: 'none', background: 'none', padding: '8px 8px 8px 0',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>관심 목록</h1>
        {!loading && products.length > 0 && (
          <span style={{ marginLeft: 6, fontSize: 15, color: '#FF6B35', fontWeight: 700 }}>
            {products.length}
          </span>
        )}
      </div>

      {/* 목록 */}
      <div style={{ paddingBottom: 70 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#767676' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#FFF0EB', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Heart size={32} color="#FF6B35" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>
              관심 상품이 없어요
            </p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              마음에 드는 상품에 하트를 눌러보세요!
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 28px', borderRadius: 10,
                background: '#FF6B35', color: 'white',
                border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              상품 둘러보기
            </button>
          </div>
        ) : (
          products.map(p => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
