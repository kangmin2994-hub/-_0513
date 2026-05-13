'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, X } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import BottomNav from '@/components/BottomNav'
import { supabase, Product } from '@/lib/supabase'
import { Suspense } from 'react'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    if (query) doSearch(query)
  }, [])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('products')
      .select('*, profiles(nickname, location), categories(name, icon)')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .neq('status', '거래완료')
      .order('created_at', { ascending: false })
      .limit(50)
    setResults((data as unknown as Product[]) || [])
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8' }}>
      {/* 검색 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'white', borderBottom: '1px solid #EBEBEB',
        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={() => router.back()} style={{
          border: 'none', background: 'none', padding: 6, cursor: 'pointer',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </button>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: '#F4F4F4', borderRadius: 10, padding: '8px 12px',
          }}>
            <Search size={16} color="#AAAAAA" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="상품명을 검색해보세요"
              style={{
                flex: 1, border: 'none', background: 'none', outline: 'none',
                fontSize: 15, color: '#1A1A1A',
              }}
            />
            {query && (
              <button type="button" onClick={handleClear} style={{
                border: 'none', background: 'none', padding: 2,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}>
                <X size={16} color="#AAAAAA" />
              </button>
            )}
          </div>
          <button type="submit" style={{
            border: 'none', background: 'none', padding: '0 4px 0 10px',
            cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FF6B35',
            flexShrink: 0,
          }}>
            검색
          </button>
        </form>
      </div>

      {/* 결과 영역 */}
      <div style={{ paddingBottom: 70 }}>
        {!searched ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#767676' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>어떤 물건을 찾고 있나요?</p>
            <p style={{ fontSize: 14 }}>상품명, 브랜드, 키워드로 검색해보세요</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#767676' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>😅</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>
              &apos;{query}&apos; 검색 결과가 없어요
            </p>
            <p style={{ fontSize: 14 }}>다른 키워드로 검색해보세요</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 16px 4px', fontSize: 13, color: '#767676' }}>
              검색 결과 <span style={{ fontWeight: 700, color: '#FF6B35' }}>{results.length}</span>개
            </div>
            {results.map(p => <ProductCard key={p.id} product={p} />)}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
