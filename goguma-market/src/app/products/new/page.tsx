'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X } from 'lucide-react'
import Header from '@/components/Header'
import { supabase, Category } from '@/lib/supabase'

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', price: '', description: '',
    category_id: '', condition: '사용감있음' as '미사용' | '거의새것' | '사용감있음',
    trade_type: '직거래' as '직거래' | '택배' | '모두가능',
    allow_price_offer: false, location: '위치 미설정',
  })

  useEffect(() => {
    checkAuth()
    fetchCategories()
  }, [])

  const checkAuth = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) router.push('/auth')
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id')
    if (data) setCategories(data)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 10 - images.length
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages(prev => [...prev, ...toAdd])
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async (userId: string): Promise<string[]> => {
    const urls: string[] = []
    for (const { file } of images) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false })
      if (!error) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const imageUrls = await uploadImages(user.id)

    const { data, error } = await supabase.from('products').insert({
      seller_id: user.id,
      title: form.title,
      price: parseInt(form.price.replace(/,/g, '')) || 0,
      description: form.description,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      condition: form.condition,
      trade_type: form.trade_type,
      allow_price_offer: form.allow_price_offer,
      location: form.location,
      image_urls: imageUrls,
    }).select('id').single()

    setLoading(false)
    if (data) router.push(`/products/${data.id}`)
  }

  const formatPriceInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    return num ? parseInt(num).toLocaleString('ko-KR') : ''
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header title="내 물건 팔기" showBack />

      <form onSubmit={handleSubmit} style={{ padding: 16, paddingBottom: 100 }}>
        {/* 사진 업로드 */}
        <div style={{ marginBottom: 20 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {/* 추가 버튼 */}
            {images.length < 10 && (
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, border: '1.5px dashed #CCCCCC', flexShrink: 0,
                  borderRadius: 8, background: '#F8F8F8', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                <Camera size={24} color="#AAAAAA" />
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>{images.length}/10</span>
              </button>
            )}
            {/* 미리보기 */}
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={img.preview} alt=""
                  style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #EBEBEB' }} />
                <button type="button" onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#1A1A1A', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <X size={12} color="white" />
                </button>
                {i === 0 && (
                  <span style={{
                    position: 'absolute', bottom: 4, left: 4,
                    fontSize: 10, background: 'rgba(0,0,0,0.55)', color: 'white',
                    padding: '1px 5px', borderRadius: 4,
                  }}>대표</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#AAAAAA', marginTop: 6 }}>사진은 최대 10장까지 등록 가능해요</p>
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
            placeholder="올릴 게시글 내용을 작성해 주세요&#10;(상품 상태, 사용 기간 등을 자세히 적어주세요)"
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

        {/* 등록 버튼 */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 16px', background: 'white', borderTop: '1px solid #EBEBEB' }}>
          <button type="submit" className="btn-primary" disabled={loading || !form.title}>
            {loading ? '등록 중...' : '작성 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}
