'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Minus,
  Plus,
  ArrowLeft,
  Share2,
  Shield,
  Truck,
  Award,
  Clock,
  Eye,
  Users,
  Flame,
  CheckCircle2,
  Star,
  ChevronRight,
  Copy,
  MessageCircle,
  Heart,
  Package,
  Globe,
  Lock,
  RefreshCw,
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import ProductCard from '@/components/public/ProductCard'
import { useCart } from '@/lib/cart-context'
import type { Product, CartItem } from '@/lib/types'

interface FomoConfig {
  recent_purchases_enabled: boolean
  recent_purchases_interval: number
  recent_purchases_names: string[]
  recent_purchases_wilayas: string[]
  viewers_counter_enabled: boolean
  viewers_counter_min: number
  viewers_counter_max: number
  stock_urgency_enabled: boolean
  stock_urgency_threshold: number
  stock_urgency_use_real: boolean
  order_count_enabled: boolean
  order_count_min: number
  order_count_max: number
  order_count_use_real: boolean
  delivery_estimate_enabled: boolean
  delivery_estimate_days: number
  trust_badges_enabled: boolean
  trust_badges_items: Array<{ icon: string; label: string }>
}

const BADGE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award,
  shield: Shield,
  truck: Truck,
  package: Package,
  clock: Clock,
  heart: Heart,
  star: Star,
  gem: () => <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  check: CheckCircle2,
  globe: Globe,
  lock: Lock,
  refresh: RefreshCw,
}

const DEFAULT_FOMO: FomoConfig = {
  recent_purchases_enabled: true,
  recent_purchases_interval: 20,
  recent_purchases_names: ['Karim', 'Amina', 'Yacine', 'Sara', 'Mohamed', 'Leila', 'Omar', 'Nadia', 'Rami', 'Ines', 'Sofiane', 'Meriem'],
  recent_purchases_wilayas: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Blida', 'Tlemcen', 'Batna', 'Béjaïa', 'Tizi Ouzou'],
  viewers_counter_enabled: true,
  viewers_counter_min: 3,
  viewers_counter_max: 28,
  stock_urgency_enabled: true,
  stock_urgency_threshold: 5,
  stock_urgency_use_real: true,
  order_count_enabled: true,
  order_count_min: 12,
  order_count_max: 87,
  order_count_use_real: true,
  delivery_estimate_enabled: true,
  delivery_estimate_days: 2,
  trust_badges_enabled: true,
  trust_badges_items: [
    { icon: 'award', label: 'Authenticité certifiée' },
    { icon: 'shield', label: 'Garantie 3 ans' },
    { icon: 'truck', label: 'Livraison assurée' },
    { icon: 'package', label: 'Paiement à la livraison' },
  ],
}

