'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase, formatDate } from '@/lib/supabase'

export default function ChatListPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth'); return }
    setUserId(data.user.id)
    fetchRooms(data.user.id)
  }

  const fetchRooms = async (uid: string) => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*, products(title, image_urls, price), buyer:profiles!chat_rooms_buyer_id_fkey(nickname, avatar_url), seller:profiles!chat_rooms_seller_id_fkey(nickname, avatar_url), messages(content, created_at, is_read, sender_id)')
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order('created_at', { ascending: false })
    if (data) setRooms(data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header title="채팅" />
      <div style={{ paddingBottom: 70 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#767676' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>💬</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>채팅 내역이 없어요</p>
            <p style={{ fontSize: 14 }}>마음에 드는 물건에 채팅을 걸어보세요!</p>
          </div>
        ) : rooms.map(room => {
          const other = userId === room.buyer_id ? room.seller : room.buyer
          const lastMsg = room.messages?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          const unread = room.messages?.filter((m: any) => !m.is_read && m.sender_id !== userId).length || 0

          return (
            <div key={room.id} onClick={() => router.push(`/chat/${room.id}`)}
              style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #EBEBEB', cursor: 'pointer', background: 'white' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {other?.avatar_url ? <img src={other.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '🍠'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{other?.nickname || '알 수 없음'}</span>
                  <span style={{ fontSize: 12, color: '#AAAAAA' }}>{lastMsg ? formatDate(lastMsg.created_at) : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 14, color: '#767676', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {lastMsg?.content || room.products?.title || ''}
                  </p>
                  {unread > 0 && (
                    <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#FF6B35', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, padding: '0 6px' }}>
                      {unread}
                    </span>
                  )}
                </div>
              </div>
              {room.products?.image_urls?.[0] && (
                <img src={room.products.image_urls[0]} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              )}
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
