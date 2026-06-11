'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Truck, Shield, CheckCircle2, CreditCard, Banknote, Landmark, MessageCircle, Minus, Plus, Trash2 } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PaymentMethod } from '@/lib/types'

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
  'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
  'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
  'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
  'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane', 'El M\'Ghair', 'El Meniaa', 'Ouled Djellal', 'Bordj Badji Mokhtar',
  'Béni Abbès', 'Timimoun', 'Touggourt', 'Djanet', 'In Salah', 'In Guezzam',
]

// Map icon string to Lucide icon component
function PaymentIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case 'credit-card':
      return <CreditCard className={className} />
    case 'paypal':
      return <span className={`font-bold ${className?.replace('w-5 h-5', '')}`} style={{ fontSize: '15px' }}>P</span>
    case 'ccp':
    case 'building':
    case 'landmark':
      return <Landmark className={className} />
    case 'banknote':
    default:
      return <Banknote className={className} />
  }
}

// Fallback payment methods if API fails
const FALLBACK_METHODS: PaymentMethod[] = [
  {
    id: 0,
    name: 'Paiement à la livraison',
    slug: 'cod',
    description: 'Payez en espèces à la réception de votre commande',
    icon: 'banknote',
    type: 'offline',
    config: {},
    enabled: true,
    sort_order: 1,
    created_at: '',
    updated_at: '',
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCart()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [upsellProducts, setUpsellProducts] = useState<Array<Record<string, unknown>>>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(FALLBACK_METHODS)
  const [selectedPaymentSlug, setSelectedPaymentSlug] = useState<string>('cod')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
  })

  const total = getCartTotal()

  // Redirect if cart is empty (except on confirmation step)
  useEffect(() => {
    if (items.length === 0 && step < 4) {
      router.push('/catalogue')
    }
  }, [items.length, step, router])

  // Fetch payment methods
  useEffect(() => {
    fetch('/api/payment-methods')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPaymentMethods(data)
          // Auto-select first method if only one available
          if (data.length === 1) {
            setSelectedPaymentSlug(data[0].slug)
          } else {
            // Select first enabled method
            setSelectedPaymentSlug(data[0].slug)
          }
        }
      })
      .catch(() => {
        // Fallback to COD only
        setPaymentMethods(FALLBACK_METHODS)
        setSelectedPaymentSlug('cod')
      })
  }, [])

  // Fetch upsell products
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5)
          setUpsellProducts(shuffled.slice(0, 3))
        }
      })
      .catch(() => {})
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ').format(price)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const selectedPaymentMethod = paymentMethods.find(m => m.slug === selectedPaymentSlug)

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    try {
      const productNames = items.map(i => i.name).join(', ')
      const notes = items.map(i => `${i.name} x${i.quantity}${Object.keys(i.attributes).length > 0 ? ` (${Object.entries(i.attributes).map(([k,v]) => `${k}: ${v}`).join(', ')})` : ''}`).join('\n')

      const paymentLabel = selectedPaymentMethod?.name || selectedPaymentSlug

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          wilaya: form.wilaya,
          commune: form.commune,
          product: productNames,
          product_id: items[0]?.product_id || null,
          quantity: items.reduce((sum, i) => sum + i.quantity, 0),
          notes: `Commande panier:\n${notes}\nMéthode paiement: ${paymentLabel}\nTotal: ${total} DZD`,
          source: 'checkout',
          total: total,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setOrderId(data.id || `ORD-${Date.now()}`)
        clearCart()
        setStep(4)
      } else {
        alert(data.error || 'Erreur lors de la commande.')
      }
    } catch {
      alert('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour, j'ai passé la commande #${orderId}. Je souhaite avoir plus d'informations.`
    )
    window.open(`https://wa.me/213XXXXXXXXX?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      <main className="pt-[72px] flex-1">
        {/* Header */}
        <section className="py-10 md:py-14 border-b border-white/[0.08]">
          <div className="max-w-[900px] mx-auto px-6">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 text-[12px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au catalogue
            </Link>
            <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
              Checkout
            </div>
            <h1 className="font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.1] text-[#f5f5f0] mb-4">
              Finaliser la Commande
            </h1>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 mt-6">
              {[
                { num: 1, label: 'Résumé' },
                { num: 2, label: 'Informations' },
                { num: 3, label: 'Paiement' },
                { num: 4, label: 'Confirmation' },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[1px] uppercase transition-all duration-200 ${
                      step >= s.num
                        ? 'bg-[#c9a84c] text-[#0a0800]'
                        : 'bg-[#1a1a1e] text-[#606060]'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-3 h-3" /> : s.num}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 3 && (
                    <div className={`w-6 h-[2px] ${step > s.num ? 'bg-[#c9a84c]' : 'bg-white/[0.08]'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Step Content */}
        <section className="py-10 md:py-14">
          <div className="max-w-[900px] mx-auto px-6">

            {/* Step 1: Order Summary */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-serif text-xl text-[#f5f5f0] mb-4">Résumé de la commande</h2>
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-[#111113] border border-white/[0.06] rounded-lg p-4 flex gap-4"
                  >
                    <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-[#1a1a1e]">
                      <img
                        src={item.image_url || '/images/watches/automatique-acier.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] tracking-[1.5px] uppercase text-[#c9a84c]">
                            {item.category}
                          </div>
                          <h3 className="text-[14px] font-medium text-[#f5f5f0]">{item.name}</h3>
                          {Object.keys(item.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.attributes).map(([key, value]) => (
                                <span key={key} className="text-[9px] text-[#606060] bg-[#1a1a1e] px-1.5 py-0.5 rounded">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-[#606060] hover:text-[#f87171] transition-colors p-1"
                          aria-label={`Supprimer ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm font-semibold text-[#f5f5f0]">
                          {formatPrice(item.price * item.quantity)}
                          <span className="text-[10px] text-[#606060] font-normal ml-1">DZD</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#1a1a1e] rounded-md px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[12px] text-[#f5f5f0] font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#a0a09a] hover:text-[#f5f5f0]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-5 flex items-center justify-between">
                  <span className="text-[#a0a09a] text-sm">Total</span>
                  <span className="text-2xl font-semibold text-[#f5f5f0]">
                    {formatPrice(total)}
                    <span className="text-xs text-[#606060] font-normal ml-1">DZD</span>
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-[#c9a84c] text-[#0a0800] py-3.5 rounded text-[12px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Info */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl text-[#f5f5f0] mb-4">Vos informations</h2>

                {/* Payment Info */}
                <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-lg p-4 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-[#c9a84c]" />
                    <span className="text-[12px] text-[#a0a09a]">Paiement Sécurisé</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-5 h-5 text-[#c9a84c]" />
                    <span className="text-[12px] text-[#a0a09a]">Livraison 58 Wilayas</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#f5f5f0] text-sm">
                      Nom complet <span className="text-[#c9a84c]">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom complet"
                      className="bg-[#111113] border-white/[0.1] text-[#f5f5f0] placeholder:text-[#606060] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#f5f5f0] text-sm">
                      Téléphone <span className="text-[#c9a84c]">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="05 XX XX XX XX"
                      className="bg-[#111113] border-white/[0.1] text-[#f5f5f0] placeholder:text-[#606060] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wilaya" className="text-[#f5f5f0] text-sm">
                        Wilaya <span className="text-[#c9a84c]">*</span>
                      </Label>
                      <select
                        id="wilaya"
                        name="wilaya"
                        value={form.wilaya}
                        onChange={handleChange}
                        required
                        className="w-full h-9 rounded-md border border-white/[0.1] bg-[#111113] px-3 py-1 text-sm text-[#f5f5f0] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                      >
                        <option value="" className="text-[#606060]">Sélectionner votre wilaya</option>
                        {WILAYAS.map((w) => (
                          <option key={w} value={w} className="bg-[#111113] text-[#f5f5f0]">
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commune" className="text-[#f5f5f0] text-sm">
                        Commune
                      </Label>
                      <Input
                        id="commune"
                        name="commune"
                        value={form.commune}
                        onChange={handleChange}
                        placeholder="Votre commune"
                        className="bg-[#111113] border-white/[0.1] text-[#f5f5f0] placeholder:text-[#606060] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="border border-white/[0.18] text-[#f5f5f0] px-6 py-3.5 rounded text-[11px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!form.name || !form.phone || !form.wilaya}
                    className="flex-1 bg-[#c9a84c] text-[#0a0800] py-3.5 rounded text-[12px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl text-[#f5f5f0] mb-4">Mode de paiement</h2>

                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const isSelected = selectedPaymentSlug === method.slug
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentSlug(method.slug)}
                        className={`w-full p-5 rounded-lg border text-left flex items-center gap-4 transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40'
                            : 'bg-[#111113] border-white/[0.06] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-[#c9a84c]' : 'bg-[#1a1a1e]'
                        }`}>
                          <PaymentIcon
                            icon={method.icon}
                            className={`w-5 h-5 ${isSelected ? 'text-[#0a0800]' : 'text-[#a0a09a]'}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-[#f5f5f0]">
                              {method.name}
                            </span>
                          </div>
                          {method.description && (
                            <div className="text-[12px] text-[#a0a09a] mt-0.5">
                              {method.description}
                            </div>
                          )}
                          {/* CCP details */}
                          {method.type === 'ccp' && method.config && (
                            <div className="mt-2 bg-[#1a1a1e] rounded-md p-3 space-y-1">
                              {(method.config as Record<string, string>).ccp_number && (
                                <div className="text-[11px] text-[#a0a09a]">
                                  <span className="text-[#c9a84c]">CCP:</span> {(method.config as Record<string, string>).ccp_number}
                                  {(method.config as Record<string, string>).ccp_key && (
                                    <span> — Clé: {(method.config as Record<string, string>).ccp_key}</span>
                                  )}
                                </div>
                              )}
                              {(method.config as Record<string, string>).baridimob_number && (
                                <div className="text-[11px] text-[#a0a09a]">
                                  <span className="text-[#c9a84c]">BaridiMob:</span> {(method.config as Record<string, string>).baridimob_number}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#c9a84c]' : 'border-white/[0.15]'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a84c]" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Order Total Recap */}
                <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#a0a09a] text-sm">Sous-total</span>
                    <span className="text-[#f5f5f0]">{formatPrice(total)} DZD</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#a0a09a] text-sm">Livraison</span>
                    <span className="text-[#4ade80] text-sm">Gratuite</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-2 mt-2 flex items-center justify-between">
                    <span className="text-[#f5f5f0] font-semibold">Total</span>
                    <span className="text-xl font-semibold text-[#c9a84c]">
                      {formatPrice(total)} DZD
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="border border-white/[0.18] text-[#f5f5f0] px-6 py-3.5 rounded text-[11px] font-semibold tracking-[2px] uppercase hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all duration-200"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || !selectedPaymentSlug}
                    className="flex-1 bg-[#c9a84c] text-[#0a0800] py-3.5 rounded text-[12px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Traitement en cours...' : 'Confirmer la commande'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 bg-[#4ade80]/15 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-[#4ade80]" />
                </div>

                <div>
                  <h2 className="font-serif text-2xl text-[#f5f5f0] mb-2">Commande confirmée !</h2>
                  <p className="text-[#a0a09a]">
                    Votre commande a été enregistrée avec succès.
                  </p>
                </div>

                <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6 max-w-md mx-auto">
                  <div className="text-[10px] tracking-[2px] uppercase text-[#c9a84c] font-semibold mb-2">
                    Numéro de commande
                  </div>
                  <div className="text-xl font-semibold text-[#f5f5f0] mb-4">{orderId}</div>
                  <p className="text-[13px] text-[#a0a09a]">
                    Notre équipe vous contactera sous 24h pour confirmer votre commande.
                    {selectedPaymentMethod?.type === 'cod' || selectedPaymentMethod?.type === 'offline'
                      ? ' Vous payez à la livraison, aucun paiement en ligne requis.'
                      : selectedPaymentMethod?.type === 'ccp'
                        ? ' Veuillez effectuer le virement via CCP ou BaridiMob et envoyer la preuve de paiement.'
                        : ''
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/"
                    className="bg-[#c9a84c] text-[#0a0800] px-8 py-3.5 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#e4c06a] transition-all duration-200 shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
                  >
                    Retour à l&apos;accueil
                  </Link>
                  <button
                    onClick={openWhatsApp}
                    className="border border-[#25D366]/30 text-[#25D366] px-8 py-3.5 rounded text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#25D366]/10 transition-all duration-200 flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter par WhatsApp
                  </button>
                </div>

                {/* Upsell Section */}
                {upsellProducts.length > 0 && (
                  <div className="pt-10 border-t border-white/[0.08] mt-10 text-left">
                    <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3 text-center">
                      Clients qui ont aimé...
                    </div>
                    <h3 className="font-serif text-lg text-[#f5f5f0] mb-6 text-center">
                      Vous aimerez aussi
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {upsellProducts.map((product) => (
                        <Link
                          key={product.id as number}
                          href={`/catalogue`}
                          className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden hover:border-[#c9a84c]/30 transition-all duration-200 group"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={(product.image_url as string) || '/images/watches/automatique-acier.jpg'}
                              alt={product.name as string}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3">
                            <div className="text-[9px] tracking-[1.5px] uppercase text-[#c9a84c]">
                              {product.category as string}
                            </div>
                            <div className="text-[13px] font-medium text-[#f5f5f0]">
                              {product.name as string}
                            </div>
                            <div className="text-sm font-semibold text-[#f5f5f0] mt-1">
                              {formatPrice(product.price as number)}
                              <span className="text-[9px] text-[#606060] font-normal ml-1">DZD</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

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
