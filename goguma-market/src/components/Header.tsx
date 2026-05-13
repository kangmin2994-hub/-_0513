'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Bell } from 'lucide-react'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showSearch?: boolean
  showBell?: boolean
  location?: string
  onSearchClick?: () => void
}

export default function Header({
  title, showBack = false, showSearch = false,
  showBell = false, location, onSearchClick,
}: HeaderProps) {
  const router = useRouter()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'white', borderBottom: '1px solid #EBEBEB',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', height: 52,
    }}>
      {showBack && (
        <button onClick={() => router.back()} style={{
          border: 'none', background: 'none', padding: '8px 8px 8px 0',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </button>
      )}

      {location ? (
        <button style={{
          flex: 1, border: 'none', background: 'none',
          textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>{location}</span>
          <span style={{ fontSize: 13, color: '#767676', marginTop: 1 }}>▾</span>
        </button>
      ) : (
        <h1 style={{
          flex: 1, fontSize: 17, fontWeight: 700,
          color: '#1A1A1A', margin: 0,
        }}>
          {title || '🍠 고구마마켓'}
        </h1>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        {showSearch && (
          <button onClick={onSearchClick} style={{
            border: 'none', background: 'none',
            padding: 8, cursor: 'pointer', display: 'flex',
          }}>
            <Search size={22} color="#1A1A1A" />
          </button>
        )}
        {showBell && (
          <button style={{
            border: 'none', background: 'none',
            padding: 8, cursor: 'pointer', display: 'flex',
          }}>
            <Bell size={22} color="#1A1A1A" />
          </button>
        )}
      </div>
    </header>
  )
}
