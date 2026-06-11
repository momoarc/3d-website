'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Webhook, Plus, Trash2, Send, RefreshCw, Loader2,
  ExternalLink, CheckCircle2, XCircle, Clock, Zap, Activity,
} from 'lucide-react'
import { RoleGuard } from '@/components/admin/RoleGuard'
import { createClient } from '@/lib/supabase/client'
import type { Webhook as WebhookType, WebhookDelivery } from '@/lib/types'
import { WEBHOOK_EVENTS } from '@/lib/types'

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)

  // New webhook form
  const [showForm, setShowForm] = useState(false)
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])
  const [formSecret, setFormSecret] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Testing state
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<Record<number, { success: boolean; message: string }>>({})

  const fetchWebhooks = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setWebhooks(data as WebhookType[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDeliveries = useCallback(async () => {
    setDeliveriesLoading(true)
    try {
      const res = await fetch('/api/webhooks/deliveries?limit=30')
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data)
      }
    } catch {
      // silently fail
    } finally {
      setDeliveriesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
    fetchDeliveries()
  }, [fetchWebhooks, fetchDeliveries])

  const handleCreateWebhook = async () => {
    if (!formUrl || formEvents.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl,
          events: formEvents,
          secret: formSecret || null,
          active: formActive,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormUrl('')
        setFormEvents([])
        setFormSecret('')
        setFormActive(true)
        fetchWebhooks()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la création')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm('Supprimer ce webhook ?')) return
    try {
      const res = await fetch(`/api/webhooks/register?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchWebhooks()
        fetchDeliveries()
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (webhook: WebhookType) => {
    try {
      const res = await fetch('/api/webhooks/register', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: webhook.id, active: !webhook.active }),
      })
      if (res.ok) {
        fetchWebhooks()
      }
    } catch {
      // ignore
    }
  }

  const handleTestWebhook = async (webhook: WebhookType) => {
    setTestingId(webhook.id)
    setTestResult(prev => ({ ...prev, [webhook.id]: { success: false, message: 'Envoi en cours...' } }))
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_id: webhook.id }),
      })
      const data = await res.json()
      if (data.success) {
        setTestResult(prev => ({ ...prev, [webhook.id]: { success: true, message: `Succès (${data.status})` } }))
      } else {
        setTestResult(prev => ({ ...prev, [webhook.id]: { success: false, message: data.error || `Échec (${data.status || 'pas de réponse'})` } }))
      }
      fetchDeliveries()
    } catch {
      setTestResult(prev => ({ ...prev, [webhook.id]: { success: false, message: 'Erreur de connexion' } }))
    } finally {
      setTestingId(null)
    }
  }

  const toggleEvent = (eventValue: string) => {
    setFormEvents(prev =>
      prev.includes(eventValue)
        ? prev.filter(e => e !== eventValue)
        : [...prev, eventValue]
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEventLabel = (eventValue: string) => {
    const found = WEBHOOK_EVENTS.find(e => e.value === eventValue)
    return found?.label || eventValue
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f0] font-serif flex items-center gap-2">
              <Webhook className="h-6 w-6 text-[#c9a84c]" />
              Webhooks
            </h1>
            <p className="text-[#a0a09a] text-sm mt-1">
              Gérez les intégrations avec n8n, Zapier, Make et autres outils
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchWebhooks(); fetchDeliveries() }}
              className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0] hover:bg-white/[0.04]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#c9a84c]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#f5f5f0]">{webhooks.length}</div>
                <div className="text-xs text-[#606060]">Webhooks</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[#4ade80]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#f5f5f0]">{webhooks.filter(w => w.active).length}</div>
                <div className="text-xs text-[#606060]">Actifs</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111113] border-white/[0.06]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#f5f5f0]">{deliveries.length}</div>
                <div className="text-xs text-[#606060]">Livraisons récentes</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Webhook Form */}
        {showForm && (
          <Card className="bg-[#111113] border-[#c9a84c]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#c9a84c] flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">URL du webhook <span className="text-[#c9a84c]">*</span></Label>
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://n8n.example.com/webhook/xxxxx"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#a0a09a] text-xs">Événements <span className="text-[#c9a84c]">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <button
                      key={event.value}
                      type="button"
                      onClick={() => toggleEvent(event.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                        formEvents.includes(event.value)
                          ? 'bg-[#c9a84c] text-[#0a0800]'
                          : 'bg-[#1a1a1e] text-[#a0a09a] hover:bg-[#1a1a1e]/80 border border-white/[0.06]'
                      }`}
                    >
                      {event.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#606060]">Sélectionnez les événements qui déclencheront ce webhook</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[#a0a09a] text-xs">Secret (HMAC)</Label>
                <Input
                  value={formSecret}
                  onChange={(e) => setFormSecret(e.target.value)}
                  placeholder="whsec_... (optionnel, pour vérification HMAC)"
                  className="bg-[#08080a] border-white/[0.08] text-[#f5f5f0] placeholder:text-[#606060]"
                />
                <p className="text-[10px] text-[#606060]">Utilisé pour signer les payloads avec HMAC-SHA256</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#a0a09a] text-xs">Actif</Label>
                  <p className="text-[10px] text-[#606060]">Activer ou désactiver ce webhook</p>
                </div>
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreateWebhook}
                  disabled={submitting || !formUrl || formEvents.length === 0}
                  className="bg-[#c9a84c] hover:bg-[#e4c06a] text-[#0a0800] font-semibold"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Créer le webhook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-white/[0.08] text-[#a0a09a] hover:text-[#f5f5f0]"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks List */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Webhook className="h-4 w-4 text-[#c9a84c]" />
              Webhooks enregistrés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-[#606060]">Chargement...</div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Webhook className="h-12 w-12 text-[#606060] mx-auto mb-3" />
                <p className="text-[#606060]">Aucun webhook configuré</p>
                <p className="text-xs text-[#606060] mt-1">Ajoutez un webhook pour connecter vos outils d&apos;automatisation</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className={`bg-[#08080a] border rounded-lg p-4 transition-all duration-200 ${
                      webhook.active ? 'border-white/[0.06]' : 'border-white/[0.04] opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${webhook.active ? 'bg-[#4ade80]' : 'bg-[#606060]'}`} />
                          <span className="text-[13px] font-medium text-[#f5f5f0] truncate">
                            {webhook.url}
                          </span>
                          <a
                            href={webhook.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#606060] hover:text-[#c9a84c] transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map((event) => (
                            <Badge
                              key={event}
                              variant="outline"
                              className="text-[9px] border-[#c9a84c]/30 text-[#c9a84c] bg-[#c9a84c]/5 px-1.5 py-0"
                            >
                              {getEventLabel(event)}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-[#606060]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernier déclenchement: {formatDate(webhook.last_triggered_at)}
                          </span>
                          {webhook.secret && <span>HMAC configuré</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Test result */}
                        {testResult[webhook.id] && (
                          <span className={`text-[10px] px-2 py-1 rounded ${
                            testResult[webhook.id].success
                              ? 'text-[#4ade80] bg-[#4ade80]/10'
                              : 'text-[#f87171] bg-[#f87171]/10'
                          }`}>
                            {testResult[webhook.id].message}
                          </span>
                        )}
                        {/* Toggle */}
                        <Switch
                          checked={webhook.active}
                          onCheckedChange={() => handleToggleActive(webhook)}
                        />
                        {/* Test */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={testingId === webhook.id}
                          className="border-white/[0.08] text-[#a0a09a] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 h-8 px-2"
                        >
                          {testingId === webhook.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                        {/* Delete */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="border-white/[0.08] text-[#a0a09a] hover:text-[#f87171] hover:border-[#f87171]/30 hover:bg-[#f87171]/10 h-8 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-white/[0.06]" />

        {/* Delivery Log */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#c9a84c]" />
                Journal des livraisons
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDeliveries}
                className="text-[#606060] hover:text-[#f5f5f0] h-7"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? (
              <div className="text-center py-8 text-[#606060]">Chargement...</div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-[#606060]">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune livraison enregistrée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-[10px] tracking-[1px] uppercase text-[#606060] font-semibold pb-3 pr-4">Événement</th>
                      <th className="text-left text-[10px] tracking-[1px] uppercase text-[#606060] font-semibold pb-3 pr-4">Statut</th>
                      <th className="text-left text-[10px] tracking-[1px] uppercase text-[#606060] font-semibold pb-3 pr-4">Webhook ID</th>
                      <th className="text-left text-[10px] tracking-[1px] uppercase text-[#606060] font-semibold pb-3 pr-4">Réponse</th>
                      <th className="text-left text-[10px] tracking-[1px] uppercase text-[#606060] font-semibold pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="max-h-64 overflow-y-auto">
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4">
                          <Badge
                            variant="outline"
                            className="text-[9px] border-[#c9a84c]/30 text-[#c9a84c] bg-[#c9a84c]/5"
                          >
                            {delivery.event}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          {delivery.response_status && delivery.response_status >= 200 && delivery.response_status < 300 ? (
                            <span className="flex items-center gap-1 text-[#4ade80] text-xs">
                              <CheckCircle2 className="h-3 w-3" />
                              {delivery.response_status}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#f87171] text-xs">
                              <XCircle className="h-3 w-3" />
                              {delivery.response_status || 'Échec'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-[#606060] text-xs">#{delivery.webhook_id}</td>
                        <td className="py-2.5 pr-4 text-[#606060] text-xs max-w-[200px] truncate">
                          {delivery.response_body || '—'}
                        </td>
                        <td className="py-2.5 text-[#606060] text-xs whitespace-nowrap">
                          {formatDate(delivery.delivered_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Info */}
        <Card className="bg-[#111113] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#a0a09a] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#c9a84c]" />
              Guide d&apos;intégration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* n8n */}
              <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-4">
                <div className="text-xs font-bold text-[#f5f5f0] mb-2">n8n</div>
                <p className="text-[11px] text-[#606060] mb-3">Utilisez le noeud Webhook dans n8n pour recevoir les événements.</p>
                <code className="text-[10px] text-[#c9a84c] bg-[#1a1a1e] px-2 py-1 rounded block">
                  POST vers votre URL n8n
                </code>
              </div>
              {/* Zapier */}
              <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-4">
                <div className="text-xs font-bold text-[#f5f5f0] mb-2">Zapier</div>
                <p className="text-[11px] text-[#606060] mb-3">Créez un Zap avec un trigger &quot;Webhooks by Zapier&quot; — Catch Hook.</p>
                <code className="text-[10px] text-[#c9a84c] bg-[#1a1a1e] px-2 py-1 rounded block">
                  URL Zapier Catch Hook
                </code>
              </div>
              {/* Make */}
              <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-4">
                <div className="text-xs font-bold text-[#f5f5f0] mb-2">Make (Integromat)</div>
                <p className="text-[11px] text-[#606060] mb-3">Utilisez le module &quot;Custom Webhook&quot; pour recevoir les événements.</p>
                <code className="text-[10px] text-[#c9a84c] bg-[#1a1a1e] px-2 py-1 rounded block">
                  URL Make Custom Hook
                </code>
              </div>
            </div>

            <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-4">
              <div className="text-xs font-bold text-[#f5f5f0] mb-2">Format du payload</div>
              <pre className="text-[10px] text-[#a0a09a] bg-[#1a1a1e] p-3 rounded overflow-x-auto">
{`{
  "event": "order.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": { ... données de l'événement ... },
  "site": "maison-doree"
}`}
              </pre>
              <p className="text-[10px] text-[#606060] mt-2">
                Si un secret HMAC est configuré, vérifiez l&apos;en-tête <code className="text-[#c9a84c]">X-Webhook-Signature</code> avec HMAC-SHA256.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
