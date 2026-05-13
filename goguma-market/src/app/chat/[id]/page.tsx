'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import Header from '@/components/Header'
import { supabase, formatPrice } from '@/lib/supabase'

export default function ChatRoomPage() {
  const { id } = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [room, setRoom] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user || !mounted) return
      setUserId(data.user.id)
      fetchRoom(data.user.id)
      fetchMessages()

      const channelName = `room-${id}-${Date.now()}`
      channel = supabase.channel(channelName)
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${id}` },
          payload => { if (mounted) setMessages(prev => [...prev, payload.new]) })
        .subscribe()
    }

    init()
    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchRoom = async (uid: string) => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*, products(title, image_urls, price, status), buyer:profiles!chat_rooms_buyer_id_fkey(nickname), seller:profiles!chat_rooms_seller_id_fkey(nickname)')
      .eq('id', Number(id))
      .maybeSingle()
    if (data) setRoom(data)
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', Number(id))
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const sendMessage = async () => {
    if (!input.trim() || !userId || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      room_id: Number(id),
      sender_id: userId,
      content: input.trim(),
      is_read: false,
    })
    if (error) {
      console.error('메시지 전송 실패:', error.message)
      alert('메시지 전송에 실패했어요: ' + error.message)
    } else {
      setInput('')
    }
    setSending(false)
  }

  const other = userId === room?.buyer_id ? room?.seller : room?.buyer

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F8F8' }}>
      <Header title={other?.nickname || '채팅'} showBack />

      {/* 상품 정보 바 */}
      {room?.products && (
        <div style={{ background: 'white', borderBottom: '1px solid #EBEBEB', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {room.products.image_urls?.[0] && (
            <img src={room.products.image_urls[0]} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.products.title}</p>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{formatPrice(room.products.price)}</p>
          </div>
          <span style={{ fontSize: 12, color: '#767676', background: '#F4F4F4', padding: '4px 8px', borderRadius: 4 }}>
            {room.products.status}
          </span>
        </div>
      )}

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === userId
          const time = new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8, alignItems: 'flex-end', gap: 6 }}>
              {!isMine && <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🍠</div>}
              {isMine && <span style={{ fontSize: 11, color: '#AAAAAA' }}>{time}</span>}
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine ? '#FF6B35' : 'white',
                color: isMine ? 'white' : '#1A1A1A',
                fontSize: 15, lineHeight: 1.4,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>{msg.content}</div>
              {!isMine && <span style={{ fontSize: 11, color: '#AAAAAA' }}>{time}</span>}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{ background: 'white', borderTop: '1px solid #EBEBEB', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="메시지를 입력하세요"
          style={{ flex: 1, border: '1.5px solid #EBEBEB', borderRadius: 24, padding: '10px 16px', fontSize: 15, outline: 'none', background: '#F8F8F8' }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: input.trim() ? '#FF6B35' : '#EBEBEB', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={18} color={input.trim() ? 'white' : '#AAAAAA'} />
        </button>
      </div>
    </div>
  )
}
