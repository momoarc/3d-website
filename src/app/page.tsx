'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Phone, ArrowRight, MapPin, Clock, Shield, Gem, ChevronRight } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import CategoryCard from '@/components/public/CategoryCard'
import ProductCard from '@/components/public/ProductCard'
import type { ShowroomWall } from '@/lib/types'

// Dynamic import for Three.js - SSR disabled
const Showroom3D = dynamic(() => import('@/components/showroom/Showroom3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0b0906] flex flex-col items-center justify-center gap-4">
      <div className="font-serif text-3xl md:text-4xl font-medium text-[#c9a84c] tracking-wider">
        Maison Dorée
      </div>
      <div className="text-[10px] tracking-[5px] uppercase text-[#606060]">
        Chargement du Showroom
      </div>
      <div className="w-56 h-[3px] bg-white/[0.07] rounded overflow-hidden mt-1">
        <div className="h-full bg-[#c9a84c] rounded animate-pulse" style={{ width: '30%' }} />
      </div>
    </div>
  ),
})

// ─── Default Data ──────────────────────────────────────────────────────────

// Default data is empty - all content comes from Supabase
// Add your categories, products and projects via the admin panel
const DEFAULT_CATEGORIES: Array<Record<string, unknown>> = []
const DEFAULT_PRODUCTS: Array<Record<string, unknown>> = []
const DEFAULT_PROJECTS: Array<Record<string, unknown>> = []

const MARQUEE_ITEMS = [
  'Horlogerie de Luxe',
  'Mouvements Suisses',
  'Garantie Internationale',
  '58 Wilayas',
  '+50 Modèles Exclusifs',
  'Certificat d\'Authenticité',
  'Paiement à la Livraison',
  'SAV Premium',
]

const STATS = [
  { value: '+1500', label: 'Clients Satisfaits' },
  { value: '58', label: 'Wilayas Livrées' },
  { value: '3 Ans', label: 'De Garantie' },
  { value: '48H', label: 'Délai de Livraison' },
]

const FAQ_ITEMS = [
  {
    q: 'Comment passer commande ?',
    a: 'Vous pouvez commander directement sur notre site via le formulaire de commande, ou nous appeler par téléphone. Le paiement se fait à la livraison (COD). Chaque montre est livrée avec son certificat d\'authenticité.',
  },
  {
    q: 'Quels sont les délais de livraison ?',
    a: 'La livraison est assurée sous 48h dans les grandes villes et 3-5 jours pour les autres wilayas. Chaque montre est expédiée dans un écrin de luxe avec assurance transport.',
  },
  {
    q: 'Les montres sont-elles authentiques ?',
    a: 'Absolument. Toutes nos montres sont livrées avec un certificat d\'authenticité et un numéro de série unique. Nous travaillons exclusivement avec des fournisseurs agréés et des manufactures certifiées.',
  },
  {
    q: 'Quelle est la garantie ?',
    a: 'Toutes nos montres bénéficient d\'une garantie internationale de 3 ans couvrant le mouvement et les défauts de fabrication. Les montres avec tourbillon bénéficient d\'une garantie étendue de 5 ans.',
  },
  {
    q: 'Puis-je payer à la livraison ?',
    a: 'Absolument ! Nous proposons le paiement à la livraison (COD) sur toutes nos commandes. Aucun paiement en ligne requis. Inspectez votre montre avant de payer.',
  },
]

// ─── Main Page Component ───────────────────────────────────────────────────

