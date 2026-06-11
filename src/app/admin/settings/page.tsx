'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Settings, Save, Loader2, RefreshCw, Building2, Monitor, Lock, MessageCircle, Webhook, Bell, Link2, Hash } from 'lucide-react'
import { RoleGuard } from '@/components/admin/RoleGuard'
import type { SiteSettings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Business info
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  // WhatsApp settings
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappGreeting, setWhatsappGreeting] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)

  // Pixel IDs
  const [metaPixel, setMetaPixel] = useState('')
  const [tiktokPixel, setTiktokPixel] = useState('')
  const [ga4Id, setGa4Id] = useState('')
  const [snapchatPixel, setSnapchatPixel] = useState('')

  // Webhooks & Integrations
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('')
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (!error && data) {
        const s = data as SiteSettings
        setSettings(s)
        setBusinessName(s.business_name || '')
        setPhone(s.phone || '')
        setEmail(s.email || '')
        setAddress(s.address || '')
        setMetaPixel(s.meta_pixel_id || '')
        setTiktokPixel(s.tiktok_pixel_id || '')
        setGa4Id(s.ga4_id || '')
        setSnapchatPixel(s.snapchat_pixel_id || '')
        setWhatsappNumber(s.whatsapp_number || '')
        setWhatsappGreeting(s.whatsapp_greeting || '')
        setWhatsappEnabled(s.whatsapp_enabled !== false)
        setWebhookEnabled(s.webhook_enabled === true)
        setWebhookSecret(s.webhook_secret || '')
        setNotificationEmail(s.notification_email || '')
        setN8nWebhookUrl(s.n8n_webhook_url || '')
        setSlackWebhookUrl(s.slack_webhook_url || '')
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('site_settings')
        .update({
          business_name: businessName,
          phone: phone || null,
          email: email || null,
          address: address || null,
          meta_pixel_id: metaPixel || null,
          tiktok_pixel_id: tiktokPixel || null,
          ga4_id: ga4Id || null,
          snapchat_pixel_id: snapchatPixel || null,
          whatsapp_number: whatsappNumber || null,
          whatsapp_greeting: whatsappGreeting || null,
          whatsapp_enabled: whatsappEnabled,
          webhook_enabled: webhookEnabled,
          webhook_secret: webhookSecret || null,
          notification_email: notificationEmail || null,
          n8n_webhook_url: n8nWebhookUrl || null,
          slack_webhook_url: slackWebhookUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (error) throw error
      alert('Paramètres sauvegardés !')
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordMsg('')
    if (newPassword.length < 6) {
      setPasswordMsg('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Les mots de passe ne correspondent pas')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMsg('Mot de passe mis à jour avec succès !')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg('Erreur: ' + (err as Error).message)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[#606060]">Chargement des paramètres...</div>
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif">Paramètres</h1>
            <p className="text-[#a0a09a] text-sm mt-1">Configuration du site</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Business Info */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#c9a84c]" />
              Informations entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Nom de l&apos;entreprise</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Téléphone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213 XXX XXX XXX"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maisondoree.com"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Adresse</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alger, Algérie"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Settings */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Configuration WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#a0a09a] text-xs">Activer le chat WhatsApp</Label>
                <p className="text-[10px] text-[#606060] mt-0.5">Afficher le bouton et le widget de chat sur le site</p>
              </div>
              <Switch
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Numéro WhatsApp Business</Label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+213XXXXXXXXX"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Message d&apos;accueil</Label>
                <Input
                  value={whatsappGreeting}
                  onChange={(e) => setWhatsappGreeting(e.target.value)}
                  placeholder="Bienvenue chez Maison Dorée ! 👋"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pixel IDs */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#c9a84c]" />
              Pixels & Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Meta Pixel ID</Label>
                <Input
                  value={metaPixel}
                  onChange={(e) => setMetaPixel(e.target.value)}
                  placeholder="1234567890"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">TikTok Pixel ID</Label>
                <Input
                  value={tiktokPixel}
                  onChange={(e) => setTiktokPixel(e.target.value)}
                  placeholder="ABCDEFGHIJ"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">GA4 Measurement ID</Label>
                <Input
                  value={ga4Id}
                  onChange={(e) => setGa4Id(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Snapchat Pixel ID</Label>
                <Input
                  value={snapchatPixel}
                  onChange={(e) => setSnapchatPixel(e.target.value)}
                  placeholder="1234-abcd-5678"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks & Integrations */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Webhook className="h-4 w-4 text-[#c9a84c]" />
              Webhooks & Intégrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#a0a09a] text-xs">Activer les webhooks</Label>
                <p className="text-[10px] text-[#606060] mt-0.5">Envoyer des événements aux URLs enregistrées quand des actions se produisent</p>
              </div>
              <Switch
                checked={webhookEnabled}
                onCheckedChange={setWebhookEnabled}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Secret Webhook (HMAC)
                </Label>
                <Input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_... (pour vérification HMAC-SHA256)"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
                <p className="text-[10px] text-[#606060]">Signe chaque payload avec HMAC-SHA256</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Email de notification
                </Label>
                <Input
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="admin@maisondoree.com"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
                <p className="text-[10px] text-[#606060]">Reçoit les alertes de livraison échouée</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                />
                <p className="text-[10px] text-[#606060]">Envoie tous les événements à ce workflow n8n</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  URL Webhook Slack
                </Label>
                <Input
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T.../B.../xxx"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
                <p className="text-[10px] text-[#606060]">Envoie les notifications vers un canal Slack</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold h-11"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder les paramètres
        </Button>

        <Separator className="bg-white/[0.06]" />

        {/* Password Change */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#c9a84c]" />
              Changer le mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>
            </div>
            {passwordMsg && (
              <p className={`text-xs ${passwordMsg.includes('succès') ? 'text-emerald-400' : 'text-red-400'}`}>
                {passwordMsg}
              </p>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword}
              variant="outline"
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              Changer le mot de passe
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
