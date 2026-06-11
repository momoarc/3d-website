'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Phone, Shield, Truck, CheckCircle2, AlertCircle, Minus, Plus, MapPin, Mail, User } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WILAYAS, WILAYA_COMMUNES } from '@/lib/algeria-data'

// Types
interface DeliveryService {
  name: string
  enabled: boolean
  pricing_type: 'zone' | 'flat'
  flat_price: number
  zones: Record<string, { label: string; wilayas: Record<string, number> }>
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
  const productSlug = searchParams.get('product')

  const [product, setProduct] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig | null>(null)
  const [selectedService, setSelectedService] = useState<string>('')
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

  // Fetch product
  useEffect(() => {
    const id = productId || productSlug
    if (!id) {
      setLoading(false)
      return
    }
    fetch(`/api/products/${id}`)
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
  }, [productId, productSlug])

  // Fetch delivery config
  useEffect(() => {
    fetch('/api/delivery')
      .then(r => r.json())
      .then(data => {
        if (data && data.services) {
          setDeliveryConfig(data as DeliveryConfig)
          setSelectedService(data.global_settings?.default_service || 'yalidine')
        }
      })
      .catch(() => {})
  }, [])

  // Available communes based on selected wilaya
  const availableCommunes = form.wilaya
    ? WILAYA_COMMUNES[parseInt(form.wilaya)] || []
    : []

  // Available delivery services
  const enabledServices = deliveryConfig
    ? Object.entries(deliveryConfig.services).filter(([, s]) => s.enabled)
    : []

