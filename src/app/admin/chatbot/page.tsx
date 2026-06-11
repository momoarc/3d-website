'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageCircle,
  Save,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Send,
  Truck,
  Shield,
  ShoppingBag,
  Clock,
  Gem,
  Phone,
  X,
  Settings,
  Link2,
  Zap,
} from 'lucide-react'
import { RoleGuard } from '@/components/admin/RoleGuard'

interface QuickAction {
  label: string
  action: string
  response: string
}

interface FaqItem {
  key: string
  label: string
  icon: string
  response: string
}

interface ChatbotConfig {
  id: number
  greeting: string
  quick_actions: QuickAction[]
  faq_items: FaqItem[]
  whatsapp_message: string
  n8n_webhook_url: string | null
  n8n_enabled: boolean
}

const ACTION_TYPES = [
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'commander', label: 'Commander' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'custom', label: 'Personnalisé' },
]

const ICON_OPTIONS = [
  { value: 'truck', label: 'Camion', icon: <Truck className="w-3 h-3" /> },
  { value: 'shield', label: 'Bouclier', icon: <Shield className="w-3 h-3" /> },
  { value: 'shopping-bag', label: 'Sac', icon: <ShoppingBag className="w-3 h-3" /> },
  { value: 'clock', label: 'Horloge', icon: <Clock className="w-3 h-3" /> },
  { value: 'gem', label: 'Gemme', icon: <Gem className="w-3 h-3" /> },
  { value: 'phone', label: 'Téléphone', icon: <Phone className="w-3 h-3" /> },
]

const ICON_MAP: Record<string, React.ReactNode> = {
  truck: <Truck className="w-3 h-3" />,
  shield: <Shield className="w-3 h-3" />,
  'shopping-bag': <ShoppingBag className="w-3 h-3" />,
  clock: <Clock className="w-3 h-3" />,
  gem: <Gem className="w-3 h-3" />,
  phone: <Phone className="w-3 h-3" />,
}

const DEFAULT_CONFIG: ChatbotConfig = {
  id: 1,
  greeting: 'Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?',
  quick_actions: [
    { label: 'Voir les collections', action: 'catalogue', response: 'Découvrez notre collection complète de montres de luxe. Redirection en cours...' },
    { label: 'Passer commande', action: 'commander', response: 'Commandez facilement en remplissant notre formulaire. Paiement à la livraison ! Redirection en cours...' },
    { label: 'Parler à un conseiller', action: 'whatsapp', response: '' },
  ],
  faq_items: [
    { key: 'livraison', label: 'Livraison', icon: 'truck', response: '📦 Nous livrons dans les 58 wilayas d\'Algérie. Délai de livraison : 48h dans les grandes villes, 3-5 jours pour les autres wilayas.' },
    { key: 'garantie', label: 'Garantie', icon: 'shield', response: '🛡️ Toutes nos montres bénéficient d\'une garantie internationale de 3 ans.' },
    { key: 'paiement', label: 'Paiement', icon: 'shopping-bag', response: '💳 Nous proposons le paiement à la livraison (COD) sur toutes nos commandes.' },
    { key: 'authenticite', label: 'Authenticité', icon: 'clock', response: '✅ Toutes nos montres sont livrées avec un certificat d\'authenticité.' },
  ],
  whatsapp_message: 'Bonjour, je suis intéressé(e) par vos montres de luxe. Puis-je avoir plus d\'informations ?',
  n8n_webhook_url: null,
  n8n_enabled: false,
}