// ─── FOMO Recent Purchase Toast ────────────────────────────────────────────
function RecentPurchaseToast({ fomo }: { fomo: FomoConfig }) {
  const [visible, setVisible] = useState(false)
  const [purchase, setPurchase] = useState({ name: '', wilaya: '', minutes: 0 })

  useEffect(() => {
    if (!fomo.recent_purchases_enabled) return

    const showPurchase = () => {
      const names = fomo.recent_purchases_names
      const wilayas = fomo.recent_purchases_wilayas
      const name = names[Math.floor(Math.random() * names.length)]
      const wilaya = wilayas[Math.floor(Math.random() * wilayas.length)]
      const minutes = Math.floor(Math.random() * 25) + 2
      setPurchase({ name, wilaya, minutes })
      setVisible(true)

      setTimeout(() => setVisible(false), 5000)
    }

    const initialTimeout = setTimeout(showPurchase, 5000)

    const interval = setInterval(() => {
      const jitter = Math.random() * 10000 - 5000
      setTimeout(showPurchase, jitter > 0 ? jitter : 0)
    }, fomo.recent_purchases_interval * 1000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [fomo])

  if (!fomo.recent_purchases_enabled) return null

  return (
    <div
      className={`fixed bottom-6 left-6 z-[998] max-w-[320px] transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-[#111113] border border-[#c9a84c]/20 rounded-lg p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-4 h-4 text-[#c9a84c]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#f5f5f0] font-medium">
            {purchase.name} de {purchase.wilaya}
          </p>
          <p className="text-[11px] text-[#a0a09a] mt-0.5">
            vient de commander cette montre — il y a {purchase.minutes} min
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-[#606060] hover:text-[#f5f5f0] transition-colors"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ─── Spec Icon Map ─────────────────────────────────────────────────────────
function SpecIcon({ spec }: { spec: string }) {
  const lower = spec.toLowerCase()
  if (lower.includes('mouvement') || lower.includes('automatique') || lower.includes('tourbillon'))
    return <Clock className="w-5 h-5 text-[#c9a84c]" />
  if (lower.includes('or') || lower.includes('titane') || lower.includes('acier') || lower.includes('matériau'))
    return <Award className="w-5 h-5 text-[#c9a84c]" />
  if (lower.includes('étanche') || lower.includes('plongée') || lower.includes('water'))
    return <svg className="w-5 h-5 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 2.4-4.5 6-4.5 9.5a4.5 4.5 0 009 0c0-3.5-3.3-7.1-4.5-9.5z" /></svg>
  if (lower.includes('saphir') || lower.includes('verre') || lower.includes('diamant'))
    return <svg className="w-5 h-5 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
  if (lower.includes('bracelet'))
    return <svg className="w-5 h-5 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  if (lower.includes('boîtier') || lower.includes('cadran'))
    return <svg className="w-5 h-5 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
  return <CheckCircle2 className="w-5 h-5 text-[#c9a84c]" />
}

// ─── Sticky Add to Cart Bar (mobile) ───────────────────────────────────────
function StickyCartBar({ product, quantity, selectedAttributes, onAddToCart, addedToCart, isUnavailable }: {
  product: Product
  quantity: number
  selectedAttributes: Record<string, string>
  onAddToCart: () => void
  addedToCart: boolean
  isUnavailable: boolean
}) {
  const formatPrice = (price: number) => new Intl.NumberFormat('fr-DZ').format(price)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[900] bg-[#111113]/95 backdrop-blur-xl border-t border-white/[0.08] p-3 lg:hidden">
      <div className="flex items-center gap-3 max-w-[1200px] mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#f5f5f0] truncate">{product.name}</p>
          <p className="text-[#c9a84c] font-semibold">{formatPrice(product.price)} DA</p>
        </div>
        <button
          onClick={onAddToCart}
          disabled={isUnavailable}
          className={`px-5 py-3 rounded-lg text-[11px] font-bold tracking-[1.5px] uppercase transition-all flex items-center gap-2 ${
            isUnavailable
              ? 'bg-white/5 text-[#606060] cursor-not-allowed'
              : addedToCart
                ? 'bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80]'
                : 'bg-[#c9a84c] text-[#0a0800] shadow-[0_4px_20px_rgba(201,168,76,0.3)]'
          }`}
        >
          {isUnavailable ? 'Indisponible' : addedToCart ? 'Ajouté ✓' : 'Ajouter au panier'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [addedToCart, setAddedToCart] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Array<Record<string, unknown>>>([])
  const [fomo, setFomo] = useState<FomoConfig>(DEFAULT_FOMO)
  const [viewersCount, setViewersCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [copied, setCopied] = useState(false)
  const [wishlist, setWishlist] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Fetch product by ID or slug
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setProduct(data as Product)

        // Initialize selected attributes with first value
        const initialAttrs: Record<string, string> = {}
        if (data.attributes) {
          data.attributes.forEach((attr: { name: string; values: string[] }) => {
            if (attr.values && attr.values.length > 0) {
              initialAttrs[attr.name] = attr.values[0]
            }
          })
        }
        setSelectedAttributes(initialAttrs)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  // Fetch FOMO config
  useEffect(() => {
    fetch('/api/fomo')
      .then(r => r.json())
      .then(data => {
        if (data) setFomo(data as FomoConfig)
      })
      .catch(() => {})
  }, [])

  // Fetch related products
  useEffect(() => {
    if (!product) return
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const related = data
            .filter((p: Record<string, unknown>) => p.category === product.category && p.id !== product.id)
            .slice(0, 4)
          setRelatedProducts(related)
        }
      })
      .catch(() => {})
  }, [product])

  // FOMO: Viewers count
  useEffect(() => {
    if (!fomo.viewers_counter_enabled) return
    const min = fomo.viewers_counter_min
    const max = fomo.viewers_counter_max
    setViewersCount(Math.floor(Math.random() * (max - min + 1)) + min)
    const interval = setInterval(() => {
      setViewersCount(Math.floor(Math.random() * (max - min + 1)) + min)
    }, 30000)
    return () => clearInterval(interval)
  }, [fomo.viewers_counter_enabled, fomo.viewers_counter_min, fomo.viewers_counter_max])

  // FOMO: Order count
  useEffect(() => {
    if (!fomo.order_count_enabled) return
    if (fomo.order_count_use_real) {
      // Fetch real order count for this product
      if (!id) return
      fetch(`/api/orders?count=true&product_id=${id}`)
        .then(r => r.json())
        .then(data => {
          if (data && typeof data.count === 'number') {
            setOrderCount(data.count)
          }
        })
        .catch(() => {
          // Fallback to random if API fails
          const min = fomo.order_count_min
          const max = fomo.order_count_max
          setOrderCount(Math.floor(Math.random() * (max - min + 1)) + min)
        })
    } else {
      const min = fomo.order_count_min
      const max = fomo.order_count_max
      setOrderCount(Math.floor(Math.random() * (max - min + 1)) + min)
    }
  }, [fomo.order_count_enabled, fomo.order_count_use_real, fomo.order_count_min, fomo.order_count_max, id])

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-DZ').format(price)
  }, [])

  // Delivery estimate date
  const getDeliveryDate = useCallback(() => {
    const date = new Date()
    date.setDate(date.getDate() + fomo.delivery_estimate_days)
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }, [fomo.delivery_estimate_days])

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!product) return
    const cartItem: CartItem = {
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity,
      category: product.category,
      attributes: selectedAttributes,
    }
    addToCart(cartItem)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }, [product, quantity, selectedAttributes, addToCart])

  // Image zoom handler
  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  // Copy link
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  // Share via WhatsApp
  const handleShareWhatsApp = useCallback(() => {
    if (!product) return
    const text = encodeURIComponent(`Découvrez cette montre : ${product.name} - ${formatPrice(product.price)} DA`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }, [product, formatPrice])

  // Share via Facebook
  const handleShareFacebook = useCallback(() => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')
  }, [])

  // Placeholder reviews
  const REVIEWS = [
    { name: 'Karim B.', rating: 5, text: 'Montre exceptionnelle, la qualité est au rendez-vous. Livraison rapide et emballage impeccable.', date: 'Il y a 3 jours' },
    { name: 'Amina M.', rating: 5, text: 'Un cadeau parfait pour mon mari. Le certificat d\'authenticité est un vrai plus. Merci Maison Dorée !', date: 'Il y a 1 semaine' },
    { name: 'Yacine D.', rating: 4, text: 'Très belle montre, le mouvement est précis. Service client au top pour les questions.', date: 'Il y a 2 semaines' },
  ]

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
            <p className="text-[#a0a09a] text-sm">Chargement du produit...</p>
          </div>
        </main>
      </div>
    )
  }

  // ─── Not Found State ──────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔍</div>
            <h1 className="font-serif text-3xl text-[#f5f5f0]">Produit introuvable</h1>
            <p className="text-[#a0a09a]">Ce produit n&apos;existe pas ou a été retiré.</p>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#0a0800] px-6 py-3 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au catalogue
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const isUnavailable = product.available === false
  // Use real stock if stock_urgency_use_real is true and product has stock
  const stockLeft = fomo.stock_urgency_use_real && product.stock && product.stock > 0
    ? product.stock
    : (product.stock && product.stock > 0
      ? Math.min(product.stock, fomo.stock_urgency_threshold)
      : Math.floor(Math.random() * 4) + 2)

  // Build images array from product data
  const allImages = product.images?.length
    ? product.images
    : (product.image_url ? [product.image_url] : ['/images/watches/automatique-acier.jpg'])

  // Reset selectedImageIndex if it's out of bounds (e.g. after product change)
  const safeImageIndex = selectedImageIndex < allImages.length ? selectedImageIndex : 0

  // ─── JSON-LD Schema ──────────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: allImages,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'DZD',
      availability: isUnavailable ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Brand',
      name: 'Maison Dorée',
    },
  }

  // Product URL (prefer slug if available)
  const productUrl = product.slug ? `/produit/${product.slug}` : `/produit/${product.id}`

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-[72px] flex-1 pb-20 lg:pb-0">
        {/* ─── Hero Section ─────────────────────────────────────────────────── */}
        <section className="py-8 md:py-12">
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[11px] tracking-[1px] uppercase mb-8">
              <Link href="/" className="text-[#606060] hover:text-[#c9a84c] transition-colors">Accueil</Link>
              <ChevronRight className="w-3 h-3 text-[#606060]" />
              <Link href={`/catalogue?category=${encodeURIComponent(product.category)}`} className="text-[#606060] hover:text-[#c9a84c] transition-colors">
                {product.category}
              </Link>
              <ChevronRight className="w-3 h-3 text-[#606060]" />
              <span className="text-[#a0a09a]">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              {/* Left: Image Gallery */}
              <div className="space-y-3">
                {/* Main Image */}
                <div
                  className="relative aspect-square rounded-[12px] overflow-hidden bg-[#111113] border border-white/[0.06] cursor-zoom-in"
                  onMouseEnter={() => setZoomed(true)}
                  onMouseLeave={() => setZoomed(false)}
                  onMouseMove={handleImageMouseMove}
                >
                  <img
                    src={allImages[safeImageIndex]}
                    alt={`${product.name} - Image ${safeImageIndex + 1}`}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      zoomed ? 'scale-[2]' : 'scale-100'
                    }`}
                    style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                  />
                  {/* Badge overlay */}
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[1.5px] uppercase bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30 backdrop-blur-sm">
                        {product.badge}
                      </span>
                    </div>
                  )}
                  {product.gender && product.gender !== 'Mixte' && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[1px] uppercase bg-white/10 text-[#a0a09a] border border-white/10 backdrop-blur-sm">
                        {product.gender}
                      </span>
                    </div>
                  )}
                  {isUnavailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-20">
                      <span className="px-6 py-3 rounded-lg bg-[#f87171]/15 border border-[#f87171]/30 text-[#f87171] text-[13px] font-bold tracking-[2px] uppercase">
                        Rupture de stock
                      </span>
                    </div>
                  )}
                  {/* Wishlist button */}
                  <button
                    onClick={() => setWishlist(!wishlist)}
                    className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="Ajouter aux favoris"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${wishlist ? 'text-red-400 fill-red-400' : 'text-white/70'}`} />
                  </button>
                </div>

                {/* Thumbnail Strip */}
                {allImages.length > 1 && (
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[460px] lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-thin">
                    {allImages.map((img, index) => (
                      <button
                        key={`${img}-${index}`}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          safeImageIndex === index
                            ? 'border-[#c9a84c] shadow-[0_0_12px_rgba(201,168,76,0.25)]'
                            : 'border-white/[0.06] hover:border-white/[0.15]'
                        }`}
                        aria-label={`Voir image ${index + 1}`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} vignette ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-[#c9a84c] text-[#0a0800] text-[7px] font-bold tracking-[0.5px] uppercase text-center">
                            Principale
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div className="flex flex-col">
                {/* Category badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] tracking-[2px] uppercase text-[#c9a84c] font-semibold">
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

                {/* Product name */}
                <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.1] text-[#f5f5f0] mb-4">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-semibold text-[#f5f5f0]">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-[#606060] font-normal">DA</span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-lg text-[#606060] line-through ml-1">
                      {formatPrice(product.compare_price)} DA
                    </span>
                  )}
                </div>

                {/* Badge */}
                {product.badge && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-[1.5px] uppercase bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30">
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <p className="text-[15px] text-[#a0a09a] leading-relaxed mb-6">
                    {product.description}
                  </p>
                )}

                {/* FOMO: Viewers counter */}
                {fomo.viewers_counter_enabled && viewersCount > 0 && (
                  <div className="flex items-center gap-2 mb-3 text-[12px] text-[#a0a09a]">
                    <Eye className="w-4 h-4 text-[#c9a84c]" />
                    <span>
                      <span className="text-[#c9a84c] font-semibold animate-pulse inline-block">{viewersCount}</span> personnes regardent ce produit en ce moment
                    </span>
                  </div>
                )}

                {/* FOMO: Stock urgency */}
                {fomo.stock_urgency_enabled && !isUnavailable && (
                  <div className="flex items-center gap-2 mb-3 text-[12px]">
                    <Flame className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-[#f59e0b] font-medium">
                      Plus que {stockLeft} en stock !
                    </span>
                  </div>
                )}

                {/* FOMO: Order count */}
                {fomo.order_count_enabled && orderCount > 0 && (
                  <div className="flex items-center gap-2 mb-5 text-[12px] text-[#a0a09a]">
                    <Users className="w-4 h-4 text-[#c9a84c]" />
                    <span>Ce produit a été commandé <span className="text-[#c9a84c] font-semibold">{orderCount}</span> fois ce mois-ci</span>
                  </div>
                )}

                {/* Attribute selectors */}
                {product.attributes && product.attributes.length > 0 && (
                  <div className="space-y-4 mb-6 border-t border-white/[0.08] pt-6">
                    {product.attributes.map((attr) => (
                      attr.values && attr.values.length > 0 ? (
                        <div key={attr.name}>
                          <label className="text-[11px] tracking-[1.5px] uppercase text-[#a0a09a] font-semibold mb-2 block">
                            {attr.name} : <span className="text-[#c9a84c]">{selectedAttributes[attr.name] || attr.values[0]}</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map((val) => (
                              <button
                                key={val}
                                onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val }))}
                                className={`px-4 py-2.5 rounded text-[12px] font-medium transition-all duration-200 ${
                                  selectedAttributes[attr.name] === val
                                    ? 'bg-[#c9a84c] text-[#0a0800] border border-[#c9a84c] shadow-[0_2px_12px_rgba(201,168,76,0.2)]'
                                    : 'bg-[#111113] text-[#a0a09a] border border-white/[0.08] hover:border-[#c9a84c]/40 hover:text-[#f5f5f0]'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                )}

                {/* Quantity selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[11px] tracking-[1.5px] uppercase text-[#a0a09a] font-semibold">Quantité</span>
                  <div className="flex items-center gap-0 bg-[#111113] border border-white/[0.08] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/5 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-[#f5f5f0] font-medium text-[14px] border-x border-white/[0.08]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={isUnavailable}
                    className={`w-full py-4 rounded text-[12px] font-bold tracking-[2px] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                      isUnavailable
                        ? 'bg-white/5 text-[#606060] cursor-not-allowed'
                        : addedToCart
                          ? 'bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80]'
                          : 'bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] shadow-[0_4px_24px_rgba(201,168,76,0.3)]'
                    }`}
                  >
                    {isUnavailable ? (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Indisponible
                      </>
                    ) : addedToCart ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Ajouté au panier
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Ajouter au panier
                      </>
                    )}
                  </button>

                  <Link
                    href="/checkout"
                    className={`w-full py-3.5 rounded text-[11px] font-semibold tracking-[2px] uppercase text-center transition-all duration-200 border ${
                      isUnavailable
                        ? 'border-white/[0.06] text-[#606060] pointer-events-none'
                        : 'border-white/[0.18] text-[#f5f5f0] hover:border-[#c9a84c] hover:text-[#c9a84c]'
                    }`}
                  >
                    Commander directement
                  </Link>
                </div>

                {/* FOMO: Delivery estimate */}
                {fomo.delivery_estimate_enabled && !isUnavailable && (
                  <div className="flex items-center gap-2 mb-4 text-[12px] text-[#a0a09a] bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-lg px-4 py-3">
                    <Truck className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                    <span>Commandez maintenant, livraison estimée: <span className="text-[#c9a84c] font-medium capitalize">{getDeliveryDate()}</span></span>
                  </div>
                )}

                {/* FOMO: Secure payment */}
                <div className="flex items-center gap-2 mb-4 text-[12px] text-[#a0a09a] bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-lg px-4 py-3">
                  <Shield className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
                  <span>Paiement à la livraison — Vous ne payez qu&apos;à la réception</span>
                </div>

                {/* Share buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.08]">
                  <Share2 className="w-4 h-4 text-[#606060]" />
                  <span className="text-[11px] tracking-[1px] uppercase text-[#606060]">Partager</span>
                  <button
                    onClick={handleShareWhatsApp}
                    className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                    aria-label="Partager sur WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleShareFacebook}
                    className="p-2 rounded-lg bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
                    aria-label="Partager sur Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-white/5 text-[#a0a09a] hover:bg-white/10 transition-colors"
                    aria-label="Copier le lien"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && (
                    <span className="text-[11px] text-[#4ade80] animate-in fade-in">Lien copié !</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Specifications Section ───────────────────────────────────────── */}
        {product.specs && product.specs.length > 0 && (
          <section className="py-12 md:py-16 border-t border-white/[0.08]">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-10">
                <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                  Caractéristiques
                </div>
                <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-medium text-[#f5f5f0]">
                  Spécifications Techniques
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.specs.map((spec, i) => (
                  <div
                    key={i}
                    className="bg-[#111113] border border-white/[0.06] rounded-lg p-5 flex items-start gap-4 hover:border-[#c9a84c]/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                      <SpecIcon spec={spec} />
                    </div>
                    <span className="text-[13px] text-[#f5f5f0] font-medium leading-snug">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Trust Badges ──────────────────────────────────────────────────── */}
        {fomo.trust_badges_enabled && fomo.trust_badges_items && fomo.trust_badges_items.length > 0 && (
          <section className="py-8 border-t border-white/[0.08] bg-[#0a0a0c]">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fomo.trust_badges_items.map((badge, i) => {
                  const IconComponent = BADGE_ICON_MAP[badge.icon] || Award
                  return (
                    <div key={i} className="flex items-center gap-3 justify-center py-4">
                      <span className="text-[#c9a84c]"><IconComponent className="w-6 h-6" /></span>
                      <span className="text-[11px] tracking-[1px] uppercase text-[#a0a09a] font-medium">{badge.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── Related Products ──────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="py-12 md:py-16 border-t border-white/[0.08]">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-10">
                <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                  Suggestions
                </div>
                <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-medium text-[#f5f5f0]">
                  Vous aimerez aussi
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id as number} product={p as any} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Reviews Section ──────────────────────────────────────────────── */}
        <section className="py-12 md:py-16 border-t border-white/[0.08]">
          <div className="max-w-[800px] mx-auto px-6">
            <div className="text-center mb-10">
              <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
                Témoignages
              </div>
              <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-medium text-[#f5f5f0]">
                Avis clients
              </h2>
            </div>

            <div className="space-y-4 mb-8">
              {REVIEWS.map((review, i) => (
                <div key={i} className="bg-[#111113] border border-white/[0.06] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#c9a84c]/15 flex items-center justify-center text-[#c9a84c] font-semibold text-sm">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[13px] text-[#f5f5f0] font-medium">{review.name}</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`w-3 h-3 ${j < review.rating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-[#606060]'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#606060]">{review.date}</span>
                  </div>
                  <p className="text-[13px] text-[#a0a09a] leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button className="border border-[#c9a84c]/30 text-[#c9a84c] px-6 py-3 rounded text-[11px] font-semibold tracking-[1.5px] uppercase hover:bg-[#c9a84c]/10 transition-all duration-200">
                Soyez le premier à donner votre avis
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOMO: Recent purchase toast */}
      <RecentPurchaseToast fomo={fomo} />

      {/* Sticky mobile cart bar */}
      {!isUnavailable && (
        <StickyCartBar
          product={product}
          quantity={quantity}
          selectedAttributes={selectedAttributes}
          onAddToCart={handleAddToCart}
          addedToCart={addedToCart}
          isUnavailable={isUnavailable}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#08080a]">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#c9a84c] flex items-center justify-center text-[11px] font-bold text-[#0a0800] rounded-sm">
                MD
              </div>
              <span className="text-sm font-semibold tracking-[3px] uppercase text-[#f5f5f0]">
                Maison Dorée
              </span>
            </div>
            <div className="text-[12px] text-[#606060]">
              © {new Date().getFullYear()} Maison Dorée. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
