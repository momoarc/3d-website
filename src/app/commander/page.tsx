'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, Shield, Truck, CheckCircle2, AlertCircle,
  Minus, Plus, MapPin, Mail, User, Package, Clock
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import { Input } from '@/components/ui/input'
import { WILAYAS, WILAYA_COMMUNES } from '@/lib/algeria-data'

// Types
interface DeliveryZone {
  label: string
  wilayas: Record<string, number>
}

interface DeliveryService {
  name: string
  enabled: boolean
  pricing_type: 'zone' | 'flat'
  flat_price: number
  zones: Record<string, DeliveryZone>
}

interface DeliveryConfig {
  services: Record<string, DeliveryService>
  global_settings: {
    free_shipping_enabled: boolean
    free_shipping_min_amount: number
    delivery_estimate_days: number
    default_service: string
  }
}

interface ProductInfo {
  id: number
  name: string
  price: number
  compare_price?: number
  image_url: string | null
  images?: string[]
  category: string
  stock?: number
}

const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  services: {
    yalidine: {
      name: 'Yalidine',
      enabled: true,
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 400, '9': 400, '35': 400, '42': 400, '44': 400,
            '2': 600, '6': 600, '15': 600, '18': 600, '21': 600, '23': 600, '24': 600, '25': 600, '27': 600, '31': 600, '34': 600, '36': 600, '43': 600, '46': 600, '48': 600,
            '3': 700, '4': 700, '5': 700, '7': 700, '10': 700, '12': 700, '14': 700, '17': 700, '19': 700, '20': 700, '22': 700, '26': 700, '28': 700, '29': 700, '38': 700, '40': 700, '41': 700, '45': 700,
            '1': 900, '8': 900, '11': 900, '13': 900, '30': 900, '32': 900, '33': 900, '37': 900, '39': 900, '47': 900, '49': 900, '50': 900, '51': 900, '52': 900, '53': 900, '54': 900, '55': 900, '56': 900, '57': 900, '58': 900,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 200, '9': 200, '35': 200, '42': 200, '44': 200,
            '2': 300, '6': 300, '15': 300, '18': 300, '21': 300, '23': 300, '24': 300, '25': 300, '27': 300, '31': 300, '34': 300, '36': 300, '43': 300, '46': 300, '48': 300,
            '3': 350, '4': 350, '5': 350, '7': 350, '10': 350, '12': 350, '14': 350, '17': 350, '19': 350, '20': 350, '22': 350, '26': 350, '28': 350, '29': 350, '38': 350, '40': 350, '41': 350, '45': 350,
            '1': 450, '8': 450, '11': 450, '13': 450, '30': 450, '32': 450, '33': 450, '37': 450, '39': 450, '47': 450, '49': 450, '50': 450, '51': 450, '52': 450, '53': 450, '54': 450, '55': 450, '56': 450, '57': 450, '58': 450,
          },
        },
      },
    },
  },
  global_settings: {
    free_shipping_enabled: false,
    free_shipping_min_amount: 0,
    delivery_estimate_days: 3,
    default_service: 'yalidine',
  },
}

export default function CommanderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
            <p className="text-[#a0a09a] text-sm">Chargement...</p>
          </div>
        </main>
      </div>
    }>
      <CommanderPageContent />
    </Suspense>
  )
}

function CommanderPageContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product_id')

  const [product, setProduct] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG)
  const [selectedService, setSelectedService] = useState<string>('yalidine')
  const [selectedZone, setSelectedZone] = useState<string>('home')
  const [deliveryPrice, setDeliveryPrice] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; orderId?: string } | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    wilaya: '',
    commune: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch product
  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setProduct({
            id: data.id,
            name: data.name,
            price: data.price,
            compare_price: data.compare_price,
            image_url: data.image_url,
            images: data.images,
            category: data.category,
            stock: data.stock,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  // Fetch delivery config
  useEffect(() => {
    fetch('/api/delivery')
      .then(r => r.json())
      .then(data => {
        if (data && data.services) {
          // Check if services have actual pricing data
          const hasPricing = Object.values(data.services as Record<string, DeliveryService>).some(
            s => s.enabled && Object.values(s.zones).some(z => Object.keys(z.wilayas).length > 0)
          )
          if (hasPricing) {
            setDeliveryConfig(data as DeliveryConfig)
          }
          // Find default enabled service
          const enabled = Object.entries(data.services as Record<string, DeliveryService>).find(([, s]) => s.enabled)
          if (enabled) {
            setSelectedService(enabled[0])
          }
        }
      })
      .catch(() => {})
  }, [])

  // Available communes based on selected wilaya
  const availableCommunes = form.wilaya
    ? WILAYA_COMMUNES[parseInt(form.wilaya)] || []
    : []

  // Available delivery services (enabled only)
  const enabledServices = deliveryConfig
    ? Object.entries(deliveryConfig.services).filter(([, s]) => s.enabled)
    : []

  // Get available zones for current service that have pricing for selected wilaya
  const availableZones = useCallback(() => {
    if (!selectedService || !deliveryConfig.services[selectedService]) return []
    const service = deliveryConfig.services[selectedService]
    if (service.pricing_type !== 'zone') return []
    return Object.entries(service.zones).filter(([, zone]) =>
      form.wilaya ? zone.wilayas[form.wilaya] !== undefined : true
    )
  }, [selectedService, deliveryConfig, form.wilaya])

  // Calculate delivery price
  useEffect(() => {
    if (!deliveryConfig || !form.wilaya || !selectedService) {
      setDeliveryPrice(0)
      setFreeShipping(false)
      return
    }

    const service = deliveryConfig.services[selectedService]
    if (!service) { setDeliveryPrice(0); setFreeShipping(false); return }

    // Check free shipping
    const subtotal = (product?.price || 0) * quantity
    if (deliveryConfig.global_settings.free_shipping_enabled && subtotal >= deliveryConfig.global_settings.free_shipping_min_amount) {
      setFreeShipping(true)
      setDeliveryPrice(0)
      return
    }
    setFreeShipping(false)

    if (service.pricing_type === 'flat') {
      setDeliveryPrice(service.flat_price)
      return
    }

    // Zone-based pricing - find price for selected wilaya
    const wilayaCode = form.wilaya
    let price = 0

    // Check selected zone first
    if (selectedZone && service.zones[selectedZone]?.wilayas[wilayaCode] !== undefined) {
      price = service.zones[selectedZone].wilayas[wilayaCode]
    } else {
      // Search all zones
      for (const zone of Object.values(service.zones)) {
        if (zone.wilayas[wilayaCode] !== undefined) {
          price = zone.wilayas[wilayaCode]
          break
        }
      }
    }

    setDeliveryPrice(price)
  }, [deliveryConfig, form.wilaya, selectedService, selectedZone, product, quantity])

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-DZ').format(price)
  const subtotal = (product?.price || 0) * quantity
  const total = freeShipping ? subtotal : subtotal + deliveryPrice
  const productImage = product?.images?.[0] || product?.image_url || '/images/watches/automatique-acier.jpg'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next })
    }
    // Reset commune when wilaya changes
    if (name === 'wilaya') {
      setForm(prev => ({ ...prev, commune: '' }))
      // Auto-select first available zone for this wilaya
      if (deliveryConfig.services[selectedService]?.pricing_type === 'zone') {
        const service = deliveryConfig.services[selectedService]
        for (const [zoneKey, zone] of Object.entries(service.zones)) {
          if (zone.wilayas[value] !== undefined) {
            setSelectedZone(zoneKey)
            break
          }
        }
      }
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Le nom est obligatoire'
    if (!form.phone.trim()) newErrors.phone = 'Le téléphone est obligatoire'
    else if (!/^0[5-7]\d{8}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Numéro invalide (ex: 05XXXXXXXX)'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email invalide'
    if (!form.wilaya) newErrors.wilaya = 'Sélectionnez votre wilaya'
    if (!form.commune && form.wilaya) newErrors.commune = 'Sélectionnez votre commune'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    if (!validate()) return

    setSubmitting(true)
    setResult(null)

    try {
      const selectedWilaya = WILAYAS.find(w => w.code.toString() === form.wilaya)
      const serviceName = deliveryConfig?.services[selectedService]?.name || selectedService
      const zoneLabel = selectedZone && deliveryConfig?.services[selectedService]?.zones[selectedZone]?.label
        ? ` (${deliveryConfig.services[selectedService].zones[selectedZone].label})` : ''

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          wilaya: selectedWilaya?.name || form.wilaya,
          commune: form.commune,
          product: product.name,
          product_id: product.id,
          quantity,
          delivery_service: serviceName + zoneLabel,
          delivery_price: deliveryPrice,
          notes: '',
          source: 'direct_order',
          total: total,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || 'Commande enregistrée avec succès !', orderId: data.id })
      } else {
        setResult({ success: false, message: data.error || 'Erreur lors de la soumission.' })
      }
    } catch {
      setResult({ success: false, message: 'Erreur de connexion. Veuillez réessayer.' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Success State ────────────────────────────────────────────
  if (result?.success) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="max-w-md mx-auto px-6 text-center space-y-6 py-12 animate-fade-in">
            <div className="w-20 h-20 bg-[#4ade80]/15 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#f5f5f0] mb-2">Commande confirmée !</h2>
              <p className="text-[#a0a09a]">Votre commande a été enregistrée avec succès.</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
              <div className="text-[10px] tracking-[2px] uppercase text-[#c9a84c] font-semibold mb-2">Numéro de commande</div>
              <div className="text-xl font-semibold text-[#f5f5f0] mb-4">{result.orderId}</div>
              <p className="text-[13px] text-[#a0a09a]">
                Notre équipe vous contactera sous 24h pour confirmer votre commande. Vous payez à la livraison, aucun paiement en ligne requis.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="bg-[#c9a84c] text-[#0a0800] px-8 py-3.5 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
              >
                Retour à l&apos;accueil
              </Link>
              <Link
                href="/catalogue"
                className="border border-white/[0.18] text-[#f5f5f0] px-8 py-3.5 rounded text-[11px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── No Product — redirect to catalogue ───────────────────────
  if (!loading && !product) {
    // If no product_id was provided, redirect to catalogue
    if (!productId) {
      if (typeof window !== 'undefined') {
        window.location.href = '/catalogue'
        return null
      }
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl text-[#f5f5f0]">Produit introuvable</h2>
            <p className="text-[#a0a09a]">Ce produit n&apos;existe pas ou a été retiré.</p>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#0a0800] px-6 py-3 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voir le catalogue
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ─── Main Form — SINGLE PAGE ─────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      <main className="pt-[72px] flex-1">
        {/* Header */}
        <section className="py-6 md:py-8 border-b border-white/[0.08]">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <Link
              href={product ? `/produit/${product.id}` : '/catalogue'}
              className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au produit
            </Link>
            <h1 className="font-serif text-[clamp(24px,4vw,36px)] font-medium leading-[1.1] text-[#f5f5f0]">
              Passer Commande
            </h1>
          </div>
        </section>

        {/* Trust bar */}
        <div className="border-b border-white/[0.08] bg-[#0c0c0e]">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap gap-4 sm:gap-6 justify-center">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#4ade80]" />
              <span className="text-[10px] text-[#a0a09a]">Paiement à la livraison</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span className="text-[10px] text-[#a0a09a]">Livraison 58 Wilayas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span className="text-[10px] text-[#a0a09a]">Confirmation par téléphone</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <section className="py-6 md:py-10">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            {/* Error banner */}
            {result && !result.success && (
              <div className="mb-6 bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#f87171] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#f5f5f0] text-sm mb-0.5">Erreur</div>
                  <div className="text-[13px] text-[#a0a09a]">{result.message}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              {/* ─── LEFT: Form Fields (3/5) ──────────────────────── */}
              <div className="lg:col-span-3 space-y-5">

                {/* ── Section 1: Produit ── */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Produit sélectionné</h3>
                  </div>

                  {loading ? (
                    <div className="p-6 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
                    </div>
                  ) : product && (
                    <div className="p-4 flex gap-4">
                      {/* Product image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-[#08080a] border border-white/[0.06]">
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Product info — non modifiable */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-[9px] tracking-[1.5px] uppercase text-[#c9a84c] font-semibold">{product.category}</span>
                        <h4 className="text-[15px] sm:text-[17px] font-medium text-[#f5f5f0] font-serif mt-0.5 leading-tight">{product.name}</h4>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-lg font-semibold text-[#f5f5f0]">{formatPrice(product.price)}</span>
                          <span className="text-[10px] text-[#606060]">DA</span>
                          {product.compare_price && product.compare_price > product.price && (
                            <span className="text-[12px] text-[#606060] line-through ml-1">{formatPrice(product.compare_price)} DA</span>
                          )}
                        </div>
                        {/* Quantity */}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] tracking-[1px] uppercase text-[#a0a09a] font-semibold">Quantité</span>
                          <div className="flex items-center gap-0 bg-[#08080a] border border-white/[0.08] rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/5 transition-colors"
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 h-8 flex items-center justify-center text-[#f5f5f0] font-medium text-[13px] border-x border-white/[0.08]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/5 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[12px] text-[#606060]">= {formatPrice(subtotal)} DA</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 2: Informations personnelles ── */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Informations personnelles</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                        Nom complet <span className="text-[#c9a84c]">*</span>
                      </label>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Mohamed Benali"
                        className={`bg-[#08080a] h-10 text-[#f5f5f0] placeholder:text-[#505050] ${errors.name ? 'border-[#f87171] focus-visible:border-[#f87171]' : 'border-white/[0.08] focus-visible:border-[#c9a84c]'} focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30`}
                      />
                      {errors.name && <p className="text-[10px] text-[#f87171]">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                        Numéro de téléphone <span className="text-[#c9a84c]">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]" />
                        <Input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          placeholder="05 XX XX XX XX"
                          className={`bg-[#08080a] h-10 pl-10 text-[#f5f5f0] placeholder:text-[#505050] ${errors.phone ? 'border-[#f87171] focus-visible:border-[#f87171]' : 'border-white/[0.08] focus-visible:border-[#c9a84c]'} focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30`}
                        />
                      </div>
                      {errors.phone && <p className="text-[10px] text-[#f87171]">{errors.phone}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                        Email <span className="text-[#606060]">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]" />
                        <Input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="votre@email.com"
                          className={`bg-[#08080a] h-10 pl-10 text-[#f5f5f0] placeholder:text-[#505050] ${errors.email ? 'border-[#f87171] focus-visible:border-[#f87171]' : 'border-white/[0.08] focus-visible:border-[#c9a84c]'} focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30`}
                        />
                      </div>
                      {errors.email && <p className="text-[10px] text-[#f87171]">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Adresse de livraison ── */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Adresse de livraison</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Wilaya */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                        Wilaya <span className="text-[#c9a84c]">*</span>
                      </label>
                      <select
                        name="wilaya"
                        value={form.wilaya}
                        onChange={handleChange}
                        required
                        className={`w-full h-10 rounded-md border bg-[#08080a] px-3 py-2 text-[13px] text-[#f5f5f0] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30 ${errors.wilaya ? 'border-[#f87171]' : 'border-white/[0.08] focus:border-[#c9a84c]'}`}
                      >
                        <option value="" className="text-[#505050]">Sélectionner votre wilaya</option>
                        {WILAYAS.map(w => (
                          <option key={w.code} value={w.code.toString()} className="bg-[#111113]">
                            {w.code} - {w.name}
                          </option>
                        ))}
                      </select>
                      {errors.wilaya && <p className="text-[10px] text-[#f87171]">{errors.wilaya}</p>}
                    </div>

                    {/* Commune */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                        Commune <span className="text-[#c9a84c]">*</span>
                      </label>
                      <select
                        name="commune"
                        value={form.commune}
                        onChange={handleChange}
                        required
                        disabled={!form.wilaya}
                        className={`w-full h-10 rounded-md border bg-[#08080a] px-3 py-2 text-[13px] text-[#f5f5f0] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30 disabled:opacity-40 disabled:cursor-not-allowed ${errors.commune ? 'border-[#f87171]' : 'border-white/[0.08] focus:border-[#c9a84c]'}`}
                      >
                        <option value="" className="text-[#505050]">
                          {form.wilaya ? 'Sélectionner votre commune' : 'Sélectionnez d\'abord une wilaya'}
                        </option>
                        {availableCommunes.map(c => (
                          <option key={c} value={c} className="bg-[#111113]">{c}</option>
                        ))}
                      </select>
                      {errors.commune && <p className="text-[10px] text-[#f87171]">{errors.commune}</p>}
                    </div>

                    {/* Type de livraison (Domicile / Stop Desk) */}
                    {form.wilaya && availableZones().length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                          Type de livraison
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableZones().map(([zoneKey, zone]) => (
                            <button
                              key={zoneKey}
                              type="button"
                              onClick={() => setSelectedZone(zoneKey)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                selectedZone === zoneKey
                                  ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40 shadow-[0_0_12px_rgba(201,168,76,0.1)]'
                                  : 'bg-[#08080a] border-white/[0.06] hover:border-white/[0.15]'
                              }`}
                            >
                              <div className="text-[12px] font-semibold text-[#f5f5f0]">{zone.label}</div>
                              <div className="text-[11px] text-[#c9a84c] mt-0.5 font-medium">
                                {formatPrice(zone.wilayas[form.wilaya])} DA
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery service selector (if multiple enabled) */}
                    {enabledServices.length > 1 && form.wilaya && (
                      <div className="space-y-2">
                        <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">
                          Service de livraison
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {enabledServices.map(([key, service]) => {
                            // Find price for this service and wilaya
                            let servicePrice = 0
                            if (service.pricing_type === 'flat') {
                              servicePrice = service.flat_price
                            } else {
                              for (const zone of Object.values(service.zones)) {
                                if (zone.wilayas[form.wilaya] !== undefined) {
                                  servicePrice = zone.wilayas[form.wilaya]
                                  break
                                }
                              }
                            }
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedService(key)}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                  selectedService === key
                                    ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40 shadow-[0_0_12px_rgba(201,168,76,0.1)]'
                                    : servicePrice > 0
                                      ? 'bg-[#08080a] border-white/[0.06] hover:border-white/[0.15]'
                                      : 'bg-[#08080a] border-white/[0.06] opacity-40 cursor-not-allowed'
                                }`}
                                disabled={servicePrice === 0 && selectedService !== key}
                              >
                                <div className="text-[12px] font-semibold text-[#f5f5f0]">{service.name}</div>
                                <div className="text-[11px] text-[#a0a09a] mt-0.5">
                                  {servicePrice > 0 ? `${formatPrice(servicePrice)} DA` : 'Non disponible'}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* No delivery available for this wilaya */}
                    {form.wilaya && deliveryPrice === 0 && !freeShipping && selectedService && (
                      <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-md p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[#a0a09a]">
                          Les frais de livraison pour cette wilaya ne sont pas encore configurés. Notre équipe vous contactera pour confirmer le prix.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── RIGHT: Récapitulatif (2/5) ──────────────────── */}
              <div className="lg:col-span-2">
                <div className="sticky top-20 space-y-4">
                  {/* Récapitulatif */}
                  <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#c9a84c]" />
                      <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Récapitulatif</h3>
                    </div>

                    <div className="p-5 space-y-3">
                      {/* Sous-total */}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#a0a09a]">Sous-total ({quantity} article{quantity > 1 ? 's' : ''})</span>
                        <span className="text-[#f5f5f0] font-medium">{product ? formatPrice(subtotal) : '—'} DA</span>
                      </div>

                      {/* Livraison */}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#a0a09a] flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          Livraison
                          {deliveryConfig?.services[selectedService]?.name && form.wilaya && (
                            <span className="text-[#606060] text-[10px]">({deliveryConfig.services[selectedService].name})</span>
                          )}
                        </span>
                        <span className={freeShipping ? 'text-[#4ade80] font-medium' : deliveryPrice > 0 ? 'text-[#f5f5f0] font-medium' : 'text-[#606060]'}>
                          {freeShipping
                            ? 'Gratuite ✓'
                            : deliveryPrice > 0
                              ? `${formatPrice(deliveryPrice)} DA`
                              : form.wilaya
                                ? 'À confirmer'
                                : 'Selon wilaya'
                          }
                        </span>
                      </div>

                      {/* Free shipping banner */}
                      {freeShipping && (
                        <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-md px-3 py-2">
                          <p className="text-[10px] text-[#4ade80]">
                            Livraison gratuite ! Votre commande dépasse {formatPrice(deliveryConfig?.global_settings.free_shipping_min_amount || 0)} DA
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                        <span className="text-[#f5f5f0] font-semibold text-[15px]">Total à payer</span>
                        <span className="text-xl font-bold text-[#c9a84c]">
                          {product ? formatPrice(total) : '—'} <span className="text-[10px] text-[#606060] font-normal">DA</span>
                        </span>
                      </div>

                      {/* Payment method */}
                      <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-md px-3 py-2.5 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
                        <p className="text-[10px] text-[#4ade80] font-medium">Paiement à la livraison — Vous ne payez qu&apos;à la réception</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !product || !form.name || !form.phone || !form.wilaya || !form.commune}
                    className={`w-full py-4 rounded-xl text-[13px] font-bold tracking-[2px] uppercase transition-all duration-300 ${
                      submitting || !product || !form.name || !form.phone || !form.wilaya || !form.commune
                        ? 'bg-white/5 text-[#606060] cursor-not-allowed'
                        : 'bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] shadow-[0_4px_24px_rgba(201,168,76,0.3)] active:scale-[0.98]'
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0800] border-t-transparent" />
                        Traitement en cours...
                      </span>
                    ) : (
                      'Commander'
                    )}
                  </button>

                  <p className="text-center text-[10px] text-[#505050] leading-relaxed">
                    Vous serez contacté par téléphone pour confirmer votre commande.
                    Aucun paiement en ligne — paiement à la livraison uniquement.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
