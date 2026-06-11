'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RoleGuard } from '@/components/admin/RoleGuard'
import TagInput from '@/components/ui/tag-input'
import { Save, Loader2, Eye, ShoppingBag, Users, Flame, Truck, Shield, Award, RotateCcw, X, Plus, Package, Clock, Heart, Star, CheckCircle2, Globe, Lock, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

const BADGE_ICON_OPTIONS = [
  { value: 'award', label: 'Award' },
  { value: 'shield', label: 'Shield' },
  { value: 'truck', label: 'Truck' },
  { value: 'package', label: 'Package' },
  { value: 'clock', label: 'Clock' },
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'gem', label: 'Gem' },
  { value: 'check', label: 'Check' },
  { value: 'globe', label: 'Globe' },
  { value: 'lock', label: 'Lock' },
  { value: 'refresh', label: 'Refresh' },
]

function BadgePreviewIcon({ icon }: { icon: string }) {
  const cls = 'w-4 h-4'
  switch (icon) {
    case 'award': return <Award className={cls} />
    case 'shield': return <Shield className={cls} />
    case 'truck': return <Truck className={cls} />
    case 'package': return <Package className={cls} />
    case 'clock': return <Clock className={cls} />
    case 'heart': return <Heart className={cls} />
    case 'star': return <Star className={cls} />
    case 'gem': return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    case 'check': return <CheckCircle2 className={cls} />
    case 'globe': return <Globe className={cls} />
    case 'lock': return <Lock className={cls} />
    case 'refresh': return <RefreshCw className={cls} />
    default: return <Award className={cls} />
  }
}

