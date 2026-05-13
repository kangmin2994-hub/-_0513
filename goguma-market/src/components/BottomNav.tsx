'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Plus, User, ShoppingBag } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/chat', icon: MessageCircle, label: '채팅' },
  { href: '/products/new', icon: Plus, label: '', isCenter: true },
  { href: '/mypage/trades', icon: ShoppingBag, label: '내 거래' },
  { href: '/mypage', icon: User, label: '마이' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'white', borderTop: '1px solid #EBEBEB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      height: 60, zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {navItems.map(({ href, icon: Icon, label, isCenter }) => {
        const active = pathname === href
        if (isCenter) {
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: '50%',
              background: '#FF6B35', color: 'white',
              boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
              marginTop: -16,
            }}>
              <Icon size={24} />
            </Link>
          )
        }
        return (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: active ? '#FF6B35' : '#767676',
            textDecoration: 'none', flex: 1, padding: '6px 0',
          }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