export default function ChatbotConfigPage() {
  const [config, setConfig] = useState<ChatbotConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Local editing state
  const [greeting, setGreeting] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [n8nEnabled, setN8nEnabled] = useState(false)
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('')
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chatbot_config')
        .select('*')
        .eq('id', 1)
        .single()

      if (!error && data) {
        const c = data as ChatbotConfig
        setConfig(c)
        setGreeting(c.greeting || '')
        setWhatsappMessage(c.whatsapp_message || '')
        setN8nEnabled(c.n8n_enabled || false)
        setN8nWebhookUrl(c.n8n_webhook_url || '')
        setQuickActions(c.quick_actions || [])
        setFaqItems(c.faq_items || [])
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/chatbot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          greeting,
          whatsapp_message: whatsappMessage,
          n8n_enabled: n8nEnabled,
          n8n_webhook_url: n8nWebhookUrl,
          quick_actions: quickActions,
          faq_items: faqItems,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      // Update local config for preview
      setConfig(prev => ({
        ...prev,
        greeting,
        whatsapp_message: whatsappMessage,
        n8n_enabled: n8nEnabled,
        n8n_webhook_url: n8nWebhookUrl,
        quick_actions: quickActions,
        faq_items: faqItems,
      }))

      alert('Configuration chatbot sauvegardée !')
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Quick Actions management
  const addQuickAction = () => {
    setQuickActions(prev => [...prev, { label: '', action: 'custom', response: '' }])
  }

  const removeQuickAction = (index: number) => {
    setQuickActions(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuickAction = (index: number, field: keyof QuickAction, value: string) => {
    setQuickActions(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const moveQuickAction = (index: number, direction: 'up' | 'down') => {
    setQuickActions(prev => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  // FAQ Items management
  const addFaqItem = () => {
    setFaqItems(prev => [...prev, { key: '', label: '', icon: 'truck', response: '' }])
  }

  const removeFaqItem = (index: number) => {
    setFaqItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateFaqItem = (index: number, field: keyof FaqItem, value: string) => {
    setFaqItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const moveFaqItem = (index: number, direction: 'up' | 'down') => {
    setFaqItems(prev => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  if (loading) {
    return <div className="text-center py-12 text-[#606060]">Chargement de la configuration chatbot...</div>
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Configuration Chatbot</h1>
            <p className="text-[#a0a09a] text-sm mt-1">Personnalisez les réponses et le comportement du chatbot</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfig}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Masquer' : 'Aperçu'}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
          {/* Left column: config forms */}
          <div className="space-y-6">

            {/* Section 1: General Settings */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[#c9a84c]" />
                  Paramètres généraux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Message d&apos;accueil</Label>
                  <Textarea
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] min-h-[80px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs">Message WhatsApp pré-rempli</Label>
                  <Textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Bonjour, je suis intéressé(e) par vos montres de luxe..."
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060] min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* n8n Integration */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#c9a84c]" />
                  Intégration n8n (IA & Automatisation)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#a0a09a] text-xs">Activer l&apos;intégration n8n</Label>
                    <p className="text-[10px] text-[#606060] mt-0.5">Envoyer les messages au workflow n8n pour des réponses IA</p>
                  </div>
                  <Switch checked={n8nEnabled} onCheckedChange={setN8nEnabled} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#a0a09a] text-xs flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    URL Webhook n8n
                  </Label>
                  <Input
                    value={n8nWebhookUrl}
                    onChange={(e) => setN8nWebhookUrl(e.target.value)}
                    placeholder="https://n8n.example.com/webhook/xxxxx"
                    className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                    disabled={!n8nEnabled}
                  />
                  <p className="text-[10px] text-[#606060]">Les messages seront envoyés en POST à cette URL. Réponse attendue en JSON: {`{"response": "text", "actions": [...]}`}</p>
                </div>
                {n8nEnabled && (
                  <Badge variant="outline" className="border-[#25D366]/30 text-[#25D366] text-[10px]">
                    Mode IA activé — les réponses locales servent de fallback
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Quick Actions */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    Actions rapides
                    <Badge variant="outline" className="border-white/[0.08] text-[#606060] text-[10px] ml-1">
                      {quickActions.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addQuickAction}
                    className="text-[#c9a84c] hover:text-[#e4c06a] hover:bg-[#c9a84c]/10 h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.length === 0 && (
                  <p className="text-[#606060] text-xs text-center py-4">Aucune action rapide. Cliquez sur &quot;Ajouter&quot; pour en créer une.</p>
                )}
                {quickActions.map((action, index) => (
                  <div key={index} className="bg-[#08080a] border border-white/[0.06] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-[#606060] cursor-grab" />
                        <span className="text-[10px] text-[#606060] font-mono">#{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveQuickAction(index, 'up')}
                          disabled={index === 0}
                          className="text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 text-xs px-1"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveQuickAction(index, 'down')}
                          disabled={index === quickActions.length - 1}
                          className="text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 text-xs px-1"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeQuickAction(index)}
                          className="text-[#606060] hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[#606060] text-[10px]">Label</Label>
                        <Input
                          value={action.label}
                          onChange={(e) => updateQuickAction(index, 'label', e.target.value)}
                          placeholder="Voir les collections"
                          className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs h-8 placeholder:text-[#606060]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#606060] text-[10px]">Type d&apos;action</Label>
                        <Select
                          value={action.action}
                          onValueChange={(val) => updateQuickAction(index, 'action', val)}
                        >
                          <SelectTrigger className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111113] border-white/[0.08]">
                            {ACTION_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value} className="text-[#f5f5f0] text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#606060] text-[10px]">Réponse du bot</Label>
                      <Textarea
                        value={action.response}
                        onChange={(e) => updateQuickAction(index, 'response', e.target.value)}
                        placeholder="Réponse affichée quand l'utilisateur clique..."
                        className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs min-h-[50px] placeholder:text-[#606060]"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section 3: FAQ Items */}
            <Card className="bg-[#111113] border-white/[0.06]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[#c9a84c]" />
                    Questions fréquentes
                    <Badge variant="outline" className="border-white/[0.08] text-[#606060] text-[10px] ml-1">
                      {faqItems.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addFaqItem}
                    className="text-[#c9a84c] hover:text-[#e4c06a] hover:bg-[#c9a84c]/10 h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqItems.length === 0 && (
                  <p className="text-[#606060] text-xs text-center py-4">Aucune FAQ. Cliquez sur &quot;Ajouter&quot; pour en créer une.</p>
                )}
                {faqItems.map((faq, index) => (
                  <div key={index} className="bg-[#08080a] border border-white/[0.06] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-[#606060] cursor-grab" />
                        {ICON_MAP[faq.icon] || <MessageCircle className="w-3 h-3 text-[#606060]" />}
                        <span className="text-[#f5f5f0] text-xs font-medium">{faq.label || 'Nouvelle FAQ'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveFaqItem(index, 'up')}
                          disabled={index === 0}
                          className="text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 text-xs px-1"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveFaqItem(index, 'down')}
                          disabled={index === faqItems.length - 1}
                          className="text-[#606060] hover:text-[#f5f5f0] disabled:opacity-30 text-xs px-1"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeFaqItem(index)}
                          className="text-[#606060] hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[#606060] text-[10px]">Clé (unique)</Label>
                        <Input
                          value={faq.key}
                          onChange={(e) => updateFaqItem(index, 'key', e.target.value)}
                          placeholder="livraison"
                          className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs h-8 placeholder:text-[#606060]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#606060] text-[10px]">Label</Label>
                        <Input
                          value={faq.label}
                          onChange={(e) => updateFaqItem(index, 'label', e.target.value)}
                          placeholder="Livraison"
                          className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs h-8 placeholder:text-[#606060]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[#606060] text-[10px]">Icône</Label>
                        <Select
                          value={faq.icon}
                          onValueChange={(val) => updateFaqItem(index, 'icon', val)}
                        >
                          <SelectTrigger className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111113] border-white/[0.08]">
                            {ICON_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-[#f5f5f0] text-xs">
                                <span className="flex items-center gap-2">
                                  {opt.icon}
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#606060] text-[10px]">Réponse</Label>
                      <Textarea
                        value={faq.response}
                        onChange={(e) => updateFaqItem(index, 'response', e.target.value)}
                        placeholder="Réponse affichée quand l'utilisateur clique sur cette FAQ..."
                        className="bg-[#1a1a1e] border-white/[0.06] text-[#f5f5f0] text-xs min-h-[50px] placeholder:text-[#606060]"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold h-11"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Sauvegarder la configuration
            </Button>
          </div>

          {/* Right column: Preview */}
          {showPreview && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <Label className="text-[#a0a09a] text-xs mb-3 block">Aperçu en direct</Label>
                <ChatPreview
                  greeting={greeting}
                  quickActions={quickActions}
                  faqItems={faqItems}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}

// Mini chat preview component
function ChatPreview({
  greeting,
  quickActions,
  faqItems,
}: {
  greeting: string
  quickActions: QuickAction[]
  faqItems: FaqItem[]
}) {
  return (
    <div className="bg-[#08080a] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-full">
      {/* Header */}
      <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">MD</span>
          </div>
          <div>
            <div className="text-white font-semibold text-[11px]">Maison Dorée</div>
            <div className="text-white/70 text-[9px] flex items-center gap-1">
              <span className="w-1 h-1 bg-white rounded-full inline-block" />
              En ligne
            </div>
          </div>
        </div>
        <button className="text-white/70 hover:text-white p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-2 max-h-[350px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {/* Greeting */}
        <div className="max-w-[85%] px-3 py-2 rounded-lg text-[11px] leading-relaxed bg-[#111113] text-[#f5f5f0] border border-white/[0.06]">
          {greeting || 'Bienvenue chez Maison Dorée ! 👋'}
        </div>

        {/* Quick actions */}
        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-1">
            {quickActions.map((action, i) => (
              <span
                key={i}
                className="bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] px-2 py-1 rounded text-[9px] font-semibold"
              >
                {action.label || 'Action'}
              </span>
            ))}
          </div>
        )}

        {/* Sample user message */}
        <div className="max-w-[85%] px-3 py-2 rounded-lg text-[11px] bg-[#25D366]/15 text-[#f5f5f0] ml-auto border border-[#25D366]/20">
          Livraison
        </div>

        {/* Sample bot response */}
        {faqItems.length > 0 && (
          <div className="max-w-[85%] px-3 py-2 rounded-lg text-[11px] leading-relaxed bg-[#111113] text-[#f5f5f0] border border-white/[0.06]">
            {faqItems[0]?.response || 'Réponse de la FAQ...'}
          </div>
        )}

        {/* FAQ buttons */}
        {faqItems.length > 0 && (
          <div className="pt-1 border-t border-white/[0.06]">
            <div className="text-[8px] tracking-[2px] uppercase text-[#606060] mb-1.5">
              Questions fréquentes
            </div>
            <div className="flex flex-wrap gap-1">
              {faqItems.map((faq, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-[#1a1a1e] border border-white/[0.06] text-[#a0a09a] px-2 py-1 rounded text-[9px]"
                >
                  {ICON_MAP[faq.icon] || <MessageCircle className="w-2.5 h-2.5" />}
                  {faq.label || 'FAQ'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-2 flex items-center gap-1.5">
        <div className="flex-1 bg-[#111113] border border-white/[0.08] text-[#606060] text-[10px] rounded px-2 py-1.5">
          Écrivez un message...
        </div>
        <div className="w-7 h-7 bg-[#25D366] rounded flex items-center justify-center text-white flex-shrink-0">
          <Send className="w-3 h-3" />
        </div>
      </div>

      {/* WhatsApp button */}
      <div className="border-t border-white/[0.06] p-2">
        <div className="bg-[#25D366] text-white py-2 rounded text-[9px] font-bold tracking-[1px] uppercase flex items-center justify-center gap-1">
          <MessageCircle className="w-3 h-3" />
          Ouvrir WhatsApp
        </div>
      </div>
    </div>
  )
}
