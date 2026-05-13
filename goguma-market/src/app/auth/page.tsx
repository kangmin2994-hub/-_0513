'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('이메일 또는 비밀번호를 확인해주세요.')
      else router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nickname } },
      })
      if (error) setError(error.message)
      else {
        setError('')
        alert('가입 완료! 이메일을 확인해주세요.')
        setIsLogin(true)
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column', padding: 24 }}>
      {/* 로고 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 60, margin: '0 0 8px' }}>🍠</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FF6B35', margin: '0 0 8px' }}>고구마마켓</h1>
          <p style={{ fontSize: 15, color: '#767676', margin: 0 }}>내 동네 이웃과 따뜻하게 거래해요</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: 12 }}>
              <input
                className="input-field"
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <input
              className="input-field"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input
              className="input-field"
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p style={{ color: '#E63946', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError('') }}
          style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#767676', fontSize: 14, textDecoration: 'underline' }}>
          {isLogin ? '아직 계정이 없어요 → 회원가입' : '이미 계정이 있어요 → 로그인'}
        </button>
      </div>
    </div>
  )
}
