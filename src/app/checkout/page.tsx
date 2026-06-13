'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Truck, Shield, CheckCircle2, CreditCard, Banknote, Landmark,
  MessageCircle, Minus, Plus, Trash2, MapPin, Phone, Mail, User, Package, Clock, AlertCircle
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import { useCart } from '@/lib/cart-context'
import { Input } from '@/components/ui/input'
import { WILAYAS as WILAYAS_LIST, WILAYA_COMMUNES } from '@/lib/algeria-data'
import { DEFAULT_DELIVERY_CONFIG, type DeliveryConfig, type DeliveryService } from '@/lib/delivery-config'



export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG)
  const [selectedService, setSelectedService] = useState<string>('yalidine')
  const [selectedZone, setSelectedZone] = useState<string>('home')
  const [deliveryPrice, setDeliveryPrice] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    wilaya: '',
    commune: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = getCartTotal()

  // Redirect if cart is empty (except on confirmation)
  useEffect(() => {
    if (items.length === 0 && !submitted) {
      router.push('/catalogue')
    }
  }, [items.length, submitted, router])

  // Fetch delivery config
  useEffect(() => {
    fetch('/api/delivery')
      .then(r => r.json())
      .then(data => {
        if (data && data.services) {
          const hasPricing = Object.values(data.services as Record<string, DeliveryService>).some(
            s => s.enabled && Object.values(s.zones).some(z => Object.keys(z.wilayas).length > 0)
          )
          if (hasPricing) {
            setDeliveryConfig(data as DeliveryConfig)
          }
          const enabled = Object.entries(data.services as Record<string, DeliveryService>).find(([, s]) => s.enabled)
          if (enabled) setSelectedService(enabled[0])
        }
      })
      .catch(() => {})
  }, [])

  const availableCommunes = form.wilaya ? WILAYA_COMMUNES[parseInt(form.wilaya)] || [] : []
  const enabledServices = deliveryConfig ? Object.entries(deliveryConfig.services).filter(([, s]) => s.enabled) : []

  // Calculate delivery price
  useEffect(() => {
    if (!deliveryConfig || !form.wilaya || !selectedService) {
      setDeliveryPrice(0); setFreeShipping(false); return
    }
    const service = deliveryConfig.services[selectedService]
    if (!service) { setDeliveryPrice(0); setFreeShipping(false); return }

    if (deliveryConfig.global_settings.free_shipping_enabled && subtotal >= deliveryConfig.global_settings.free_shipping_min_amount) {
      setFreeShipping(true); setDeliveryPrice(0); return
    }
    setFreeShipping(false)

    if (service.pricing_type === 'flat') { setDeliveryPrice(service.flat_price); return }

    const wilayaCode = form.wilaya
    let price = 0
    if (selectedZone && service.zones[selectedZone]?.wilayas[wilayaCode] !== undefined) {
      price = service.zones[selectedZone].wilayas[wilayaCode]
    } else {
      for (const zone of Object.values(service.zones)) {
        if (zone.wilayas[wilayaCode] !== undefined) { price = zone.wilayas[wilayaCode]; break }
      }
    }
    setDeliveryPrice(price)
  }, [deliveryConfig, form.wilaya, selectedService, selectedZone, subtotal])

  const total = freeShipping ? subtotal : subtotal + deliveryPrice

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-DZ').format(price)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => { const next = { ...prev }; delete next[name]; return next })
    if (name === 'wilaya') {
      setForm(prev => ({ ...prev, commune: '' }))
      if (deliveryConfig.services[selectedService]?.pricing_type === 'zone') {
        for (const [zk, zone] of Object.entries(deliveryConfig.services[selectedService].zones)) {
          if (zone.wilayas[value] !== undefined) { setSelectedZone(zk); break }
        }
      }
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Le nom est obligatoire'
    if (!form.phone.trim()) e.phone = 'Le téléphone est obligatoire'
    else if (!/^0[5-7]\d{8}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Numéro invalide'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    if (!form.wilaya) e.wilaya = 'Sélectionnez votre wilaya'
    if (!form.commune && form.wilaya) e.commune = 'Sélectionnez votre commune'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setResult(null)
    try {
      const productNames = items.map(i => i.name).join(', ')
      const notes = items.map(i => `${i.name} x${i.quantity}${Object.keys(i.attributes).length > 0 ? ` (${Object.entries(i.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}`).join('\n')
      const selectedWilaya = WILAYAS_LIST.find(w => w.code.toString() === form.wilaya)
      const serviceName = deliveryConfig?.services[selectedService]?.name || selectedService

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          wilaya: selectedWilaya?.name || form.wilaya,
          commune: form.commune,
          product: productNames,
          product_id: items[0]?.product_id || null,
          quantity: items.reduce((sum, i) => sum + i.quantity, 0),
          delivery_service: serviceName,
          delivery_price: deliveryPrice,
          notes: `Commande panier:\n${notes}\nTotal: ${total} DZD`,
          source: 'checkout',
          total: total,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setOrderId(data.id || `ORD-${Date.now()}`)
        clearCart()
        setSubmitted(true)
      } else {
        setResult({ success: false, message: data.error || 'Erreur lors de la commande.' })
      }
    } catch {
      setResult({ success: false, message: 'Erreur de connexion.' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Confirmation ────────────────────────────────────────
  if (submitted) {
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
              <div className="text-xl font-semibold text-[#f5f5f0] mb-4">{orderId}</div>
              <p className="text-[13px] text-[#a0a09a]">Notre équipe vous contactera sous 24h pour confirmer. Paiement à la livraison uniquement.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/" className="bg-[#c9a84c] text-[#0a0800] px-8 py-3.5 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all shadow-[0_4px_24px_rgba(201,168,76,0.3)]">
                Retour à l&apos;accueil
              </Link>
              <Link href="/catalogue" className="border border-white/[0.18] text-[#f5f5f0] px-8 py-3.5 rounded text-[11px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Main Form — SINGLE PAGE ─────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      <main className="pt-[72px] flex-1">
        {/* Header */}
        <section className="py-6 md:py-8 border-b border-white/[0.08]">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <Link href="/catalogue" className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au catalogue
            </Link>
            <h1 className="font-serif text-[clamp(24px,4vw,36px)] font-medium leading-[1.1] text-[#f5f5f0]">
              Finaliser la Commande
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
          </div>
        </div>

        {/* Form */}
        <section className="py-6 md:py-10">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
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
              {/* LEFT: Form Fields (3/5) */}
              <div className="lg:col-span-3 space-y-5">
                {/* Cart Items */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#c9a84c]" />
                      <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Votre panier ({items.length})</h3>
                    </div>
                    <span className="text-[12px] text-[#c9a84c] font-semibold">{formatPrice(subtotal)} DA</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {items.map((item) => (
                      <div key={item.product_id} className="p-4 flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#08080a] border border-white/[0.06]">
                          <img src={item.image_url || '/images/watches/automatique-acier.jpg'} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#f5f5f0] truncate">{item.name}</p>
                              <p className="text-[12px] text-[#a0a09a]">{formatPrice(item.price)} DA</p>
                            </div>
                            <button onClick={() => removeFromCart(item.product_id)} className="text-[#606060] hover:text-[#f87171] transition-colors p-1 flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center bg-[#08080a] border border-white/[0.08] rounded-md overflow-hidden">
                              <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0]">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 h-7 flex items-center justify-center text-[12px] text-[#f5f5f0] font-medium">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0]">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[12px] text-[#f5f5f0] font-medium">{formatPrice(item.price * item.quantity)} DA</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Informations personnelles</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">Nom complet <span className="text-[#c9a84c]">*</span></label>
                      <Input name="name" value={form.name} onChange={handleChange} required placeholder="Ex: Mohamed Benali"
                        className={`bg-[#08080a] h-10 text-[#f5f5f0] placeholder:text-[#505050] ${errors.name ? 'border-[#f87171]' : 'border-white/[0.08] focus-visible:border-[#c9a84c]'} focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30`} />
                      {errors.name && <p className="text-[10px] text-[#f87171]">{errors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">Numéro de téléphone <span className="text-[#c9a84c]">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]" />
                        <Input name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="05 XX XX XX XX"
                          className={`bg-[#08080a] h-10 pl-10 text-[#f5f5f0] placeholder:text-[#505050] ${errors.phone ? 'border-[#f87171]' : 'border-white/[0.08] focus-visible:border-[#c9a84c]'} focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30`} />
                      </div>
                      {errors.phone && <p className="text-[10px] text-[#f87171]">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">Email <span className="text-[#606060]">(optionnel)</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]" />
                        <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="votre@email.com"
                          className={`bg-[#08080a] h-10 pl-10 text-[#f5f5f0] placeholder:text-[#505050] ${errors.email ? 'border-[#f87171]' : 'border-white/[0.08] focus-visible:border-[#c9a84c]'} focus-visible:ring-1 focus-visible:ring-[#c9a84c]/30`} />
                      </div>
                      {errors.email && <p className="text-[10px] text-[#f87171]">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#c9a84c]" />
                    <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Adresse de livraison</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">Wilaya <span className="text-[#c9a84c]">*</span></label>
                      <select name="wilaya" value={form.wilaya} onChange={handleChange} required
                        className={`w-full h-10 rounded-md border bg-[#08080a] px-3 py-2 text-[13px] text-[#f5f5f0] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30 ${errors.wilaya ? 'border-[#f87171]' : 'border-white/[0.08] focus:border-[#c9a84c]'}`}>
                        <option value="" className="text-[#505050]">Sélectionner votre wilaya</option>
                        {WILAYAS_LIST.map(w => (<option key={w.code} value={w.code.toString()} className="bg-[#111113]">{w.code} - {w.name}</option>))}
                      </select>
                      {errors.wilaya && <p className="text-[10px] text-[#f87171]">{errors.wilaya}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">Commune <span className="text-[#c9a84c]">*</span></label>
                      <select name="commune" value={form.commune} onChange={handleChange} required disabled={!form.wilaya}
                        className={`w-full h-10 rounded-md border bg-[#08080a] px-3 py-2 text-[13px] text-[#f5f5f0] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30 disabled:opacity-40 disabled:cursor-not-allowed ${errors.commune ? 'border-[#f87171]' : 'border-white/[0.08] focus:border-[#c9a84c]'}`}>
                        <option value="" className="text-[#505050]">{form.wilaya ? 'Sélectionner votre commune' : 'Sélectionnez d\'abord une wilaya'}</option>
                        {availableCommunes.map(c => (<option key={c} value={c} className="bg-[#111113]">{c}</option>))}
                      </select>
                      {errors.commune && <p className="text-[10px] text-[#f87171]">{errors.commune}</p>}
                    </div>
                    {/* Zone selector */}
                    {form.wilaya && (() => {
                      const service = deliveryConfig.services[selectedService]
                      if (!service || service.pricing_type !== 'zone') return null
                      const zones = Object.entries(service.zones).filter(([, z]) => z.wilayas[form.wilaya] !== undefined)
                      if (zones.length === 0) return null
                      return (
                        <div className="space-y-2">
                          <label className="text-[11px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">Type de livraison</label>
                          <div className="grid grid-cols-2 gap-2">
                            {zones.map(([zoneKey, zone]) => (
                              <button key={zoneKey} type="button" onClick={() => setSelectedZone(zoneKey)}
                                className={`p-3 rounded-lg border text-left transition-all ${selectedZone === zoneKey ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40' : 'bg-[#08080a] border-white/[0.06] hover:border-white/[0.15]'}`}>
                                <div className="text-[12px] font-semibold text-[#f5f5f0]">{zone.label}</div>
                                <div className="text-[11px] text-[#c9a84c] mt-0.5 font-medium">{formatPrice(zone.wilayas[form.wilaya])} DA</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* RIGHT: Récapitulatif (2/5) */}
              <div className="lg:col-span-2">
                <div className="sticky top-20 space-y-4">
                  <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#c9a84c]" />
                      <h3 className="text-[12px] font-semibold text-[#f5f5f0] uppercase tracking-[1.5px]">Récapitulatif</h3>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#a0a09a]">Sous-total</span>
                        <span className="text-[#f5f5f0] font-medium">{formatPrice(subtotal)} DA</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#a0a09a] flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Livraison</span>
                        <span className={freeShipping ? 'text-[#4ade80] font-medium' : deliveryPrice > 0 ? 'text-[#f5f5f0] font-medium' : 'text-[#606060]'}>
                          {freeShipping ? 'Gratuite ✓' : deliveryPrice > 0 ? `${formatPrice(deliveryPrice)} DA` : form.wilaya ? 'À confirmer' : 'Selon wilaya'}
                        </span>
                      </div>
                      <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                        <span className="text-[#f5f5f0] font-semibold text-[15px]">Total à payer</span>
                        <span className="text-xl font-bold text-[#c9a84c]">{formatPrice(total)} <span className="text-[10px] text-[#606060] font-normal">DA</span></span>
                      </div>
                      <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-md px-3 py-2.5 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
                        <p className="text-[10px] text-[#4ade80] font-medium">Paiement à la livraison — Vous ne payez qu&apos;à la réception</p>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting || items.length === 0 || !form.name || !form.phone || !form.wilaya || !form.commune}
                    className={`w-full py-4 rounded-xl text-[13px] font-bold tracking-[2px] uppercase transition-all duration-300 ${
                      submitting || items.length === 0 || !form.name || !form.phone || !form.wilaya || !form.commune
                        ? 'bg-white/5 text-[#606060] cursor-not-allowed'
                        : 'bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] shadow-[0_4px_24px_rgba(201,168,76,0.3)] active:scale-[0.98]'
                    }`}>
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0800] border-t-transparent" />
                        Traitement en cours...
                      </span>
                    ) : 'Commander'}
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