export default function HomePage() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [projects, setProjects] = useState(DEFAULT_PROJECTS)
  const [showroomWalls, setShowroomWalls] = useState<ShowroomWall[] | undefined>(undefined)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  // Fetch data from API (with fallback to defaults)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes, projRes, showRes] = await Promise.allSettled([
          fetch('/api/categories'),
          fetch('/api/products'),
          fetch('/api/projects'),
          fetch('/api/showroom'),
        ])

        if (catRes.status === 'fulfilled') {
          const catData = await catRes.value.json()
          if (catData && catData.length > 0) setCategories(catData)
        }
        if (prodRes.status === 'fulfilled') {
          const prodData = await prodRes.value.json()
          if (prodData && prodData.length > 0) setProducts(prodData)
        }
        if (projRes.status === 'fulfilled') {
          const projData = await projRes.value.json()
          if (projData && projData.length > 0) setProjects(projData)
        }
        if (showRes.status === 'fulfilled') {
          const showData = await showRes.value.json()
          if (showData.walls && showData.walls.length > 0) {
            setShowroomWalls(showData.walls)
          }
        }
      } catch (err) {
        console.error('Data fetch error:', err)
      }
    }
    fetchData()
  }, [])

  const handleWallClick = useCallback((destination: string) => {
    // Navigate to catalogue with category filter
    window.location.href = `/catalogue?category=${encodeURIComponent(destination)}`
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      {/* ─── 3D Showroom Hero Section ─────────────────────────────────────── */}
      <section
        id="showroom"
        className="relative w-full bg-[#0b0906]"
        style={{ height: 'calc(100vh - 72px)', marginTop: '72px' }}
      >
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-5 md:p-7 flex items-center justify-between">
          <div className="bg-[#08070a]/72 backdrop-blur-xl border border-[#c9a84c]/18 rounded-md px-4 py-2 flex items-center gap-2.5 pointer-events-auto">
            <div className="w-6 h-6 bg-[#c9a84c] rounded-sm flex items-center justify-center text-[12px] font-bold text-[#0a0800] flex-shrink-0">
              MD
            </div>
            <span className="text-[10px] font-bold tracking-[3px] uppercase text-[#f5f5f0]">
              Showroom Virtuel
            </span>
          </div>
          <div className="hidden sm:block bg-[#08070a]/72 backdrop-blur-xl border border-white/[0.08] rounded-md px-3.5 py-2">
            <span className="text-[10px] text-[#c9a84c] font-semibold tracking-[2px]">
              +50 Modèles · 58 Wilayas
            </span>
          </div>
        </div>

        {/* Three.js Canvas */}
        <Showroom3D onWallClick={handleWallClick} walls={showroomWalls} />

        {/* Bottom CTA bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-5 md:p-7 flex items-center justify-between bg-gradient-to-t from-[#08070a]/90 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <Link
              href="/commander"
              className="bg-[#c9a84c] text-[#0a0800] px-6 py-3.5 rounded text-[11px] font-bold tracking-[2.5px] uppercase shadow-[0_4px_28px_rgba(201,168,76,0.35)] hover:bg-[#e4c06a] hover:-translate-y-px transition-all duration-200"
            >
              Commander (COD)
            </Link>
            <Link
              href="/catalogue"
              className="hidden sm:inline-flex border border-white/[0.18] text-[#f5f5f0] px-5 py-3.5 rounded text-[11px] font-medium tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
            >
              Collection →
            </Link>
          </div>
          <a
            href="tel:+213XXXXXXXXX"
            className="flex items-center gap-2.5 bg-[#08070a]/78 backdrop-blur-xl border border-white/[0.08] rounded-lg px-4 py-2.5 pointer-events-auto hover:border-[#c9a84c] transition-colors duration-200"
          >
            <Phone className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
            <div>
              <div className="text-[9px] tracking-[2px] uppercase text-[#606060]">Appel direct</div>
              <div className="text-[13px] font-semibold text-[#f5f5f0]">+213 XX XX XX XX</div>
            </div>
          </a>
        </div>
      </section>

      {/* ─── Marquee Strip ────────────────────────────────────────────────── */}
      <div className="bg-[#c9a84c] overflow-hidden py-3 whitespace-nowrap">
        <div className="inline-flex animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-4 px-8 text-[11px] font-bold tracking-[2.5px] uppercase text-[#0a0800]"
            >
              {item}
              <span className="text-[8px] opacity-50">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 border-b border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 text-center">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className={`py-6 ${
                  i < STATS.length - 1 ? 'border-r border-white/[0.08]' : ''
                } ${i >= 2 ? 'border-t md:border-t-0 border-white/[0.08]' : ''}`}
              >
                <div className="font-serif text-3xl md:text-[40px] font-medium text-[#c9a84c] leading-none">
                  {stat.value}
                </div>
                <div className="text-[11px] tracking-[2px] uppercase text-[#606060] mt-1.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories Section ────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                Nos Collections
              </div>
              <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
                Explorez par
                <br />
                Collection
              </h2>
            </div>
            <Link
              href="/catalogue"
              className="border border-white/[0.18] text-[#f5f5f0] px-5 py-3 rounded text-[12px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
            >
              Voir Toute la Collection →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.slice(0, 4).map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                wide={i === 0}
                badge={i === 0 ? 'Bestseller' : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products Section ────────────────────────────────────── */}
      <section className="py-16 md:py-20 border-t border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                Sélection Prestige
              </div>
              <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
                Nos Montres
                <br />
                Vedettes
              </h2>
            </div>
            <Link
              href="/catalogue"
              className="border border-white/[0.18] text-[#f5f5f0] px-5 py-3 rounded text-[12px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
            >
              Collection Complète →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={() => {
                  window.location.href = '/commander'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Réalisations Section ──────────────────────────────────────────── */}
      <section className="py-16 md:py-20 border-t border-white/[0.08]" id="realisations">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                Nos Réalisations
              </div>
              <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
                L&apos;Art
                <br />
                Horloger
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#111113] border border-white/[0.08] rounded-[10px] overflow-hidden group hover:border-[#c9a84c]/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={project.image_url || '/images/watches/showroom-interior.jpg'}
                    alt={project.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 brightness-[0.7]"
                    loading="lazy"
                  />
                  {project.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[1.5px] uppercase bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30">
                        {project.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <MapPin className="w-3.5 h-3.5 text-[#c9a84c]" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] tracking-[2px] uppercase text-[#c9a84c] mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {project.location}
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#f5f5f0] mb-1.5">
                    {project.name}
                  </h3>
                  <p className="text-[13px] text-[#a0a09a] leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About Section ────────────────────────────────────────────────── */}
      <section id="about" className="py-16 md:py-20 border-t border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                À Propos
              </div>
              <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0] mb-6">
                L&apos;Excellence
                <br />
                au Service de Votre
                <br />
                <span className="text-[#c9a84c] italic">Élégance</span>
              </h2>
              <p className="text-[15px] text-[#a0a09a] leading-relaxed mb-6">
                Depuis plus de 15 ans, Maison Dorée est la référence de l&apos;horlogerie de luxe en Algérie.
                Nous sélectionnons les plus belles pièces auprès des manufactures les plus prestigieuses
                pour vous offrir des montres alliant précision, esthétique et savoir-faire artisanal.
              </p>
              <p className="text-[15px] text-[#a0a09a] leading-relaxed mb-8">
                Notre engagement : une livraison sécurisée partout en Algérie, un service après-vente
                premium, et la garantie de l&apos;authenticité de chaque pièce. Avec plus de 1500 clients
                satisfaits, nous continuons à élever les standards de l&apos;horlogerie sur le marché algérien.
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3 text-[#606060]">
                  <Gem className="w-5 h-5 text-[#c9a84c]" />
                  <span className="text-sm">Certificat d&apos;Authenticité</span>
                </div>
                <div className="flex items-center gap-3 text-[#606060]">
                  <Shield className="w-5 h-5 text-[#c9a84c]" />
                  <span className="text-sm">Garantie 3 Ans</span>
                </div>
                <div className="flex items-center gap-3 text-[#606060]">
                  <Clock className="w-5 h-5 text-[#c9a84c]" />
                  <span className="text-sm">Mouvements Suisses</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[10px] overflow-hidden border border-white/[0.08]">
                <img
                  src="/images/watches/showroom-interior.jpg"
                  alt="Showroom Maison Dorée"
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
              </div>
              {/* Stats badge overlay */}
              <div className="absolute -bottom-6 -left-4 bg-[#111113] border border-white/[0.08] rounded-lg p-5 shadow-xl">
                <div className="text-2xl font-serif font-medium text-[#c9a84c]">15+</div>
                <div className="text-[10px] tracking-[2px] uppercase text-[#606060]">
                  Ans d&apos;Expérience
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-20 border-t border-white/[0.08]">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
              Questions Fréquentes
            </div>
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
              FAQ
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-[#111113] border border-white/[0.08] rounded-lg overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="text-sm font-medium text-[#f5f5f0] pr-4">{item.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-[#c9a84c] flex-shrink-0 transition-transform duration-200 ${
                      faqOpen === i ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-[14px] text-[#a0a09a] leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Conversion Strip ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#c9a84c]/8 to-transparent border-t border-b border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-12 items-center">
            <div>
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                Commande Facile
              </div>
              <h2 className="font-serif text-[clamp(24px,4vw,42px)] font-medium leading-[1.2] text-[#f5f5f0] mb-3">
                Commandez par téléphone,
                <br />
                payez à la <span className="text-[#c9a84c] italic">livraison</span>
              </h2>
              <p className="text-[15px] text-[#a0a09a]">
                Notre équipe vous accompagne du choix à la réception. Inspectez votre montre
                avant de payer. Aucun paiement en ligne requis.
              </p>
            </div>
            <div className="flex flex-col gap-3 items-start lg:items-end">
              <Link
                href="/commander"
                className="bg-[#c9a84c] text-[#0a0800] px-8 py-4 rounded text-[13px] font-bold tracking-[2px] uppercase shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-[#e4c06a] hover:-translate-y-px transition-all duration-200"
              >
                Passer Commande Maintenant
              </Link>
              <a
                href="tel:+213XXXXXXXXX"
                className="flex items-center gap-3 px-5 py-4 rounded-lg bg-[#1a1a1e] border border-white/[0.18] hover:border-[#c9a84c] hover:bg-[#c9a84c]/15 transition-all duration-200"
              >
                <Phone className="w-5 h-5 text-[#c9a84c]" />
                <div>
                  <div className="text-[10px] tracking-[2px] uppercase text-[#606060]">
                    Appel direct
                  </div>
                  <div className="text-lg font-semibold text-[#f5f5f0]">+213 XX XX XX XX</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Section ──────────────────────────────────────────────── */}
      <section id="contact" className="py-16 md:py-20 border-t border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
              Contactez-Nous
            </div>
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
              Nous Sommes Là
              <br />
              Pour Vous
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111113] border border-white/[0.08] rounded-lg p-6 text-center hover:border-[#c9a84c]/30 transition-colors duration-200">
              <Phone className="w-8 h-8 text-[#c9a84c] mx-auto mb-4" />
              <h3 className="font-serif text-lg font-medium text-[#f5f5f0] mb-2">Téléphone</h3>
              <p className="text-[#a0a09a] text-sm">+213 XX XX XX XX</p>
              <p className="text-[#606060] text-xs mt-1">Lun-Sam : 9h-18h</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.08] rounded-lg p-6 text-center hover:border-[#c9a84c]/30 transition-colors duration-200">
              <MapPin className="w-8 h-8 text-[#c9a84c] mx-auto mb-4" />
              <h3 className="font-serif text-lg font-medium text-[#f5f5f0] mb-2">Boutique</h3>
              <p className="text-[#a0a09a] text-sm">Alger, Algérie</p>
              <p className="text-[#606060] text-xs mt-1">Sur rendez-vous</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.08] rounded-lg p-6 text-center hover:border-[#c9a84c]/30 transition-colors duration-200">
              <Clock className="w-8 h-8 text-[#c9a84c] mx-auto mb-4" />
              <h3 className="font-serif text-lg font-medium text-[#f5f5f0] mb-2">Horaires</h3>
              <p className="text-[#a0a09a] text-sm">Lun-Sam : 9h-18h</p>
              <p className="text-[#606060] text-xs mt-1">Dimanche : Fermé</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#08080a]">
        <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#c9a84c] flex items-center justify-center text-[14px] font-bold text-[#0a0800] rounded-sm">
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
              </div>
              <p className="text-[14px] text-[#a0a09a] leading-relaxed max-w-md mb-4">
                La référence de l&apos;horlogerie de luxe en Algérie. Montres certifiées, livraison sécurisée
                dans les 58 wilayas. Paiement à la livraison.
              </p>
              <div className="flex items-center gap-3 text-[12px] text-[#606060]">
                <Phone className="w-3.5 h-3.5 text-[#c9a84c]" />
                +213 XX XX XX XX
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-[10px] tracking-[3px] uppercase text-[#c9a84c] font-semibold mb-4">
                Navigation
              </h4>
              <div className="flex flex-col gap-2.5">
                <Link href="/#showroom" className="text-[13px] text-[#a0a09a] hover:text-[#f5f5f0] transition-colors">
                  Showroom
                </Link>
                <Link href="/catalogue" className="text-[13px] text-[#a0a09a] hover:text-[#f5f5f0] transition-colors">
                  Collection
                </Link>
                <Link href="/#about" className="text-[13px] text-[#a0a09a] hover:text-[#f5f5f0] transition-colors">
                  À Propos
                </Link>
                <Link href="/#faq" className="text-[13px] text-[#a0a09a] hover:text-[#f5f5f0] transition-colors">
                  FAQ
                </Link>
                <Link href="/commander" className="text-[13px] text-[#a0a09a] hover:text-[#f5f5f0] transition-colors">
                  Commander
                </Link>
              </div>
            </div>

            {/* Categories - Dynamic from Supabase */}
            <div>
              <h4 className="text-[10px] tracking-[3px] uppercase text-[#c9a84c] font-semibold mb-4">
                Collections
              </h4>
              <div className="flex flex-col gap-2.5">
                {categories.map((cat: any) => (
                  <Link key={cat.id} href={`/catalogue?category=${encodeURIComponent(cat.slug || cat.name)}`} className="text-[13px] text-[#a0a09a] hover:text-[#f5f5f0] transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[12px] text-[#606060]">
              © {new Date().getFullYear()} Maison Dorée. Tous droits réservés.
            </div>
            <div className="flex items-center gap-4">
              <div className="text-[12px] text-[#606060]">
                Horlogerie de Luxe · Livraison Nationale · Paiement à la Livraison
              </div>
              <Link href="/admin" className="text-[10px] text-[#3a3a3a] hover:text-[#c9a84c] transition-colors tracking-[1px] uppercase">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
