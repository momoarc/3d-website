import { createClient } from '@/lib/supabase/server'

export type WebhookEvent =
  | 'order.created'
  | 'order.status_changed'
  | 'cart.abandoned'
  | 'stock.low'
  | 'user.registered'

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'order.created', label: 'Commande créée', description: 'Déclenché quand une nouvelle commande est passée' },
  { value: 'order.status_changed', label: 'Statut modifié', description: 'Déclenché quand le statut d\'une commande change' },
  { value: 'cart.abandoned', label: 'Panier abandonné', description: 'Déclenché quand un panier est détecté comme abandonné' },
  { value: 'stock.low', label: 'Stock bas', description: 'Déclenché quand un produit est marqué indisponible' },
  { value: 'user.registered', label: 'Utilisateur inscrit', description: 'Déclenché quand un nouvel utilisateur s\'inscrit' },
]

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  site: string
}

interface WebhookRow {
  id: number
  url: string
  events: string[]
  secret: string | null
  active: boolean
  last_triggered_at: string | null
  created_at: string
}

/**
 * Fire a webhook event to all registered webhook URLs that subscribe to this event.
 * This is designed to be called server-side only.
 */
export async function fireEvent(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  try {
    const supabase = await createClient()

    // Get all active webhooks that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('active', true)

    if (error) {
      console.error('[Webhooks] Error fetching webhooks:', error)
      return
    }

    if (!webhooks || webhooks.length === 0) return

    // Filter webhooks that subscribe to this event
    const matchingWebhooks = (webhooks as WebhookRow[]).filter(
      (w) => w.events.includes(event) || w.events.includes('*')
    )

    if (matchingWebhooks.length === 0) return

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      site: 'maison-doree',
    }

    // Fire all webhooks in parallel (non-blocking)
    await Promise.allSettled(
      matchingWebhooks.map(async (webhook) => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Site': 'maison-doree',
            'X-Webhook-Timestamp': payload.timestamp,
          }

          // Add HMAC signature if secret is configured
          if (webhook.secret) {
            const signature = await generateHMAC(JSON.stringify(payload), webhook.secret)
            headers['X-Webhook-Signature'] = signature
          }

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          })

          clearTimeout(timeout)

          // Log delivery
          let responseBody: string | null = null
          try {
            responseBody = await response.text()
            // Truncate large responses
            if (responseBody && responseBody.length > 2000) {
              responseBody = responseBody.substring(0, 2000)
            }
          } catch {
            // Ignore body read errors
          }

          await supabase.from('webhook_deliveries').insert({
            webhook_id: webhook.id,
            event,
            payload: payload as unknown as Record<string, unknown>,
            response_status: response.status,
            response_body: responseBody,
          })

          // Update last_triggered_at
          await supabase
            .from('webhooks')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', webhook.id)
        } catch (err) {
          // Log failed delivery
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          console.error(`[Webhooks] Failed to deliver to ${webhook.url}:`, errorMessage)

          await supabase.from('webhook_deliveries').insert({
            webhook_id: webhook.id,
            event,
            payload: payload as unknown as Record<string, unknown>,
            response_status: 0,
            response_body: `Delivery failed: ${errorMessage}`,
          })
        }
      })
    )
  } catch (err) {
    console.error('[Webhooks] Error firing event:', err)
  }
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
async function generateHMAC(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Send a test webhook payload to a specific URL
 */
export async function sendTestWebhook(
  url: string,
  secret?: string | null
): Promise<{ success: boolean; status?: number; body?: string; error?: string }> {
  try {
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from Maison Dorée', test: true },
      site: 'maison-doree',
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'test',
      'X-Webhook-Site': 'maison-doree',
    }

    if (secret) {
      const signature = await generateHMAC(JSON.stringify(testPayload), secret)
      headers['X-Webhook-Signature'] = signature
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    let body = ''
    try {
      body = await response.text()
    } catch {
      // ignore
    }

    return { success: response.ok, status: response.status, body }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
