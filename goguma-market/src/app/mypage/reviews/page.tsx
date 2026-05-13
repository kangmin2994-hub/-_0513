'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { supabase, formatDate } from '@/lib/supabase'

type Review = {
  id: number
  content: string
  rating: number
  created_at: string
  reviewer: { nickname: string; avatar_url: string | null }
  product: { title: string }
}

export default function ReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [mannerTemp, setMannerTemp] = useState<number>(36.5)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('manner_temperature')
      .eq('id', user.id)
      .single()
    if (profile) setMannerTemp(profile.manner_temperature)

    const { data } = await supabase
      .from('reviews')
      .select(`
        id, content, rating, created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(nickname, avatar_url),
        product:products!reviews_product_id_fkey(title)
      `)
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setReviews(data as unknown as Review[])
    setLoading(false)
  }

  const tempColor = (t: number) =>
    t >= 40 ? '#E63946' : t >= 37 ? '#FF6B35' : t >= 36 ? '#2196F3' : '#767676'

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

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
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>받은 후기</h1>
        {!loading && reviews.length > 0 && (
          <span style={{ marginLeft: 6, fontSize: 15, color: '#FF6B35', fontWeight: 700 }}>
            {reviews.length}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ paddingBottom: 70 }}>
          {/* 매너온도 + 평점 요약 */}
          <div style={{
            background: 'white', padding: '20px 16px', marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            borderBottom: '1px solid #EBEBEB',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: tempColor(mannerTemp), margin: 0 }}>
                {mannerTemp}°C
              </p>
              <p style={{ fontSize: 12, color: '#767676', margin: '4px 0 0' }}>매너온도</p>
            </div>
            {avgRating && (
              <>
                <div style={{ width: 1, height: 40, background: '#EBEBEB' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#FF6B35', margin: 0 }}>
                    ⭐ {avgRating}
                  </p>
                  <p style={{ fontSize: 12, color: '#767676', margin: '4px 0 0' }}>평균 별점</p>
                </div>
              </>
            )}
            <div style={{ width: 1, height: 40, background: '#EBEBEB' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                {reviews.length}
              </p>
              <p style={{ fontSize: 12, color: '#767676', margin: '4px 0 0' }}>총 후기</p>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#767676' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#FFF0EB', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Star size={32} color="#FF6B35" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>
                아직 받은 후기가 없어요
              </p>
              <p style={{ fontSize: 14 }}>거래를 완료하면 후기를 받을 수 있어요!</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} style={{
                background: 'white', padding: '16px',
                borderBottom: '1px solid #EBEBEB',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#FF6B35', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {review.reviewer?.avatar_url
                      ? <img src={review.reviewer.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : '🍠'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{review.reviewer?.nickname}</p>
                    <p style={{ fontSize: 12, color: '#AAAAAA', margin: '2px 0 0' }}>{formatDate(review.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={14} fill={s <= review.rating ? '#FF6B35' : 'none'} color={s <= review.rating ? '#FF6B35' : '#DDD'} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6, margin: '0 0 6px' }}>
                  {review.content}
                </p>
                <p style={{ fontSize: 12, color: '#AAAAAA', margin: 0 }}>
                  거래 상품: {review.product?.title}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
