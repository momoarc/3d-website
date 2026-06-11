'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ArrowRight, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { CartItem } from '@/lib/types'

interface ProductCardProps {
  product: {
    id: number
    slug?: string
    name: string
    category: string
    price: number
    compare_price?: number
    image_url: string | null
    badge: string | null
    description: string | null
    gender?: string
    available?: boolean
  }
  onOrder?: (productId: number) => void
}

export default function ProductCard({ product, onOrder }: ProductCardProps) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ').format(price)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cartItem: CartItem = {
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
      category: product.category,
      attributes: {},
    }
    addToCart(cartItem)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleCommander = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Direct navigation to order form — bypass any parent link
    window.location.href = `/commander/${product.id}`
  }

  const isUnavailable = product.available === false
  const productUrl = product.slug ? `/produit/${product.slug}` : `/produit/${product.id}`

  return (
    <div className={`bg-[#111113] border border-white/[0.08] rounded-[10px] overflow-hidden group transition-all duration-300 hover:border-[#c9a84c]/30 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${isUnavailable ? 'opacity-70' : ''}`}>
      {/* Image — clickable to product page */}
      <Link href={productUrl} className="block aspect-square overflow-hidden relative">
        <img
          src={product.image_url || '/images/watches/automatique-acier.jpg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[1.5px] uppercase bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30">
              {product.badge}
            </span>
          </div>
        )}
        {/* Gender badge */}
        {product.gender && (
          <div className="absolute top-3 right-3">
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[1px] uppercase bg-white/10 text-[#a0a09a] border border-white/10 backdrop-blur-sm">
              {product.gender}
            </span>
          </div>
        )}
        {/* Out of stock overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-5 py-2.5 rounded-lg bg-[#f87171]/15 border border-[#f87171]/30 text-[#f87171] text-[12px] font-bold tracking-[2px] uppercase">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-5">
        <Link href={productUrl} className="block">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-[2px] uppercase text-[#c9a84c]">
              {product.category}
            </span>
            {product.gender && (
              <>
                <span className="text-[#606060]">·</span>
                <span className="text-[10px] tracking-[1px] uppercase text-[#606060]">
                  {product.gender}
                </span>
              </>
            )}
          </div>
          <h3 className="font-serif text-lg font-medium text-[#f5f5f0] mb-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[13px] text-[#a0a09a] leading-relaxed mb-4 line-clamp-2">
              {product.description}
            </p>
          )}
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-semibold text-[#f5f5f0]">
              {formatPrice(product.price)}
              <span className="text-xs text-[#606060] font-normal ml-1">DA</span>
            </div>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-[#606060] line-through">
                {formatPrice(product.compare_price)} DA
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isUnavailable}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold tracking-[1px] uppercase transition-all duration-300 ${
              isUnavailable
                ? 'bg-white/5 text-[#606060] cursor-not-allowed opacity-50'
                : added
                  ? 'bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80]'
                  : 'bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] shadow-[0_2px_12px_rgba(201,168,76,0.25)]'
            }`}
          >
            {isUnavailable ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Indisponible
              </>
            ) : added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Ajouté ✓
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Ajouter
              </>
            )}
          </button>
        </div>

        {/* Commander button — goes DIRECTLY to order form, NOT inside Link */}
        {!isUnavailable && (
          <button
            onClick={handleCommander}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] tracking-[1.5px] uppercase font-bold bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] shadow-[0_2px_12px_rgba(201,168,76,0.25)] transition-all cursor-pointer"
          >
            Commander
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
