'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase, formatDate, formatPrice } from '@/lib/supabase'

type NotifItem = {
  room_id: number
  product_id: number
  product_title: string
  product_icon: string
  product_image: string | null
  other_nickname: string
  last_message: string
  last_time: string
  unread_count: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<NotifItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth'); return }
    setUserId(data.user.id)
    await fetchNotifications(data.user.id)
  }

  const fetchNotifications = async (uid: string) => {
    setLoading(true)

    // 내가 참여한 채팅방 + 최근 메시지
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select(`
        id, product_id,
        products(title, image_urls, categories(icon)),
        buyer:profiles!chat_rooms_buyer_id_fkey(nickname),
        seller:profiles!chat_rooms_seller_id_fkey(nickname),
        buyer_id, seller_id,
        messages(id, content, sender_id, is_read, created_at)
      `)
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (!rooms) { setLoading(false); return }

    const notifs: NotifItem[] = []

    for (const room of rooms as any[]) {
      const msgs: any[] = room.messages || []
      if (msgs.length === 0) continue

      // 시간순 정렬
      msgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const lastMsg = msgs[0]

      const unread = msgs.filter((m: any) => m.sender_id !== uid && !m.is_read).length
      const isBuyer = room.buyer_id === uid
      const otherNickname = isBuyer ? room.seller?.nickname : room.buyer?.nickname

      notifs.push({
        room_id: room.id,
        product_id: room.product_id,
        product_title: room.products?.title || '상품 없음',
        product_icon: room.products?.categories?.icon || '📦',
        product_image: room.products?.image_urls?.[0] || null,
        other_nickname: otherNickname || '알 수 없음',
        last_message: lastMsg.content,
        last_time: lastMsg.created_at,
        unread_count: unread,
      })
    }

    // 안읽은 것 먼저, 그 다음 최신순
    notifs.sort((a, b) => {
      if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count
      return new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
    })

    setItems(notifs)
    setLoading(false)

    // 읽음 처리
    const unreadIds = (rooms as any[]).flatMap((r: any) =>
      (r.messages || []).filter((m: any) => m.sender_id !== uid && !m.is_read).map((m: any) => m.id)
    )
    if (unreadIds.length > 0) {
      await supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
    }
  }

  const handleClick = (item: NotifItem) => {
    router.push(`/chat/${item.room_id}`)
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
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>알림</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#767676' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔔</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>알림이 없어요</p>
          <p style={{ fontSize: 14 }}>채팅이 오면 여기서 확인할 수 있어요</p>
        </div>
      ) : (
        <div>
          {items.map(item => (
            <div
              key={item.room_id}
              onClick={() => handleClick(item)}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                background: item.unread_count > 0 ? '#FFF8F6' : 'white',
                borderBottom: '1px solid #EBEBEB', cursor: 'pointer',
                alignItems: 'center',
              }}
            >
              {/* 썸네일 */}
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: '#F0F0F0', flexShrink: 0,
                overflow: 'hidden', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {item.product_image
                  ? <img src={item.product_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : item.product_icon}
              </div>

              {/* 내용 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{item.other_nickname}</span>
                  <span style={{ fontSize: 12, color: '#AAAAAA' }}>{formatDate(item.last_time)}</span>
                </div>
                <p style={{
                  fontSize: 13, color: '#555', margin: '0 0 4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.last_message}
                </p>
                <p style={{
                  fontSize: 12, color: '#AAAAAA', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.product_title}
                </p>
              </div>

              {/* 읽지 않은 뱃지 */}
              {item.unread_count > 0 && (
                <div style={{
                  minWidth: 20, height: 20, borderRadius: 10,
                  background: '#FF6B35', color: 'white',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', flexShrink: 0,
                }}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
