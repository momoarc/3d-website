'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Shield, Truck, CheckCircle2, AlertCircle } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Royal Chronographe Or', category: 'Chronographes' },
  { id: 2, name: 'Suisse Automatique Acier', category: 'Automatiques' },
  { id: 3, name: 'Éclat Diamant Rose', category: 'Montres Diamant' },
  { id: 4, name: 'Héritage Classique Cuir', category: 'Classiques' },
  { id: 5, name: 'Abyss Plongeur Noir', category: 'Plongée' },
  { id: 6, name: 'Grand Squelette Tourbillon', category: 'Squelette' },
]

interface FormState {
  name: string
  phone: string
  wilaya: string
  commune: string
  product: string
  quantity: number
  notes: string
}

export default function CommanderPage() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    product: '',
    quantity: 1,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setProducts(data.map((p: any) => ({ id: p.id, name: p.name, category: p.category })))
        }
      })
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const selectedProduct = products.find(p => p.name === form.product)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          wilaya: form.wilaya,
          commune: form.commune,
          product: form.product,
          product_id: selectedProduct?.id || null,
          quantity: form.quantity,
          notes: form.notes,
          source: 'website',
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || 'Commande enregistrée avec succès !' })
        setForm({ name: '', phone: '', wilaya: '', commune: '', product: '', quantity: 1, notes: '' })
      } else {
        setResult({ success: false, message: data.error || 'Erreur lors de la soumission.' })
      }
    } catch {
      setResult({ success: false, message: 'Erreur de connexion. Veuillez réessayer.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      <Navbar />

      <main className="pt-[72px] flex-1">
        {/* Header */}
        <section className="py-12 md:py-16 border-b border-white/[0.08]">
          <div className="max-w-[800px] mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[12px] tracking-[1.5px] uppercase text-[#a0a09a] hover:text-[#c9a84c] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
            <div className="text-[10px] tracking-[4px] uppercase text-[#c9a84c] font-semibold mb-3">
              Commander
            </div>
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] font-medium leading-[1.1] text-[#f5f5f0] mb-4">
              Passer Commande
            </h1>
            <p className="text-[16px] text-[#a0a09a]">
              Remplissez le formulaire ci-dessous. Vous payez à la livraison, aucun paiement en ligne requis.
            </p>
          </div>
        </section>

        {/* COD Info Banner */}
        <section className="border-b border-white/[0.08]">
          <div className="max-w-[800px] mx-auto px-6 py-4">
            <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-lg p-4 flex flex-wrap gap-6">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#c9a84c]" />
                <span className="text-[12px] text-[#a0a09a]">Paiement à la Livraison</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#c9a84c]" />
                <span className="text-[12px] text-[#a0a09a]">Livraison 58 Wilayas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-[#c9a84c]" />
                <span className="text-[12px] text-[#a0a09a]">Confirmation par téléphone</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-12 md:py-16">
          <div className="max-w-[800px] mx-auto px-6">
            {result?.success && (
              <div className="mb-8 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-lg p-5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#f5f5f0] mb-1">Commande envoyée !</div>
                  <div className="text-[14px] text-[#a0a09a]">{result.message}</div>
                  <div className="text-[12px] text-[#606060] mt-2">
                    Notre équipe vous contactera sous 24h pour confirmer votre commande.
                  </div>
                </div>
              </div>
            )}

            {result && !result.success && (
              <div className="mb-8 bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#f87171] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#f5f5f0] mb-1">Erreur</div>
                  <div className="text-[14px] text-[#a0a09a]">{result.message}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
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

              {/* Phone */}
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

              {/* Wilaya + Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              {/* Product + Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-[#f5f5f0] text-sm">
                    Produit
                  </Label>
                  <select
                    id="product"
                    name="product"
                    value={form.product}
                    onChange={handleChange}
                    className="w-full h-9 rounded-md border border-white/[0.1] bg-[#111113] px-3 py-1 text-sm text-[#f5f5f0] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                  >
                    <option value="" className="text-[#606060]">Sélectionner un produit</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.name} className="bg-[#111113] text-[#f5f5f0]">
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-[#f5f5f0] text-sm">
                    Quantité
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    max={100}
                    value={form.quantity}
                    onChange={handleChange}
                    className="bg-[#111113] border-white/[0.1] text-[#f5f5f0] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[#f5f5f0] text-sm">
                  Notes / Instructions spéciales
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Préférence de bracelet, taille du boîtier, gravure..."
                  rows={4}
                  className="bg-[#111113] border-white/[0.1] text-[#f5f5f0] placeholder:text-[#606060] focus-visible:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#c9a84c] text-[#0a0800] hover:bg-[#e4c06a] text-[13px] font-bold tracking-[2px] uppercase py-6 shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi en cours...' : 'Confirmer la Commande (COD)'}
                </Button>
                <p className="text-center text-[11px] text-[#606060] mt-3">
                  Vous serez contacté par téléphone pour confirmer votre commande.
                  <br />
                  Aucun paiement en ligne requis.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* Phone CTA */}
        <section className="py-12 border-t border-white/[0.08] bg-gradient-to-br from-[#c9a84c]/8 to-transparent">
          <div className="max-w-[800px] mx-auto px-6 text-center">
            <p className="text-[14px] text-[#a0a09a] mb-4">
              Préférez-vous commander par téléphone ?
            </p>
            <a
              href="tel:+213XXXXXXXXX"
              className="inline-flex items-center gap-3 px-6 py-4 rounded-lg bg-[#1a1a1e] border border-white/[0.18] hover:border-[#c9a84c] hover:bg-[#c9a84c]/15 transition-all duration-200"
            >
              <Phone className="w-5 h-5 text-[#c9a84c]" />
              <div className="text-left">
                <div className="text-[10px] tracking-[2px] uppercase text-[#606060]">Appel direct</div>
                <div className="text-lg font-semibold text-[#f5f5f0]">+213 XX XX XX XX</div>
              </div>
            </a>
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
