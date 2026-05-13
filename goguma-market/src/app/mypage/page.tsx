'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, LogOut, Package, Heart, Star, Pencil, Check, X } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase, Profile, formatPrice } from '@/lib/supabase'

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myProducts, setMyProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'selling' | 'done'>('selling')
  const [editingNickname, setEditingNickname] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const nicknameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (p) setProfile(p)
    const { data: prods } = await supabase.from('products').select('*, categories(name, icon)').eq('seller_id', data.user.id).order('created_at', { ascending: false })
    if (prods) setMyProducts(prods)
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const startEditNickname = () => {
    setNewNickname(profile?.nickname || '')
    setEditingNickname(true)
    setTimeout(() => nicknameInputRef.current?.focus(), 50)
  }

  const cancelEditNickname = () => {
    setEditingNickname(false)
    setNewNickname('')
  }

  const saveNickname = async () => {
    if (!newNickname.trim() || newNickname.trim() === profile?.nickname) {
      cancelEditNickname()
      return
    }
    setSavingNickname(true)
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ nickname: newNickname.trim() }).eq('id', user.user!.id)
    setProfile(prev => prev ? { ...prev, nickname: newNickname.trim() } : prev)
    setEditingNickname(false)
    setSavingNickname(false)
  }

  const filtered = myProducts.filter(p => tab === 'selling' ? p.status !== '거래완료' : p.status === '거래완료')

  const tempColor = (t: number) => t >= 40 ? '#E63946' : t >= 37 ? '#FF6B35' : t >= 36 ? '#2196F3' : '#767676'

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      <Header title="마이페이지" />

      {/* 프로필 */}
      <div style={{ background: 'white', padding: '24px 16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '🍠'}
          </div>
          <div style={{ flex: 1 }}>
            {editingNickname ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <input
                  ref={nicknameInputRef}
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') cancelEditNickname() }}
                  maxLength={20}
                  style={{
                    fontSize: 18, fontWeight: 700, border: 'none', borderBottom: '2px solid #FF6B35',
                    outline: 'none', padding: '2px 4px', width: '100%', background: 'transparent',
                  }}
                />
                <button onClick={saveNickname} disabled={savingNickname}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Check size={18} color="#FF6B35" />
                </button>
                <button onClick={cancelEditNickname}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <X size={18} color="#AAAAAA" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{profile?.nickname}</h2>
                <button onClick={startEditNickname}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  <Pencil size={15} color="#AAAAAA" />
                </button>
              </div>
            )}
            <p style={{ fontSize: 14, color: '#767676', margin: 0 }}>📍 {profile?.location}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: tempColor(profile?.manner_temperature || 36.5) }}>
              {profile?.manner_temperature}°C
            </div>
            <p style={{ fontSize: 11, color: '#767676', margin: 0 }}>매너온도</p>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <div style={{ background: 'white', marginBottom: 8 }}>
        {[
          { icon: Package, label: '판매 내역', href: '/mypage' },
          { icon: Heart, label: '관심 목록', href: '/mypage/likes' },
          { icon: Star, label: '받은 후기', href: '/mypage/reviews' },
        ].map(({ icon: Icon, label, href }) => (
          <button key={label} onClick={() => router.push(href)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #EBEBEB' }}>
            <Icon size={20} color="#767676" />
            <span style={{ flex: 1, fontSize: 15, textAlign: 'left' }}>{label}</span>
            <ChevronRight size={18} color="#CCCCCC" />
          </button>
        ))}
      </div>

      {/* 판매 내역 */}
      <div style={{ background: 'white', marginBottom: 8 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #EBEBEB' }}>
          {[{ key: 'selling', label: '판매중·예약중' }, { key: 'done', label: '거래완료' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#FF6B35' : '#767676', borderBottom: tab === t.key ? '2px solid #FF6B35' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#767676', fontSize: 14 }}>내역이 없어요</p>
        ) : filtered.map(p => (
          <div key={p.id} onClick={() => router.push(`/products/${p.id}`)}
            style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #EBEBEB', cursor: 'pointer' }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden' }}>
              {p.image_urls?.[0] ? <img src={p.image_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.categories?.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{formatPrice(p.price)}</p>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: p.status === '판매중' ? '#FFF0EB' : '#F0F0F0', color: p.status === '판매중' ? '#FF6B35' : '#767676', fontWeight: 600 }}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 로그아웃 */}
      <div style={{ background: 'white', marginBottom: 70 }}>
        <button onClick={logout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', border: 'none', background: 'none', cursor: 'pointer', color: '#E63946' }}>
          <LogOut size={20} />
          <span style={{ fontSize: 15 }}>로그아웃</span>
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
