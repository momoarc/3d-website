'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Shield,
  Gem,
  Quote,
  Play,
  Star,
  Zap,
  Award,
  Clock3,
  Heart,
  Eye,
  Layers,
  Sparkles,
  Truck,
  CheckCircle,
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import ProductCard from '@/components/public/ProductCard'
import type { LandingPage, LandingPageSection } from '@/lib/types'

// ─── Icon Map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  zap: Zap,
  award: Award,
  clock: Clock3,
  heart: Heart,
  eye: Eye,
  layers: Layers,
  sparkles: Sparkles,
  truck: Truck,
  shield: Shield,
  gem: Gem,
  check: CheckCircle,
  phone: Phone,
  map: MapPin,
}

// ─── Section Renderers ────────────────────────────────────────────────────────

function HeroSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const subtitle = (content.subtitle as string) || ''
  const image = (content.image as string) || '/images/watches/brand-hero.jpg'
  const ctaText = (content.cta_text as string) || ''
  const ctaLink = (content.cta_link as string) || ''
  const alignment = (content.alignment as string) || 'center'

  const alignmentClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[alignment] || 'text-center items-center'

  return (
    <section className="relative w-full bg-[#0b0906]" style={{ height: 'calc(100vh - 72px)', marginTop: '72px' }}>
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0906]/70 via-[#0b0906]/50 to-[#0b0906]/90" />
      </div>

      {/* Content */}
      <div className={`relative z-10 h-full flex flex-col justify-center ${alignmentClass} px-6 max-w-[1200px] mx-auto`}>
        {subtitle && (
          <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-4">
            {subtitle}
          </div>
        )}
        <h1 className="font-serif text-[clamp(32px,6vw,72px)] font-medium leading-[1.1] text-[#f5f5f0] mb-6 max-w-3xl">
          {title}
        </h1>
        {ctaText && ctaLink && (
          <Link
            href={ctaLink}
            className="bg-[#c9a84c] text-[#0a0800] px-8 py-4 rounded text-[13px] font-bold tracking-[2.5px] uppercase shadow-[0_4px_28px_rgba(201,168,76,0.35)] hover:bg-[#e4c06a] hover:-translate-y-px transition-all duration-200 inline-flex items-center gap-2"
          >
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  )
}

function ProductsSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const subtitle = (content.subtitle as string) || ''
  const productIds = (content.product_ids as number[]) || []
  const maxProducts = (content.max_products as number) || 4

  const [products, setProducts] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (Array.isArray(data)) {
          let filtered = data
          if (productIds.length > 0) {
            filtered = data.filter((p: any) => productIds.includes(p.id))
          }
          setProducts(filtered.slice(0, maxProducts))
        }
      } catch (err) {
        console.error('Products fetch error:', err)
      }
    }
    fetchProducts()
  }, [productIds, maxProducts])

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            {subtitle && (
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                {subtitle}
              </div>
            )}
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
              {title}
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="border border-white/[0.18] text-[#f5f5f0] px-5 py-3 rounded text-[12px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
          >
            Voir tout →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id as number}
                product={product as any}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#606060]">
            Aucun produit disponible pour le moment.
          </div>
        )}
      </div>
    </section>
  )
}

function TextSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const text = (content.text as string) || ''
  const alignment = (content.alignment as string) || 'center'
  const bgVariant = (content.background as string) || 'default'

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  }[alignment] || 'text-center mx-auto'

  const bgClass = bgVariant === 'dark'
    ? 'py-16 md:py-20 bg-[#0b0906] border-t border-b border-white/[0.08]'
    : 'py-16 md:py-20 border-t border-white/[0.08]'

  return (
    <section className={bgClass}>
      <div className="max-w-[800px] mx-auto px-6">
        <div className={alignmentClass}>
          {title && (
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0] mb-6">
              {title}
            </h2>
          )}
          <p className="text-[15px] text-[#a0a09a] leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </section>
  )
}

