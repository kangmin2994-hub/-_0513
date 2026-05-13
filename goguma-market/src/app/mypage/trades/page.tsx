'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase, formatPrice, formatDate } from '@/lib/supabase'

type Tab = 'selling' | 'buying' | 'done'

export default function TradesPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('selling')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { init() }, [])
  useEffect(() => { if (userId) fetchTrades() }, [tab, userId])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth'); return }
    setUserId(data.user.id)
  }

  const fetchTrades = async () => {
    if (!userId) return
    setLoading(true)

    if (tab === 'selling') {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, icon)')
        .eq('seller_id', userId)
        .in('status', ['판매중', '예약중'])
        .order('created_at', { ascending: false })
      setProducts(data || [])
    } else if (tab === 'done') {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, icon)')
        .eq('seller_id', userId)
        .eq('status', '거래완료')
        .order('created_at', { ascending: false })
      setProducts(data || [])
    } else {
      // 구매내역: 내가 buyer인 채팅방의 상품
      const { data } = await supabase
        .from('chat_rooms')
        .select('*, products(*, categories(name, icon))')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
      setProducts((data || []).map((r: any) => r.products).filter(Boolean))
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('products').delete().eq('id', deleteTarget.id)
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  const tabs = [
    { key: 'selling', label: '판매중' },
    { key: 'buying', label: '구매내역' },
    { key: 'done', label: '거래완료' },
  ]

  const statusColor: Record<string, string> = {
    '판매중': '#FF6B35', '예약중': '#856404', '거래완료': '#767676',
  }
  const statusBg: Record<string, string> = {
    '판매중': '#FFF0EB', '예약중': '#FFF3CD', '거래완료': '#F0F0F0',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      <Header title="내 거래" showBack />

      {/* 탭 */}
      <div style={{ background: 'white', borderBottom: '1px solid #EBEBEB', display: 'flex' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#FF6B35' : '#767676',
              borderBottom: tab === t.key ? '2px solid #FF6B35' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div style={{ paddingBottom: 70 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#767676' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🍠</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {tab === 'selling' ? '판매중인 상품이 없어요' : tab === 'buying' ? '구매 내역이 없어요' : '거래완료 내역이 없어요'}
            </p>
            <p style={{ fontSize: 14 }}>
              {tab === 'selling' ? '첫 상품을 등록해보세요!' : '마음에 드는 물건에 채팅해보세요!'}
            </p>
          </div>
        ) : (
          products.map((p, i) => (
            <div key={p.id ?? i}
              style={{ display: 'flex', gap: 14, padding: '16px', background: 'white', borderBottom: '1px solid #EBEBEB' }}>
              {/* 썸네일 */}
              <div
                onClick={() => router.push(`/products/${p.id}`)}
                style={{ width: 80, height: 80, borderRadius: 10, background: '#F0F0F0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, cursor: 'pointer' }}>
                {p.image_urls?.[0]
                  ? <img src={p.image_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : p.categories?.icon || '📦'}
              </div>
              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push(`/products/${p.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 700,
                    background: statusBg[p.status] || '#F0F0F0',
                    color: statusColor[p.status] || '#767676',
                  }}>{p.status}</span>
                  <span style={{ fontSize: 12, color: '#AAAAAA' }}>{formatDate(p.created_at)}</span>
                </div>
                <p style={{ fontSize: 15, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1A1A1A' }}>{formatPrice(p.price)}</p>
                <p style={{ fontSize: 12, color: '#AAAAAA', margin: '4px 0 0' }}>{p.location}</p>
              </div>
              {/* 판매중/예약중 탭에서만 수정/삭제 버튼 표시 */}
              {tab === 'selling' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/products/${p.id}/edit`) }}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: '1.5px solid #EBEBEB',
                      background: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="수정"
                  >
                    <Pencil size={16} color="#FF6B35" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: '1.5px solid #EBEBEB',
                      background: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="삭제"
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setDeleteTarget(null)}>
          <div style={{
            width: '100%', maxWidth: 320, background: 'white',
            borderRadius: 16, padding: '28px 20px 20px', textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🗑️</p>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>상품을 삭제할까요?</h3>
            <p style={{ fontSize: 14, color: '#767676', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {deleteTarget.title}
            </p>
            <p style={{ fontSize: 13, color: '#AAAAAA', margin: '0 0 24px' }}>삭제된 상품은 복구할 수 없어요.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={{
                flex: 1, padding: '13px', border: '1.5px solid #EBEBEB',
                borderRadius: 10, fontSize: 15, cursor: 'pointer', background: 'white',
              }}>취소</button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: '13px', border: 'none',
                borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                background: '#FF3B30', color: 'white',
              }}>{deleting ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