const DEFAULT_CONFIG: FomoConfig = {
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

export default function FomoAdminPage() {
  const [config, setConfig] = useState<FomoConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/fomo')
      .then(r => r.json())
      .then(data => {
        if (data) setConfig(data as FomoConfig)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/fomo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
  }

  const updateConfig = useCallback((key: keyof FomoConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  // Generate a preview purchase notification
  const previewPurchase = useCallback(() => {
    const name = config.recent_purchases_names[Math.floor(Math.random() * config.recent_purchases_names.length)]
    const wilaya = config.recent_purchases_wilayas[Math.floor(Math.random() * config.recent_purchases_wilayas.length)]
    return { name, wilaya, minutes: Math.floor(Math.random() * 25) + 2 }
  }, [config.recent_purchases_names, config.recent_purchases_wilayas])

  const preview = previewPurchase()
  const previewViewers = Math.floor(Math.random() * (config.viewers_counter_max - config.viewers_counter_min + 1)) + config.viewers_counter_min
  const previewOrders = Math.floor(Math.random() * (config.order_count_max - config.order_count_min + 1)) + config.order_count_min

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">FOMO & Social Proof</h1>
            <p className="text-[#a0a09a] text-sm mt-1">
              Configurez les éléments de preuve sociale et d&apos;urgence sur les pages produit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Réinitialiser
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold h-9"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : saved ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegardé ✓
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Configuration */}
          <div className="space-y-4">

            {/* Recent Purchases */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#c9a84c]" />
                    <CardTitle className="text-sm text-[#f5f5f0]">Achats récents</CardTitle>
                  </div>
                  <Switch
                    checked={config.recent_purchases_enabled}
                    onCheckedChange={(v) => updateConfig('recent_purchases_enabled', v)}
                  />
                </div>
              </CardHeader>
              {config.recent_purchases_enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Intervalle (secondes)</Label>
                    <Input
                      type="number"
                      value={config.recent_purchases_interval}
                      onChange={(e) => updateConfig('recent_purchases_interval', parseInt(e.target.value) || 20)}
                      className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                      min={5}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Pool de noms</Label>
                    <TagInput
                      value={config.recent_purchases_names}
                      onChange={(v) => updateConfig('recent_purchases_names', v)}
                      placeholder="Ajouter un nom..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Pool de wilayas</Label>
                    <TagInput
                      value={config.recent_purchases_wilayas}
                      onChange={(v) => updateConfig('recent_purchases_wilayas', v)}
                      placeholder="Ajouter une wilaya..."
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Viewers Counter */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#c9a84c]" />
                    <CardTitle className="text-sm text-[#f5f5f0]">Compteur de visiteurs</CardTitle>
                  </div>
                  <Switch
                    checked={config.viewers_counter_enabled}
                    onCheckedChange={(v) => updateConfig('viewers_counter_enabled', v)}
                  />
                </div>
              </CardHeader>
              {config.viewers_counter_enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Minimum</Label>
                      <Input
                        type="number"
                        value={config.viewers_counter_min}
                        onChange={(e) => updateConfig('viewers_counter_min', parseInt(e.target.value) || 3)}
                        className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Maximum</Label>
                      <Input
                        type="number"
                        value={config.viewers_counter_max}
                        onChange={(e) => updateConfig('viewers_counter_max', parseInt(e.target.value) || 28)}
                        className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                        min={config.viewers_counter_min}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Stock Urgency */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#f59e0b]" />
                    <CardTitle className="text-sm text-[#f5f5f0]">Urgence stock</CardTitle>
                  </div>
                  <Switch
                    checked={config.stock_urgency_enabled}
                    onCheckedChange={(v) => updateConfig('stock_urgency_enabled', v)}
                  />
                </div>
              </CardHeader>
              {config.stock_urgency_enabled && (
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[#a0a09a] text-xs">Utiliser le stock réel</Label>
                      <p className="text-[11px] text-[#606060]">Affiche le nombre réel d&apos;unités en stock au lieu d&apos;un nombre aléatoire</p>
                    </div>
                    <Switch
                      checked={config.stock_urgency_use_real}
                      onCheckedChange={(v) => updateConfig('stock_urgency_use_real', v)}
                    />
                  </div>
                  {!config.stock_urgency_use_real && (
                    <div className="space-y-2">
                      <Label className="text-[#a0a09a] text-xs">Seuil de stock affiché</Label>
                      <Input
                        type="number"
                        value={config.stock_urgency_threshold}
                        onChange={(e) => updateConfig('stock_urgency_threshold', parseInt(e.target.value) || 5)}
                        className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                        min={1}
                        max={50}
                      />
                      <p className="text-[11px] text-[#606060]">
                        &quot;Plus que X en stock !&quot; — un nombre aléatoire ≤ ce seuil sera affiché
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Order Count */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#c9a84c]" />
                    <CardTitle className="text-sm text-[#f5f5f0]">Compteur de commandes</CardTitle>
                  </div>
                  <Switch
                    checked={config.order_count_enabled}
                    onCheckedChange={(v) => updateConfig('order_count_enabled', v)}
                  />
                </div>
              </CardHeader>
              {config.order_count_enabled && (
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[#a0a09a] text-xs">Utiliser les commandes réelles</Label>
                      <p className="text-[11px] text-[#606060]">Affiche le nombre réel de commandes depuis la base de données</p>
                    </div>
                    <Switch
                      checked={config.order_count_use_real}
                      onCheckedChange={(v) => updateConfig('order_count_use_real', v)}
                    />
                  </div>
                  {config.order_count_use_real ? (
                    <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-md px-3 py-2">
                      <p className="text-[11px] text-[#c9a84c]">
                        Le nombre réel de commandes sera affiché
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#a0a09a] text-xs">Minimum</Label>
                        <Input
                          type="number"
                          value={config.order_count_min}
                          onChange={(e) => updateConfig('order_count_min', parseInt(e.target.value) || 12)}
                          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#a0a09a] text-xs">Maximum</Label>
                        <Input
                          type="number"
                          value={config.order_count_max}
                          onChange={(e) => updateConfig('order_count_max', parseInt(e.target.value) || 87)}
                          className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                          min={config.order_count_min}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Delivery Estimate */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#c9a84c]" />
                    <CardTitle className="text-sm text-[#f5f5f0]">Estimation de livraison</CardTitle>
                  </div>
                  <Switch
                    checked={config.delivery_estimate_enabled}
                    onCheckedChange={(v) => updateConfig('delivery_estimate_enabled', v)}
                  />
                </div>
              </CardHeader>
              {config.delivery_estimate_enabled && (
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-[#a0a09a] text-xs">Délai de livraison (jours)</Label>
                    <Input
                      type="number"
                      value={config.delivery_estimate_days}
                      onChange={(e) => updateConfig('delivery_estimate_days', parseInt(e.target.value) || 2)}
                      className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9"
                      min={1}
                      max={14}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Trust Badges */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#c9a84c]" />
                    <CardTitle className="text-sm text-[#f5f5f0]">Badges de confiance</CardTitle>
                  </div>
                  <Switch
                    checked={config.trust_badges_enabled}
                    onCheckedChange={(v) => updateConfig('trust_badges_enabled', v)}
                  />
                </div>
              </CardHeader>
              {config.trust_badges_enabled && (
                <CardContent className="space-y-3">
                  {config.trust_badges_items.map((badge, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={badge.icon}
                        onValueChange={(v) => {
                          const updated = [...config.trust_badges_items]
                          updated[index] = { ...updated[index], icon: v }
                          updateConfig('trust_badges_items', updated)
                        }}
                      >
                        <SelectTrigger className="w-[130px] bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111113] border-white/[0.08]">
                          {BADGE_ICON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[#f5f5f0] text-xs focus:bg-white/[0.06] focus:text-[#f5f5f0]">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={badge.label}
                        onChange={(e) => {
                          const updated = [...config.trust_badges_items]
                          updated[index] = { ...updated[index], label: e.target.value }
                          updateConfig('trust_badges_items', updated)
                        }}
                        className="flex-1 bg-[#08080a] border-white/[0.08] text-[#f5f5f0] h-9 text-xs"
                        placeholder="Label du badge"
                      />
                      <button
                        onClick={() => {
                          const updated = config.trust_badges_items.filter((_, i) => i !== index)
                          updateConfig('trust_badges_items', updated)
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[#606060] hover:text-[#f87171] hover:bg-[#f87171]/10 transition-colors"
                        aria-label="Supprimer le badge"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {config.trust_badges_items.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = [...config.trust_badges_items, { icon: 'award', label: '' }]
                        updateConfig('trust_badges_items', updated)
                      }}
                      className="w-full border-dashed border-white/[0.12] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04] h-9"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Ajouter un badge
                    </Button>
                  )}
                  {config.trust_badges_items.length >= 6 && (
                    <p className="text-[11px] text-[#606060] text-center">Maximum 6 badges atteint</p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <div className="sticky top-20">
              <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#c9a84c]" />
                  <span className="text-[11px] tracking-[1.5px] uppercase text-[#a0a09a] font-semibold">Aperçu en direct</span>
                </div>
                <div className="p-4 space-y-4 bg-[#08080a]">
                  {/* Preview: Recent Purchase */}
                  {config.recent_purchases_enabled && (
                    <div className="bg-[#111113] border border-[#c9a84c]/20 rounded-lg p-3 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#c9a84c]" />
                      </div>
                      <div>
                        <p className="text-[12px] text-[#f5f5f0] font-medium">
                          {preview.name} de {preview.wilaya}
                        </p>
                        <p className="text-[10px] text-[#a0a09a] mt-0.5">
                          vient de commander cette montre — il y a {preview.minutes} min
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview: Viewers */}
                  {config.viewers_counter_enabled && (
                    <div className="flex items-center gap-2 text-[11px] text-[#a0a09a]">
                      <Eye className="w-3.5 h-3.5 text-[#c9a84c]" />
                      <span>
                        <span className="text-[#c9a84c] font-semibold">{previewViewers}</span> personnes regardent ce produit en ce moment
                      </span>
                    </div>
                  )}

                  {/* Preview: Stock urgency */}
                  {config.stock_urgency_enabled && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
                      <span className="text-[#f59e0b] font-medium">
                        {config.stock_urgency_use_real
                          ? 'Plus que X en stock ! (stock réel)'
                          : `Plus que ${Math.min(config.stock_urgency_threshold, Math.floor(Math.random() * config.stock_urgency_threshold) + 1)} en stock !`
                        }
                      </span>
                    </div>
                  )}

                  {/* Preview: Order count */}
                  {config.order_count_enabled && (
                    <div className="flex items-center gap-2 text-[11px] text-[#a0a09a]">
                      <Users className="w-3.5 h-3.5 text-[#c9a84c]" />
                      <span>Ce produit a été commandé <span className="text-[#c9a84c] font-semibold">{config.order_count_use_real ? 'N (réel)' : previewOrders}</span> fois ce mois-ci</span>
                    </div>
                  )}

                  {/* Preview: Delivery */}
                  {config.delivery_estimate_enabled && (
                    <div className="flex items-center gap-2 text-[11px] text-[#a0a09a] bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-md px-3 py-2">
                      <Truck className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
                      <span>Livraison estimée: <span className="text-[#c9a84c] font-medium">
                        {(() => {
                          const d = new Date()
                          d.setDate(d.getDate() + config.delivery_estimate_days)
                          return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                        })()}
                      </span></span>
                    </div>
                  )}

                  {/* Preview: Trust badges */}
                  {config.trust_badges_enabled && config.trust_badges_items.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                      {config.trust_badges_items.map((badge, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5">
                          <span className="text-[#c9a84c]">
                            <BadgePreviewIcon icon={badge.icon} />
                          </span>
                          <span className="text-[9px] tracking-[0.5px] uppercase text-[#a0a09a] font-medium">{badge.label || '...'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!config.recent_purchases_enabled && !config.viewers_counter_enabled && !config.stock_urgency_enabled && !config.order_count_enabled && !config.delivery_estimate_enabled && !config.trust_badges_enabled && (
                    <p className="text-center text-[#606060] text-sm py-6">Aucun élément FOMO activé</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