function CTASection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const buttonText = (content.button_text as string) || ''
  const buttonLink = (content.button_link as string) || ''
  const style = (content.style as string) || 'gold'

  const styleConfig = {
    gold: {
      bg: 'bg-[#c9a84c]',
      textColor: 'text-[#0a0800]',
      btnBg: 'bg-[#0a0800]',
      btnText: 'text-[#c9a84c]',
    },
    dark: {
      bg: 'bg-[#111113]',
      textColor: 'text-[#f5f5f0]',
      btnBg: 'bg-[#c9a84c]',
      btnText: 'text-[#0a0800]',
    },
    gradient: {
      bg: 'bg-gradient-to-r from-[#c9a84c]/20 via-[#111113] to-[#c9a84c]/20',
      textColor: 'text-[#f5f5f0]',
      btnBg: 'bg-[#c9a84c]',
      btnText: 'text-[#0a0800]',
    },
  }[style] || {
    bg: 'bg-[#c9a84c]',
    textColor: 'text-[#0a0800]',
    btnBg: 'bg-[#0a0800]',
    btnText: 'text-[#c9a84c]',
  }

  return (
    <section className={`${styleConfig.bg} py-16 md:py-20 border-t border-white/[0.08]`}>
      <div className="max-w-[800px] mx-auto px-6 text-center">
        <h2 className={`font-serif text-[clamp(24px,4vw,42px)] font-medium leading-[1.2] ${styleConfig.textColor} mb-6`}>
          {title}
        </h2>
        {buttonText && buttonLink && (
          <Link
            href={buttonLink}
            className={`${styleConfig.btnBg} ${styleConfig.btnText} px-8 py-4 rounded text-[13px] font-bold tracking-[2.5px] uppercase hover:opacity-90 hover:-translate-y-px transition-all duration-200 inline-flex items-center gap-2`}
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  )
}

function TestimonialSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const items = (content.items as Array<{ quote: string; author: string; role: string; avatar?: string }>) || []

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6">
        {title && (
          <div className="text-center mb-12">
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
              {title}
            </h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-[#111113] border border-white/[0.08] rounded-lg p-6 hover:border-[#c9a84c]/20 transition-colors duration-200"
            >
              <Quote className="w-8 h-8 text-[#c9a84c] mb-4 opacity-60" />
              <p className="text-[14px] text-[#a0a09a] leading-relaxed mb-6">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c9a84c]/15 flex items-center justify-center text-[#c9a84c] text-sm font-semibold">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.author} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    item.author?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#f5f5f0]">{item.author}</div>
                  <div className="text-[11px] text-[#606060]">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const images = (content.images as string[]) || []
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (images.length === 0) return null

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6">
        {title && (
          <div className="text-center mb-12">
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
              {title}
            </h2>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="aspect-square overflow-hidden rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 transition-all duration-200 cursor-pointer group"
            >
              <img
                src={img}
                alt={`Galerie ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl z-10"
            onClick={() => setLightboxIdx(null)}
          >
            ✕
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)) }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.min(images.length - 1, lightboxIdx + 1)) }}
          >
            ›
          </button>
          <img
            src={images[lightboxIdx]}
            alt={`Galerie ${lightboxIdx + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}

function FAQSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || 'FAQ'
  const items = (content.items as Array<{ question: string; answer: string }>) || []
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08]">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-[#111113] border border-white/[0.08] rounded-lg overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="text-sm font-medium text-[#f5f5f0] pr-4">{item.question}</span>
                <ChevronRight
                  className={`w-4 h-4 text-[#c9a84c] flex-shrink-0 transition-transform duration-200 ${
                    openIdx === i ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 text-[14px] text-[#a0a09a] leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function VideoSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const description = (content.description as string) || ''
  const videoUrl = (content.video_url as string) || ''

  // Convert YouTube/Vimeo URLs to embed URLs
  const getEmbedUrl = (url: string) => {
    if (!url) return ''
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08]">
      <div className="max-w-[900px] mx-auto px-6">
        {(title || description) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0] mb-3">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[15px] text-[#a0a09a]">{description}</p>
            )}
          </div>
        )}
        {embedUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden border border-white/[0.08]">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title || 'Vidéo'}
            />
          </div>
        ) : (
          <div className="aspect-video rounded-lg overflow-hidden border border-white/[0.08] bg-[#111113] flex items-center justify-center">
            <div className="text-center text-[#606060]">
              <Play className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Vidéo non disponible</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function CountdownSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const subtitle = (content.subtitle as string) || ''
  const targetDate = (content.target_date as string) || ''

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!targetDate) return

    const calculateTime = () => {
      const target = new Date(targetDate).getTime()
      const now = Date.now()
      const diff = Math.max(0, target - now)

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const units = [
    { value: timeLeft.days, label: 'Jours' },
    { value: timeLeft.hours, label: 'Heures' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Secondes' },
  ]

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08] bg-gradient-to-br from-[#c9a84c]/5 to-transparent">
      <div className="max-w-[800px] mx-auto px-6 text-center">
        {subtitle && (
          <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
            {subtitle}
          </div>
        )}
        {title && (
          <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0] mb-10">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center gap-4 md:gap-6">
          {units.map((unit, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-[#111113] border border-white/[0.08] rounded-lg w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-2">
                <span className="font-serif text-3xl md:text-4xl font-medium text-[#c9a84c]">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[10px] tracking-[2px] uppercase text-[#606060]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || ''
  const items = (content.items as Array<{ icon: string; title: string; description: string }>) || []
  const columns = (content.columns as number) || Math.min(Math.max(items.length, 2), 4)

  const colClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns] || 'md:grid-cols-3'

  return (
    <section className="py-16 md:py-20 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6">
        {title && (
          <div className="text-center mb-12">
            <h2 className="font-serif text-[clamp(28px,5vw,48px)] font-medium leading-[1.15] text-[#f5f5f0]">
              {title}
            </h2>
          </div>
        )}
        <div className={`grid grid-cols-1 ${colClass} gap-6`}>
          {items.map((item, i) => {
            const IconComponent = ICON_MAP[item.icon?.toLowerCase()] || Star
            return (
              <div
                key={i}
                className="bg-[#111113] border border-white/[0.08] rounded-lg p-6 text-center hover:border-[#c9a84c]/20 transition-colors duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-[#c9a84c]/10 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-[#c9a84c]" />
                </div>
                <h3 className="font-serif text-lg font-medium text-[#f5f5f0] mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#a0a09a] leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Section Router ───────────────────────────────────────────────────────────

function SectionRenderer({ section }: { section: LandingPageSection }) {
  switch (section.type) {
    case 'hero':
      return <HeroSection content={section.content} />
    case 'products':
      return <ProductsSection content={section.content} />
    case 'text':
      return <TextSection content={section.content} />
    case 'cta':
      return <CTASection content={section.content} />
    case 'testimonial':
      return <TestimonialSection content={section.content} />
    case 'gallery':
      return <GallerySection content={section.content} />
    case 'faq':
      return <FAQSection content={section.content} />
    case 'video':
      return <VideoSection content={section.content} />
    case 'countdown':
      return <CountdownSection content={section.content} />
    case 'features':
      return <FeaturesSection content={section.content} />
    default:
      return null
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPageRenderer() {
  const params = useParams()
  const slug = params.slug as string
  const [page, setPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/landing-pages/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Page non trouvée')
          } else {
            setError('Erreur lors du chargement')
          }
          return
        }
        const data = await res.json()
        setPage(data)
      } catch {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center" style={{ marginTop: '72px' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
            <p className="text-[#a0a09a] text-sm">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center" style={{ marginTop: '72px' }}>
          <div className="text-center px-6">
            <div className="font-serif text-4xl font-medium text-[#f5f5f0] mb-4">
              {error === 'Page non trouvée' ? '404' : 'Erreur'}
            </div>
            <p className="text-[#a0a09a] mb-6">
              {error === 'Page non trouvée'
                ? 'Cette page n\'existe pas ou n\'est plus publiée.'
                : 'Une erreur est survenue lors du chargement de la page.'}
            </p>
            <Link
              href="/"
              className="bg-[#c9a84c] text-[#0a0800] px-6 py-3 rounded text-[11px] font-bold tracking-[2.5px] uppercase hover:bg-[#e4c06a] transition-all duration-200"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const sections = Array.isArray(page.sections) ? page.sections : []

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />
      {sections.map((section, i) => (
        <SectionRenderer key={section.id || i} section={section} />
      ))}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#08080a]">
        <div className="max-w-[1200px] mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#c9a84c] flex items-center justify-center text-[11px] font-bold text-[#0a0800] rounded-sm">
              MD
            </div>
            <span className="text-sm font-semibold tracking-[3px] uppercase text-[#f5f5f0]">
              Maison Dorée
            </span>
          </div>
          <p className="text-[12px] text-[#606060]">
            © {new Date().getFullYear()} Maison Dorée. Horlogerie de Luxe · Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
