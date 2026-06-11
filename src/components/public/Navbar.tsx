'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Phone, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

const NAV_LINKS = [
  { label: 'Showroom', href: '/#showroom' },
  { label: 'Collection', href: '/catalogue' },
  { label: 'À Propos', href: '/#about' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { getCartCount, setCartOpen } = useCart()

  const cartCount = getCartCount()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] h-[72px] transition-all duration-300 ${
          scrolled
            ? 'bg-[#08080a]/98 border-b border-white/[0.08]'
            : 'bg-[#08080a]/92 border-b border-white/[0.08]'
        } backdrop-blur-xl`}
      >
        <div className="flex items-center justify-between h-full max-w-[1200px] mx-auto px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-[38px] h-[38px] bg-[#c9a84c] flex items-center justify-center text-[13px] font-bold text-[#0a0800] rounded-sm flex-shrink-0 group-hover:bg-[#e4c06a] transition-colors">
              MD
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[3px] uppercase text-[#f5f5f0]">
                Maison Dorée
              </div>
              <div className="text-[9px] tracking-[2px] text-[#606060] uppercase">
                Algérie · Horlogerie de Luxe
              </div>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-[11px] font-medium tracking-[1.5px] uppercase text-[#a0a09a] rounded hover:text-[#f5f5f0] hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Cart + Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 text-[#a0a09a] hover:text-[#c9a84c] transition-colors duration-200"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#c9a84c] text-[#0a0800] text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full min-w-[18px] min-h-[18px]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <Link
              href="/commander"
              className="hidden sm:inline-flex bg-[#c9a84c] text-[#0a0800] px-5 py-2.5 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] hover:-translate-y-px transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
            >
              Commander
            </Link>
            <button
              className="md:hidden flex flex-col gap-[5px] p-1 cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileOpen ? (
                <X className="w-6 h-6 text-[#f5f5f0]" />
              ) : (
                <Menu className="w-6 h-6 text-[#f5f5f0]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed top-[72px] left-0 right-0 bg-[#08080a]/98 backdrop-blur-xl border-b border-white/[0.08] z-[999] transition-all duration-300 ${
          mobileOpen
            ? 'flex flex-col gap-1 p-5 opacity-100'
            : 'hidden opacity-0'
        }`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="py-3.5 text-[13px] font-medium tracking-[2px] uppercase text-[#a0a09a] border-b border-white/[0.08] hover:text-[#c9a84c] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/commander"
          className="mt-3 py-4 bg-[#c9a84c] text-[#0a0800] text-center text-[13px] font-bold tracking-[2px] uppercase rounded hover:bg-[#e4c06a] transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          Commander Maintenant
        </Link>
      </div>
    </>
  )
}