  // Calculate delivery price
  useEffect(() => {
    if (!deliveryConfig || !form.wilaya || !selectedService) {
      setDeliveryPrice(0)
      return
    }

    const service = deliveryConfig.services[selectedService]
    if (!service) { setDeliveryPrice(0); return }

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

    // Zone-based pricing
    const wilayaCode = form.wilaya
    let price = 0

    // If a specific zone is selected, check it first
    if (selectedZone && service.zones[selectedZone]) {
      const zone = service.zones[selectedZone]
      if (zone.wilayas[wilayaCode] !== undefined) {
        price = zone.wilayas[wilayaCode]
      }
    }

    // If not found in selected zone, search all zones
    if (price === 0) {
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
  const total = subtotal + deliveryPrice

  const productImage = product?.images?.[0] || product?.image_url || '/images/watches/automatique-acier.jpg'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Reset commune when wilaya changes
    if (name === 'wilaya') {
      setForm(prev => ({ ...prev, commune: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

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
          name: form.name,
          phone: form.phone,
          email: form.email || null,
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

  // Success state
  if (result?.success) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="max-w-md mx-auto px-6 text-center space-y-6 py-12">
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

  // No product specified
  if (!loading && !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08080a]">
        <Navbar />
        <main className="pt-[72px] flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-2xl text-[#f5f5f0]">Aucun produit sélectionné</h2>
            <p className="text-[#a0a09a]">Veuillez sélectionner un produit depuis le catalogue.</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      <main className="pt-[72px] flex-1">
        {/* Header */}
        <section className="py-8 md:py-10 border-b border-white/[0.08]">
          <div className="max-w-[900px] mx-auto px-6">
            <Link
              href={product ? `/produit/${product.id}` : '/catalogue'}
              className="inline-flex items-center gap-2 text-[12px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au produit
            </Link>
            <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-2">
              Commander
            </div>
            <h1 className="font-serif text-[clamp(28px,4vw,40px)] font-medium leading-[1.1] text-[#f5f5f0]">
              Passer Commande
            </h1>
          </div>
        </section>

        {/* Trust badges */}
        <section className="border-b border-white/[0.08]">
          <div className="max-w-[900px] mx-auto px-6 py-3">
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#c9a84c]" />
                <span className="text-[11px] text-[#a0a09a]">Paiement à la livraison</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#c9a84c]" />
                <span className="text-[11px] text-[#a0a09a]">Livraison 58 Wilayas</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#c9a84c]" />
                <span className="text-[11px] text-[#a0a09a]">Confirmation par téléphone</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Form */}
        <section className="py-8 md:py-12">
          <div className="max-w-[900px] mx-auto px-6">
            {result && !result.success && (
              <div className="mb-6 bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#f87171] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#f5f5f0] text-sm mb-0.5">Erreur</div>
                  <div className="text-[13px] text-[#a0a09a]">{result.message}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left: Form Fields (3/5) */}
              <div className="lg:col-span-3 space-y-5">
                {/* Personal Info */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[13px] font-semibold text-[#f5f5f0] uppercase tracking-[1px]">Informations personnelles</h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Nom complet <span className="text-[#c9a84c]">*</span></Label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom complet"
                      className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] h-10 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Numéro de téléphone <span className="text-[#c9a84c]">*</span></Label>
                    <Input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="05 XX XX XX XX"
                      className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] h-10 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]" />
                      <Input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="votre@email.com"
                        className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] h-10 pl-10 focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[13px] font-semibold text-[#f5f5f0] uppercase tracking-[1px]">Adresse de livraison</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Wilaya <span className="text-[#c9a84c]">*</span></Label>
                      <select
                        name="wilaya"
                        value={form.wilaya}
                        onChange={handleChange}
                        required
                        className="w-full h-10 rounded-md border border-white/[0.08] bg-[#08080a] px-3 py-2 text-sm text-[#f5f5f0] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                      >
                        <option value="" className="text-[#606060]">Sélectionner votre wilaya</option>
                        {WILAYAS.map(w => (
                          <option key={w.code} value={w.code.toString()} className="bg-[#111113] text-[#f5f5f0]">
                            {w.code} - {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Commune <span className="text-[#c9a84c]">*</span></Label>
                      <select
                        name="commune"
                        value={form.commune}
                        onChange={handleChange}
                        required
                        disabled={!form.wilaya}
                        className="w-full h-10 rounded-md border border-white/[0.08] bg-[#08080a] px-3 py-2 text-sm text-[#f5f5f0] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="text-[#606060]">
                          {form.wilaya ? 'Sélectionner votre commune' : 'Sélectionnez d\'abord une wilaya'}
                        </option>
                        {availableCommunes.map(c => (
                          <option key={c} value={c} className="bg-[#111113] text-[#f5f5f0]">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delivery type selector (Domicile / Stop Desk) */}
                  {form.wilaya && deliveryConfig?.services[selectedService]?.pricing_type === 'zone' && (
                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Type de livraison</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(deliveryConfig.services[selectedService]?.zones || {}).map(([zoneKey, zone]) => {
                          const hasPrice = zone.wilayas[form.wilaya] !== undefined
                          return (
                            <button
                              key={zoneKey}
                              type="button"
                              onClick={() => setSelectedZone(zoneKey)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                selectedZone === zoneKey
                                  ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40'
                                  : hasPrice
                                    ? 'bg-[#08080a] border-white/[0.06] hover:border-white/[0.15]'
                                    : 'bg-[#08080a] border-white/[0.06] opacity-40 cursor-not-allowed'
                              }`}
                              disabled={!hasPrice && selectedZone !== zoneKey}
                            >
                              <div className="text-[12px] font-semibold text-[#f5f5f0]">{zone.label}</div>
                              <div className="text-[11px] text-[#a0a09a] mt-0.5">
                                {hasPrice
                                  ? `${formatPrice(zone.wilayas[form.wilaya])} DA`
                                  : 'Non disponible'
                                }
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivery service selector */}
                  {enabledServices.length > 1 && form.wilaya && (
                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Service de livraison</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {enabledServices.map(([key, service]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedService(key)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedService === key
                                ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40'
                                : 'bg-[#08080a] border-white/[0.06] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className="text-[12px] font-semibold text-[#f5f5f0]">{service.name}</div>
                            <div className="text-[11px] text-[#a0a09a] mt-0.5">
                              {service.pricing_type === 'flat'
                                ? `${formatPrice(service.flat_price)} DA`
                                : deliveryPrice > 0 && selectedService === key
                                  ? `${formatPrice(deliveryPrice)} DA`
                                  : 'Prix selon zone'
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Order Summary (2/5) */}
              <div className="lg:col-span-2">
                <div className="sticky top-20 space-y-4">
                  {/* Product Card */}
                  <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                    {loading ? (
                      <div className="p-6 flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
                      </div>
                    ) : product && (
                      <>
                        {/* Product image */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-[#08080a]">
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-[1.5px] uppercase bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30 backdrop-blur-sm">
                              {product.category}
                            </span>
                          </div>
                        </div>

                        {/* Product info */}
                        <div className="p-4 space-y-3">
                          <h3 className="text-[16px] font-medium text-[#f5f5f0] font-serif">{product.name}</h3>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-semibold text-[#f5f5f0]">{formatPrice(product.price)}</span>
                            <span className="text-xs text-[#606060]">DA</span>
                            {product.compare_price && product.compare_price > product.price && (
                              <span className="text-sm text-[#606060] line-through ml-1">
                                {formatPrice(product.compare_price)} DA
                              </span>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                            <span className="text-[11px] tracking-[1px] uppercase text-[#a0a09a] font-semibold">Quantité</span>
                            <div className="flex items-center gap-0 bg-[#08080a] border border-white/[0.08] rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-9 h-9 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/5 transition-colors"
                                disabled={quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 h-9 flex items-center justify-center text-[#f5f5f0] font-medium text-[14px] border-x border-white/[0.08]">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-9 h-9 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/5 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  {product && (
                    <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#a0a09a]">Sous-total ({quantity} article{quantity > 1 ? 's' : ''})</span>
                        <span className="text-[#f5f5f0]">{formatPrice(subtotal)} DA</span>
                      </div>

                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#a0a09a] flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          Livraison
                          {deliveryConfig?.services[selectedService]?.name && form.wilaya && (
                            <span className="text-[#606060] text-[11px]">({deliveryConfig.services[selectedService].name})</span>
                          )}
                        </span>
                        <span className={freeShipping ? 'text-[#4ade80]' : deliveryPrice > 0 ? 'text-[#f5f5f0]' : 'text-[#606060]'}>
                          {freeShipping
                            ? 'Gratuite ✓'
                            : deliveryPrice > 0
                              ? `${formatPrice(deliveryPrice)} DA`
                              : form.wilaya
                                ? 'Non configuré'
                                : 'Selon wilaya'
                          }
                        </span>
                      </div>

                      {freeShipping && (
                        <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-md px-3 py-2">
                          <p className="text-[10px] text-[#4ade80]">
                            Livraison gratuite ! Votre commande dépasse {formatPrice(deliveryConfig?.global_settings.free_shipping_min_amount || 0)} DA
                          </p>
                        </div>
                      )}

                      <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                        <span className="text-[#f5f5f0] font-semibold text-[15px]">Total</span>
                        <span className="text-xl font-semibold text-[#c9a84c]">
                          {formatPrice(total)} <span className="text-xs text-[#606060] font-normal">DA</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting || !product || !form.name || !form.phone || !form.wilaya || !form.commune}
                    className="w-full bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] text-[12px] font-bold tracking-[2px] uppercase py-6 shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0800] border-t-transparent" />
                        Traitement en cours...
                      </span>
                    ) : (
                      'Confirmer la commande'
                    )}
                  </Button>

                  <p className="text-center text-[10px] text-[#606060] leading-relaxed">
                    Vous serez contacté par téléphone pour confirmer votre commande.
                    Aucun paiement en ligne requis — paiement à la livraison.
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
