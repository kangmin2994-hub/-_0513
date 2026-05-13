'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Camera } from 'lucide-react'
import Header from '@/components/Header'
import { supabase, Category } from '@/lib/supabase'

export default function EditProductPage() {
  const router = useRouter()
  const { id } = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    title: '', price: '', description: '',
    category_id: '', condition: '사용감있음' as '미사용' | '거의새것' | '사용감있음',
    trade_type: '직거래' as '직거래' | '택배' | '모두가능',
    status: '판매중' as '판매중' | '예약중' | '거래완료',
    allow_price_offer: false, location: '',
    image_urls: [] as string[],
  })

  useEffect(() => {
    fetchCategories()
    fetchProduct()
  }, [id])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id')
    if (data) setCategories(data)
  }

  const fetchProduct = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (!data) { router.back(); return }
    if (data.seller_id !== user.id) { router.back(); return }

    setForm({
      title: data.title,
      price: data.price === 0 ? '0' : data.price.toLocaleString('ko-KR'),
      description: data.description || '',
      category_id: data.category_id ? String(data.category_id) : '',
      condition: data.condition,
      trade_type: data.trade_type,
      status: data.status,
      allow_price_offer: data.allow_price_offer,
      location: data.location || '',
      image_urls: data.image_urls || [],
    })
    setFetching(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)

    const { error } = await supabase
      .from('products')
      .update({
        title: form.title,
        price: parseInt(form.price.replace(/,/g, '')) || 0,
        description: form.description,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        condition: form.condition,
        trade_type: form.trade_type,
        status: form.status,
        allow_price_offer: form.allow_price_offer,
        location: form.location,
      })
      .eq('id', id)

    setLoading(false)
    if (!error) router.push(`/products/${id}`)
  }

  const handleDelete = async () => {
    setLoading(true)
    await supabase.from('products').delete().eq('id', id)
    router.push('/mypage/trades')
  }

  const formatPriceInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    return num ? parseInt(num).toLocaleString('ko-KR') : ''
  }

  if (fetching) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header title="상품 수정" showBack />

      <form onSubmit={handleUpdate} style={{ padding: 16, paddingBottom: 100 }}>
        {/* 사진 (표시만) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {form.image_urls.map((url, i) => (
              <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            <div style={{
              width: 80, height: 80, border: '1.5px dashed #CCCCCC',
              borderRadius: 8, background: '#F8F8F8',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <Camera size={24} color="#AAAAAA" />
              <span style={{ fontSize: 11, color: '#AAAAAA' }}>{form.image_urls.length}/10</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #EBEBEB', marginBottom: 16 }} />

        {/* 제목 */}
        <div style={{ marginBottom: 16 }}>
          <input
            className="input-field"
            placeholder="글 제목"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            style={{ fontSize: 16, border: 'none', borderBottom: '1px solid #EBEBEB', borderRadius: 0, padding: '12px 0' }}
          />
        </div>

        {/* 카테고리 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#767676', display: 'block', marginBottom: 8 }}>카테고리</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <button
                key={cat.id} type="button"
                onClick={() => setForm(f => ({ ...f, category_id: String(cat.id) }))}
                style={{
                  border: `1.5px solid ${form.category_id === String(cat.id) ? '#FF6B35' : '#EBEBEB'}`,
                  borderRadius: 20, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                  background: form.category_id === String(cat.id) ? '#FFF0EB' : 'white',
                  color: form.category_id === String(cat.id) ? '#FF6B35' : '#1A1A1A',
                }}
              >{cat.icon} {cat.name}</button>
            ))}
          </div>
        </div>

        {/* 상태 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#767676', display: 'block', marginBottom: 8 }}>판매 상태</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['판매중', '예약중', '거래완료'] as const).map(s => (
              <button key={s} type="button"
                onClick={() => setForm(f => ({ ...f, status: s }))}
                style={{
                  flex: 1, border: `1.5px solid ${form.status === s ? '#FF6B35' : '#EBEBEB'}`,
                  borderRadius: 8, padding: '10px 4px', fontSize: 13, cursor: 'pointer',
                  background: form.status === s ? '#FFF0EB' : 'white',
                  color: form.status === s ? '#FF6B35' : '#1A1A1A',
                  fontWeight: form.status === s ? 700 : 400,
                }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* 상품 상태 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#767676', display: 'block', marginBottom: 8 }}>상품 상태</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['미사용', '거의새것', '사용감있음'] as const).map(cond => (
              <button key={cond} type="button"
                onClick={() => setForm(f => ({ ...f, condition: cond }))}
                style={{
                  flex: 1, border: `1.5px solid ${form.condition === cond ? '#FF6B35' : '#EBEBEB'}`,
                  borderRadius: 8, padding: '10px 4px', fontSize: 13, cursor: 'pointer',
                  background: form.condition === cond ? '#FFF0EB' : 'white',
                  color: form.condition === cond ? '#FF6B35' : '#1A1A1A',
                  fontWeight: form.condition === cond ? 700 : 400,
                }}
              >{cond}</button>
            ))}
          </div>
        </div>

        {/* 거래 방식 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#767676', display: 'block', marginBottom: 8 }}>거래 방식</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['직거래', '택배', '모두가능'] as const).map(type => (
              <button key={type} type="button"
                onClick={() => setForm(f => ({ ...f, trade_type: type }))}
                style={{
                  flex: 1, border: `1.5px solid ${form.trade_type === type ? '#FF6B35' : '#EBEBEB'}`,
                  borderRadius: 8, padding: '10px 4px', fontSize: 13, cursor: 'pointer',
                  background: form.trade_type === type ? '#FFF0EB' : 'white',
                  color: form.trade_type === type ? '#FF6B35' : '#1A1A1A',
                  fontWeight: form.trade_type === type ? 700 : 400,
                }}
              >{type}</button>
            ))}
          </div>
        </div>

        {/* 가격 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #EBEBEB', paddingBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, marginRight: 8 }}>₩</span>
            <input
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16 }}
              placeholder="가격을 입력하세요"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: formatPriceInput(e.target.value) }))}
              inputMode="numeric"
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.allow_price_offer}
              onChange={e => setForm(f => ({ ...f, allow_price_offer: e.target.checked }))}
              style={{ accentColor: '#FF6B35', width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14 }}>가격 제안 받기</span>
          </label>
        </div>

        {/* 설명 */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="input-field"
            placeholder="게시글 내용을 작성해 주세요"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={6}
            style={{ resize: 'none', fontFamily: 'inherit', fontSize: 15 }}
          />
        </div>

        {/* 거래 장소 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#767676', display: 'block', marginBottom: 8 }}>거래 희망 장소</label>
          <input
            className="input-field"
            placeholder="예) 강남역 2번 출구, 편의점 앞"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          />
        </div>

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            width: '100%', padding: '14px', background: 'none',
            color: '#FF3B30', border: '1.5px solid #FF3B30',
            borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
          }}
        >
          상품 삭제
        </button>

        {/* 수정 완료 버튼 */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px',
          background: 'white', borderTop: '1px solid #EBEBEB',
        }}>
          <button type="submit" className="btn-primary" disabled={loading || !form.title}>
            {loading ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{
            width: '100%', maxWidth: 320, background: 'white',
            borderRadius: 16, padding: '28px 20px 20px', textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🗑️</p>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>상품을 삭제할까요?</h3>
            <p style={{ fontSize: 14, color: '#767676', margin: '0 0 24px' }}>
              삭제된 상품은 복구할 수 없어요.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                flex: 1, padding: '13px', border: '1.5px solid #EBEBEB',
                borderRadius: 10, fontSize: 15, cursor: 'pointer', background: 'white', color: '#1A1A1A',
              }}>취소</button>
              <button onClick={handleDelete} disabled={loading} style={{
                flex: 1, padding: '13px', border: 'none',
                borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                background: '#FF3B30', color: 'white',
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
