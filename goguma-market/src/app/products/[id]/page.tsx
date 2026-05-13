'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, Share2, ChevronLeft, MoreVertical } from 'lucide-react'
import { supabase, Product, formatPrice, formatDate } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    fetchProduct()
    checkUser()
  }, [id])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setCurrentUserId(data.user?.id ?? null)
  }

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, profiles(nickname, avatar_url, location, manner_temperature), categories(name, icon)')
      .eq('id', id)
      .single()
    if (data) {
      setProduct(data as unknown as Product)
      await supabase.from('products').update({ views: (data.views || 0) + 1 }).eq('id', id)
      const { count } = await supabase.from('likes').select('*', { count: 'exact' }).eq('product_id', id)
      setLikeCount(count || 0)
    }
    setLoading(false)
  }

  const toggleLike = async () => {
    if (!currentUserId) { router.push('/auth'); return }
    if (liked) {
      await supabase.from('likes').delete().eq('product_id', id).eq('user_id', currentUserId)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ product_id: id, user_id: currentUserId })
      setLikeCount(c => c + 1)
    }
    setLiked(!liked)
  }

  const startChat = async () => {
    if (!currentUserId) { router.push('/auth'); return }
    if (currentUserId === product?.seller_id) return
    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('product_id', id)
      .eq('buyer_id', currentUserId)
      .single()
    if (existing) { router.push(`/chat/${existing.id}`); return }
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ product_id: id, buyer_id: currentUserId, seller_id: product?.seller_id })
      .select('id')
      .single()
    if (newRoom) router.push(`/chat/${newRoom.id}`)
  }

  const statusColor = { 판매중: '#FF6B35', 예약중: '#856404', 거래완료: '#767676' }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )
  if (!product) return <div style={{ textAlign: 'center', padding: 40 }}>상품을 찾을 수 없어요.</div>

  const images = product.image_urls?.length ? product.image_urls : []

  return (
    <div style={{ minHeight: '100vh', background: 'white', paddingBottom: 90 }}>
      {/* 상단 오버레이 버튼 */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', padding: 12,
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <button style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MoreVertical size={20} color="white" />
        </button>
      </div>

      {/* 이미지 */}
      <div style={{ width: '100%', aspectRatio: '1', background: '#F0F0F0', position: 'relative', overflow: 'hidden' }}>
        {images.length > 0 ? (
          <>
            <img src={images[imgIndex]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: 12, padding: '3px 10px', fontSize: 13 }}>
                {imgIndex + 1}/{images.length}
              </div>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
            {product.categories?.icon || '📦'}
          </div>
        )}
      </div>

      {/* 판매자 정보 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {product.profiles?.avatar_url ? <img src={product.profiles.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '🍠'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{product.profiles?.nickname || '알 수 없음'}</p>
          <p style={{ fontSize: 13, color: '#767676', margin: 0 }}>{product.profiles?.location}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 13, color: '#FF6B35', fontWeight: 700, margin: 0 }}>
            매너온도 {product.profiles?.manner_temperature}°C
          </p>
        </div>
      </div>

      {/* 상품 정보 */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#767676' }}>{product.categories?.icon} {product.categories?.name}</span>
          <span style={{
            fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
            background: product.status === '판매중' ? '#FFF0EB' : product.status === '예약중' ? '#FFF3CD' : '#F0F0F0',
            color: statusColor[product.status] || '#767676',
          }}>{product.status}</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{product.title}</h1>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 13, background: '#F4F4F4', padding: '4px 10px', borderRadius: 6, color: '#767676' }}>
            {product.condition}
          </span>
          <span style={{ fontSize: 13, background: '#F4F4F4', padding: '4px 10px', borderRadius: 6, color: '#767676' }}>
            {product.trade_type}
          </span>
          {product.allow_price_offer && (
            <span style={{ fontSize: 13, background: '#FFF0EB', padding: '4px 10px', borderRadius: 6, color: '#FF6B35' }}>
              가격제안가능
            </span>
          )}
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>
          {product.description}
        </p>

        <p style={{ fontSize: 13, color: '#AAAAAA' }}>
          {product.location} · {formatDate(product.created_at)} · 조회 {product.views}
        </p>
      </div>

      {/* 하단 액션 바 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'white', borderTop: '1px solid #EBEBEB',
        display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}>
        <button onClick={toggleLike} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          border: 'none', background: 'none', cursor: 'pointer', padding: '0 8px',
        }}>
          <Heart size={24} fill={liked ? '#FF6B35' : 'none'} color={liked ? '#FF6B35' : '#767676'} />
          <span style={{ fontSize: 11, color: '#767676' }}>{likeCount}</span>
        </button>
        <div style={{ width: 1, height: 30, background: '#EBEBEB' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{formatPrice(product.price)}</p>
        </div>
        {currentUserId !== product.seller_id && product.status === '판매중' && (
          <button onClick={startChat} style={{
            background: '#FF6B35', color: 'white', border: 'none',
            borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            채팅하기
          </button>
        )}
      </div>
    </div>
  )
}
