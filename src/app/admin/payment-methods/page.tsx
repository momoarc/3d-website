'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  Banknote,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { RoleGuard } from '@/components/admin/RoleGuard'
import type { PaymentMethod } from '@/lib/types'

const ICON_OPTIONS = [
  { value: 'banknote', label: 'Banknote', component: <Banknote className="w-4 h-4" /> },
  { value: 'credit-card', label: 'Carte bancaire', component: <CreditCard className="w-4 h-4" /> },
  { value: 'paypal', label: 'PayPal (P)', component: <span className="font-bold text-sm">P</span> },
  { value: 'ccp', label: 'CCP', component: <Landmark className="w-4 h-4" /> },
  { value: 'building', label: 'Building', component: <Landmark className="w-4 h-4" /> },
]

const TYPE_OPTIONS = [
  { value: 'offline', label: 'Hors ligne (COD)' },
  { value: 'stripe', label: 'Stripe (Carte bancaire)' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'ccp', label: 'CCP / BaridiMob' },
  { value: 'baridimob', label: 'BaridiMob' },
  { value: 'custom', label: 'Personnalisé' },
]

function IconPreview({ icon, className }: { icon: string; className?: string }) {
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

interface FormData {
  name: string
  slug: string
  description: string
  icon: string
  type: string
  enabled: boolean
  sort_order: number
  config: Record<string, unknown>
}

const EMPTY_FORM: FormData = {
  name: '',
  slug: '',
  description: '',
  icon: 'banknote',
  type: 'offline',
  enabled: true,
  sort_order: 0,
  config: {},
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function PaymentMethodsAdminPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [previewMethod, setPreviewMethod] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [autoSlug, setAutoSlug] = useState(true)

  const fetchMethods = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!error && data) {
        setMethods(data as PaymentMethod[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  const handleNew = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, sort_order: methods.length + 1 })
    setAutoSlug(true)
    setDialogOpen(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id)
    setForm({
      name: method.name,
      slug: method.slug,
      description: method.description || '',
      icon: method.icon,
      type: method.type,
      enabled: method.enabled,
      sort_order: method.sort_order,
      config: method.config || {},
    })
    setAutoSlug(false)
    setDialogOpen(true)
  }

  const handleDelete = (method: PaymentMethod) => {
    setDeletingId(method.id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    setSaving(true)
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingId }),
      })
      if (res.ok) {
        setMethods(prev => prev.filter(m => m.id !== deletingId))
      }
    } catch {
      // error
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) return

    setSaving(true)
    try {
      if (editingId) {
        // Update
        const res = await fetch('/api/payment-methods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            icon: form.icon,
            type: form.type,
            enabled: form.enabled,
            sort_order: form.sort_order,
            config: form.config,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setMethods(prev => prev.map(m => m.id === editingId ? updated : m))
        }
      } else {
        // Create
        const res = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            icon: form.icon,
            type: form.type,
            enabled: form.enabled,
            sort_order: form.sort_order,
            config: form.config,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setMethods(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
        }
      }
      setDialogOpen(false)
    } catch {
      // error
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEnabled = async (method: PaymentMethod) => {
    const newEnabled = !method.enabled
    // Optimistic update
    setMethods(prev => prev.map(m => m.id === method.id ? { ...m, enabled: newEnabled } : m))
    try {
      await fetch('/api/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method.id, enabled: newEnabled }),
      })
    } catch {
      // Revert
      setMethods(prev => prev.map(m => m.id === method.id ? { ...m, enabled: method.enabled } : m))
    }
  }

  const handleMoveUp = async (method: PaymentMethod) => {
    const idx = methods.findIndex(m => m.id === method.id)
    if (idx <= 0) return
    const prevMethod = methods[idx - 1]
    // Optimistic swap
    const newMethods = [...methods]
    newMethods[idx] = { ...method, sort_order: prevMethod.sort_order }
    newMethods[idx - 1] = { ...prevMethod, sort_order: method.sort_order }
    setMethods(newMethods.sort((a, b) => a.sort_order - b.sort_order))
    // Update both
    try {
      await Promise.all([
        fetch('/api/payment-methods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: method.id, sort_order: prevMethod.sort_order }),
        }),
        fetch('/api/payment-methods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: prevMethod.id, sort_order: method.sort_order }),
        }),
      ])
    } catch {
      fetchMethods()
    }
  }

  const handleMoveDown = async (method: PaymentMethod) => {
    const idx = methods.findIndex(m => m.id === method.id)
    if (idx >= methods.length - 1) return
    const nextMethod = methods[idx + 1]
    const newMethods = [...methods]
    newMethods[idx] = { ...method, sort_order: nextMethod.sort_order }
    newMethods[idx + 1] = { ...nextMethod, sort_order: method.sort_order }
    setMethods(newMethods.sort((a, b) => a.sort_order - b.sort_order))
    try {
      await Promise.all([
        fetch('/api/payment-methods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: method.id, sort_order: nextMethod.sort_order }),
        }),
        fetch('/api/payment-methods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: nextMethod.id, sort_order: method.sort_order }),
        }),
      ])
    } catch {
      fetchMethods()
    }
  }

  const updateConfig = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }))
  }

  const handleNameChange = (name: string) => {
    setForm(prev => {
      const newForm = { ...prev, name }
      if (autoSlug) {
        newForm.slug = slugify(name)
      }
      return newForm
    })
  }

  const handlePreview = (method: PaymentMethod) => {
    setPreviewMethod(method)
    setPreviewDialogOpen(true)
  }

  const renderConfigFields = () => {
    switch (form.type) {
      case 'stripe':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">Stripe Publishable Key</Label>
              <Input
                value={(form.config.stripe_publishable_key as string) || ''}
                onChange={(e) => updateConfig('stripe_publishable_key', e.target.value)}
                placeholder="pk_live_..."
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">Stripe Secret Key</Label>
              <Input
                type="password"
                value={(form.config.stripe_secret_key as string) || ''}
                onChange={(e) => updateConfig('stripe_secret_key', e.target.value)}
                placeholder="sk_live_..."
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
              <p className="text-[10px] text-[#606060]">Clé masquée pour la sécurité</p>
            </div>
            <div className="bg-[#1a1a1e] rounded-md p-3 space-y-1.5">
              <p className="text-[11px] text-[#c9a84c] font-semibold">Instructions Stripe</p>
              <p className="text-[11px] text-[#a0a09a]">
                1. Créez un compte Stripe sur stripe.com
              </p>
              <p className="text-[11px] text-[#a0a09a]">
                2. Récupérez vos clés API dans le Dashboard → Developers → API keys
              </p>
              <p className="text-[11px] text-[#a0a09a]">
                3. Activez les webhooks Stripe pour les notifications de paiement
              </p>
            </div>
          </div>
        )
      case 'paypal':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">PayPal Client ID</Label>
              <Input
                value={(form.config.paypal_client_id as string) || ''}
                onChange={(e) => updateConfig('paypal_client_id', e.target.value)}
                placeholder="AXXXXX..."
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">PayPal Secret</Label>
              <Input
                type="password"
                value={(form.config.paypal_secret as string) || ''}
                onChange={(e) => updateConfig('paypal_secret', e.target.value)}
                placeholder="EXXXXX..."
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
            <div className="bg-[#1a1a1e] rounded-md p-3 space-y-1.5">
              <p className="text-[11px] text-[#c9a84c] font-semibold">Instructions PayPal</p>
              <p className="text-[11px] text-[#a0a09a]">
                1. Créez une application sur developer.paypal.com
              </p>
              <p className="text-[11px] text-[#a0a09a]">
                2. Récupérez le Client ID et Secret dans les credentials de l&apos;app
              </p>
              <p className="text-[11px] text-[#a0a09a]">
                3. Configurez le return URL et webhook URL
              </p>
            </div>
          </div>
        )
      case 'ccp':
      case 'baridimob':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">Numéro CCP</Label>
              <Input
                value={(form.config.ccp_number as string) || ''}
                onChange={(e) => updateConfig('ccp_number', e.target.value)}
                placeholder="0000000000"
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">Clé CCP</Label>
              <Input
                value={(form.config.ccp_key as string) || ''}
                onChange={(e) => updateConfig('ccp_key', e.target.value)}
                placeholder="00"
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">Numéro BaridiMob</Label>
              <Input
                value={(form.config.baridimob_number as string) || ''}
                onChange={(e) => updateConfig('baridimob_number', e.target.value)}
                placeholder="007999XXXXXX"
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
            </div>
            {/* CCP Preview */}
            <div className="bg-[#1a1a1e] rounded-md p-3 space-y-1.5">
              <p className="text-[11px] text-[#c9a84c] font-semibold">Aperçu client</p>
              <div className="bg-[#111113] border border-white/[0.06] rounded p-2.5">
                {(form.config.ccp_number as string) && (
                  <p className="text-[11px] text-[#a0a09a]">
                    <span className="text-[#c9a84c]">CCP:</span> {form.config.ccp_number as string}
                    {(form.config.ccp_key as string) && (
                      <span> — Clé: {form.config.ccp_key as string}</span>
                    )}
                  </p>
                )}
                {(form.config.baridimob_number as string) && (
                  <p className="text-[11px] text-[#a0a09a] mt-0.5">
                    <span className="text-[#c9a84c]">BaridiMob:</span> {form.config.baridimob_number as string}
                  </p>
                )}
                {!((form.config.ccp_number as string) || (form.config.baridimob_number as string)) && (
                  <p className="text-[11px] text-[#606060] italic">Aucune information CCP configurée</p>
                )}
              </div>
            </div>
          </div>
        )
      case 'custom':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[#a0a09a] text-xs">Webhook URL</Label>
              <Input
                value={(form.config.webhook_url as string) || ''}
                onChange={(e) => updateConfig('webhook_url', e.target.value)}
                placeholder="https://example.com/webhook/payment"
                className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
              />
              <p className="text-[10px] text-[#606060]">URL appelée quand ce mode de paiement est sélectionné</p>
            </div>
          </div>
        )
      default:
        return (
          <div className="bg-[#1a1a1e] rounded-md p-3">
            <p className="text-[11px] text-[#a0a09a]">Aucune configuration supplémentaire pour ce type.</p>
          </div>
        )
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[#606060]">Chargement des moyens de paiement...</div>
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Moyens de Paiement</h1>
            <p className="text-[#a0a09a] text-sm mt-1">Gérer les modes de paiement disponibles sur le site</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMethods}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button
              onClick={handleNew}
              size="sm"
              className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-3">
          {methods.map((method, idx) => (
            <Card key={method.id} className="bg-[#111113] border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(method)}
                      disabled={idx === 0}
                      className="p-0.5 text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Monter"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(method)}
                      disabled={idx === methods.length - 1}
                      className="p-0.5 text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Descendre"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1e] flex items-center justify-center flex-shrink-0">
                    <IconPreview icon={method.icon} className="w-5 h-5 text-[#a0a09a]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-[#f5f5f0]">{method.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-white/[0.1] text-[#606060]"
                      >
                        {method.type}
                      </Badge>
                      {!method.enabled && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-400"
                        >
                          Désactivé
                        </Badge>
                      )}
                    </div>
                    {method.description && (
                      <p className="text-[12px] text-[#a0a09a] mt-0.5 truncate">{method.description}</p>
                    )}
                    <p className="text-[10px] text-[#606060] mt-0.5">/{method.slug} · Ordre: {method.sort_order}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(method)}
                      className="p-2 text-[#606060] hover:text-[#c9a84c] transition-colors rounded-md hover:bg-white/[0.04]"
                      title="Aperçu client"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <Switch
                      checked={method.enabled}
                      onCheckedChange={() => handleToggleEnabled(method)}
                    />

                    <button
                      onClick={() => handleEdit(method)}
                      className="p-2 text-[#606060] hover:text-[#c9a84c] transition-colors rounded-md hover:bg-white/[0.04]"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(method)}
                      className="p-2 text-[#606060] hover:text-[#f87171] transition-colors rounded-md hover:bg-white/[0.04]"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CCP config preview in list */}
                {(method.type === 'ccp' || method.type === 'baridimob') && method.config && (
                  <div className="mt-3 ml-[72px] bg-[#08080a] rounded-md p-2.5 space-y-0.5">
                    {(method.config as Record<string, string>).ccp_number && (
                      <p className="text-[10px] text-[#a0a09a]">
                        <span className="text-[#c9a84c]">CCP:</span> {(method.config as Record<string, string>).ccp_number}
                        {(method.config as Record<string, string>).ccp_key && (
                          <span> — Clé: {(method.config as Record<string, string>).ccp_key}</span>
                        )}
                      </p>
                    )}
                    {(method.config as Record<string, string>).baridimob_number && (
                      <p className="text-[10px] text-[#a0a09a]">
                        <span className="text-[#c9a84c]">BaridiMob:</span> {(method.config as Record<string, string>).baridimob_number}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {methods.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-[#606060] mx-auto mb-3" />
            <p className="text-[#a0a09a]">Aucun moyen de paiement configuré</p>
            <Button
              onClick={handleNew}
              className="mt-4 bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un moyen de paiement
            </Button>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#111113] border-white/[0.08] text-[#f5f5f0] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingId ? 'Modifier le moyen de paiement' : 'Nouveau moyen de paiement'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Nom *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Paiement à la livraison"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => {
                      setAutoSlug(false)
                      setForm(prev => ({ ...prev, slug: e.target.value }))
                    }}
                    placeholder="cod"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description affichée au client..."
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Icône</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm(prev => ({ ...prev, icon: v }))}>
                    <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111113] border-white/[0.08]">
                      {ICON_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-[#f5f5f0] focus:bg-white/[0.06] focus:text-[#f5f5f0]">
                          <div className="flex items-center gap-2">
                            {opt.component}
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Type</Label>
                  <Select value={form.type} onValueChange={(v) => {
                    setForm(prev => ({ ...prev, type: v }))
                    // Reset config when type changes
                    if (v !== form.type) {
                      setForm(prev => ({ ...prev, type: v, config: {} }))
                    }
                  }}>
                    <SelectTrigger className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111113] border-white/[0.08]">
                      {TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-[#f5f5f0] focus:bg-white/[0.06] focus:text-[#f5f5f0]">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Ordre de tri</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-[#a0a09a] text-xs">Activé</Label>
                    <p className="text-[10px] text-[#606060] mt-0.5">Visible par les clients</p>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, enabled: v }))}
                  />
                </div>
              </div>

              {/* Dynamic config fields */}
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Configuration</Label>
                {renderConfigFields()}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name || !form.slug}
                className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Sauvegarder' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-[#111113] border-white/[0.08] text-[#f5f5f0]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Confirmer la suppression
              </DialogTitle>
            </DialogHeader>
            <p className="text-[#a0a09a] text-sm">
              Êtes-vous sûr de vouloir supprimer ce moyen de paiement ? Cette action est irréversible.
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="bg-[#111113] border-white/[0.08] text-[#f5f5f0] max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Aperçu client</DialogTitle>
            </DialogHeader>
            {previewMethod && (
              <div className="space-y-3">
                <p className="text-[10px] text-[#606060] uppercase tracking-widest">Ce que voit le client lors du checkout :</p>
                <div className="bg-[#08080a] rounded-lg p-4 border border-[#c9a84c]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
                      <IconPreview icon={previewMethod.icon} className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#f5f5f0]">{previewMethod.name}</p>
                      {previewMethod.description && (
                        <p className="text-[12px] text-[#a0a09a]">{previewMethod.description}</p>
                      )}
                    </div>
                  </div>
                  {(previewMethod.type === 'ccp' || previewMethod.type === 'baridimob') && previewMethod.config && (
                    <div className="mt-3 bg-[#1a1a1e] rounded-md p-2.5 space-y-1">
                      {(previewMethod.config as Record<string, string>).ccp_number && (
                        <p className="text-[11px] text-[#a0a09a]">
                          <span className="text-[#c9a84c]">CCP:</span> {(previewMethod.config as Record<string, string>).ccp_number}
                          {(previewMethod.config as Record<string, string>).ccp_key && (
                            <span> — Clé: {(previewMethod.config as Record<string, string>).ccp_key}</span>
                          )}
                        </p>
                      )}
                      {(previewMethod.config as Record<string, string>).baridimob_number && (
                        <p className="text-[11px] text-[#a0a09a]">
                          <span className="text-[#c9a84c]">BaridiMob:</span> {(previewMethod.config as Record<string, string>).baridimob_number}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
