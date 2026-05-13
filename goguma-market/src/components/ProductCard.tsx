'use client'
import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { Product, formatPrice, formatDate } from '@/lib/supabase'

export default function ProductCard({ product }: { product: Product }) {
  const statusLabel = { 판매중: null, 예약중: '예약중', 거래완료: '거래완료' }[product.status]
  const badgeClass = { 판매중: '', 예약중: 'badge-reserve', 거래완료: 'badge-done' }[product.status]

  return (
    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="product-card" style={{
        display: 'flex', gap: 14, padding: '16px',
        background: 'white', borderBottom: '1px solid #EBEBEB',
        cursor: 'pointer',
      }}>
        {/* 썸네일 */}
        <div style={{
          width: 110, height: 110, borderRadius: 12, overflow: 'hidden',
          background: '#F0F0F0', flexShrink: 0, position: 'relative',
        }}>
          {product.image_urls?.[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 36,
            }}>
              {product.categories?.icon || '📦'}
            </div>
          )}
          {statusLabel && (
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: product.status === '예약중' ? '#856404' : '#767676',
              color: 'white', fontSize: 11, fontWeight: 700,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {statusLabel}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{
              fontSize: 15, color: '#1A1A1A', margin: '0 0 4px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{product.title}</p>
            <p style={{ fontSize: 13, color: '#767676', margin: 0 }}>
              {product.location} · {formatDate(product.created_at)}
            </p>
          </div>

          <div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 0' }}>
              {formatPrice(product.price)}
              {product.allow_price_offer && (
                <span style={{ fontSize: 12, color: '#767676', fontWeight: 400, marginLeft: 6 }}>가격제안가능</span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {(product.likes as unknown as number) > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#767676' }}>
                  <Heart size={13} /> {product.likes as unknown as number}
                </span>
              )}
              {product.views > 0 && (
                <span style={{ fontSize: 12, color: '#767676' }}>조회 {product.views}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
