'use client'

import { useCart } from '@/lib/cart-context'
import Link from 'next/link'
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

export default function CartDrawer() {
  const { items, removeFromCart, updateQuantity, getCartTotal, getCartCount, cartOpen, setCartOpen } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ').format(price)
  }

  const total = getCartTotal()
  const count = getCartCount()

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className="bg-[#08080a] border-l border-white/[0.08] w-full sm:max-w-[420px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-5 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5 text-[#f5f5f0]">
              <ShoppingBag className="w-5 h-5 text-[#c9a84c]" />
              Panier
              {count > 0 && (
                <span className="bg-[#c9a84c] text-[#0a0800] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">Votre panier de commande</SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-[#1a1a1e] rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-[#606060]" />
            </div>
            <h3 className="text-[#f5f5f0] font-serif text-lg mb-2">Votre panier est vide</h3>
            <p className="text-[#a0a09a] text-sm mb-6">
              Découvrez notre collection de montres de luxe
            </p>
            <Link
              href="/catalogue"
              onClick={() => setCartOpen(false)}
              className="bg-[#c9a84c] text-[#0a0800] px-6 py-3 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
            >
              Voir la Collection
            </Link>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-[#111113] border border-white/[0.06] rounded-lg p-3 flex gap-3 group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-[#1a1a1e]">
                    <img
                      src={item.image_url || '/images/watches/automatique-acier.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-[1.5px] uppercase text-[#c9a84c] truncate">
                          {item.category}
                        </div>
                        <h4 className="text-[13px] font-medium text-[#f5f5f0] truncate">
                          {item.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-[#606060] hover:text-[#f87171] transition-colors flex-shrink-0 p-0.5"
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Attributes */}
                    {Object.keys(item.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.attributes).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-[9px] text-[#606060] bg-[#1a1a1e] px-1.5 py-0.5 rounded"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price + Quantity */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm font-semibold text-[#f5f5f0]">
                        {formatPrice(item.price * item.quantity)}
                        <span className="text-[10px] text-[#606060] font-normal ml-1">DZD</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#1a1a1e] rounded-md px-1.5 py-1">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] transition-colors"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[12px] text-[#f5f5f0] font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] transition-colors"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.08] p-5 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-[#a0a09a] text-sm">Sous-total</span>
                <span className="text-xl font-semibold text-[#f5f5f0]">
                  {formatPrice(total)}
                  <span className="text-xs text-[#606060] font-normal ml-1">DZD</span>
                </span>
              </div>

              {/* Checkout button */}
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="w-full bg-[#c9a84c] text-[#0a0800] py-3.5 rounded text-[12px] font-bold tracking-[2px] uppercase flex items-center justify-center gap-2 hover:bg-[#e4c06a] transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
              >
                Passer la commande
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Continue shopping */}
              <Link
                href="/catalogue"
                onClick={() => setCartOpen(false)}
                className="block text-center text-[11px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors"
              >
                Continuer le shopping
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
