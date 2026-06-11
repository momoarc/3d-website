/**
 * Notification Templates for Maison Dorée
 * 
 * Template-based notification system that generates structured data
 * which can be sent via webhook to email services (SendGrid, Mailgun, etc.)
 */

export interface NotificationTemplate {
  type: string
  subject: string
  html: string
  text: string
  data: Record<string, unknown>
}

const SITE_NAME = 'Maison Dorée'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://maisondoree.com'

/**
 * Order confirmation notification template
 */
export function orderConfirmationTemplate(order: {
  id: string
  name: string
  phone: string
  product: string | null
  quantity: number
  total: number | null
  wilaya: string | null
  commune: string | null
  notes: string | null
  source: string
}): NotificationTemplate {
  const items = order.product || 'Produit non spécifié'
  const totalDisplay = order.total ? `${new Intl.NumberFormat('fr-DZ').format(order.total)} DZD` : 'Prix à confirmer'
  const address = [order.commune, order.wilaya].filter(Boolean).join(', ') || 'Non spécifiée'

  return {
    type: 'order_confirmation',
    subject: `Confirmation de commande #${order.id} — ${SITE_NAME}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #08080a; color: #f5f5f0;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <h1 style="font-size: 28px; color: #c9a84c; margin: 0; letter-spacing: 3px;">${SITE_NAME}</h1>
          <p style="color: #a0a09a; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px;">Horlogerie de Luxe</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #f5f5f0; font-size: 22px;">Commande confirmée</h2>
          <p style="color: #a0a09a;">Bonjour ${order.name},</p>
          <p style="color: #a0a09a;">Votre commande a été enregistrée avec succès. Notre équipe vous contactera sous 24h pour confirmer les détails.</p>
          
          <div style="background: #111113; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #c9a84c; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 16px;">Détails de la commande</h3>
            <table style="width: 100%; color: #a0a09a; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #606060;">Numéro</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0; font-weight: 600;">${order.id}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Produit</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0;">${items}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Quantité</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0;">${order.quantity}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Total</td><td style="padding: 8px 0; text-align: right; color: #c9a84c; font-weight: 600; font-size: 18px;">${totalDisplay}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Livraison</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0;">${address}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Paiement</td><td style="padding: 8px 0; text-align: right; color: #4ade80;">À la livraison</td></tr>
            </table>
          </div>

          ${order.notes ? `<p style="color: #606060; font-size: 12px;">Notes: ${order.notes}</p>` : ''}
          
          <p style="color: #a0a09a; font-size: 13px; margin-top: 24px;">Vous payez à la livraison — aucun paiement en ligne requis.</p>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); color: #606060; font-size: 11px;">
          © ${new Date().getFullYear()} ${SITE_NAME}. Tous droits réservés.
        </div>
      </div>
    `,
    text: `Commande confirmée #${order.id}\n\nBonjour ${order.name},\n\nVotre commande a été enregistrée avec succès.\n\nDétails:\n- Numéro: ${order.id}\n- Produit: ${items}\n- Quantité: ${order.quantity}\n- Total: ${totalDisplay}\n- Livraison: ${address}\n- Paiement: À la livraison\n\nNotre équipe vous contactera sous 24h.\n\n${SITE_NAME}`,
    data: {
      order_id: order.id,
      customer_name: order.name,
      customer_phone: order.phone,
      product: order.product,
      quantity: order.quantity,
      total: order.total,
      wilaya: order.wilaya,
      commune: order.commune,
      source: order.source,
    },
  }
}

/**
 * Order status update notification template
 */
export function orderStatusUpdateTemplate(order: {
  id: string
  name: string
  phone: string
  status: string
  previousStatus: string
  product: string | null
}): NotificationTemplate {
  const statusLabels: Record<string, string> = {
    'Nouveau': 'Nouvelle commande',
    'Appelé': 'Appelé — En attente de confirmation',
    'Confirmé': 'Confirmée — En préparation',
    'Expédié': 'Expédiée — En route vers vous',
    'En transit': 'En transit',
    'Livré': 'Livrée — Merci pour votre confiance !',
    'Retourné': 'Retournée',
    'Annulé': 'Annulée',
  }

  const statusLabel = statusLabels[order.status] || order.status
  const isDelivered = order.status === 'Livré'
  const isCancelled = order.status === 'Annulé'

  return {
    type: 'order_status_update',
    subject: `Mise à jour commande #${order.id} — ${statusLabel}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #08080a; color: #f5f5f0;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <h1 style="font-size: 28px; color: #c9a84c; margin: 0; letter-spacing: 3px;">${SITE_NAME}</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: ${isDelivered ? '#4ade80' : isCancelled ? '#f87171' : '#f5f5f0'}; font-size: 22px;">
            ${statusLabel}
          </h2>
          <p style="color: #a0a09a;">Bonjour ${order.name},</p>
          <p style="color: #a0a09a;">Le statut de votre commande a été mis à jour.</p>
          
          <div style="background: #111113; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; color: #a0a09a; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #606060;">Commande</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0; font-weight: 600;">${order.id}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Produit</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0;">${order.product || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Ancien statut</td><td style="padding: 8px 0; text-align: right; color: #a0a09a;">${order.previousStatus}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Nouveau statut</td><td style="padding: 8px 0; text-align: right; color: ${isDelivered ? '#4ade80' : isCancelled ? '#f87171' : '#c9a84c'}; font-weight: 600;">${order.status}</td></tr>
            </table>
          </div>

          ${isDelivered ? '<p style="color: #4ade80;">Merci pour votre confiance ! Nous espérons que votre montre vous apporte toute la satisfaction attendue.</p>' : ''}
          ${isCancelled ? '<p style="color: #f87171;">Votre commande a été annulée. N\'hésitez pas à nous contacter pour toute question.</p>' : ''}
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); color: #606060; font-size: 11px;">
          © ${new Date().getFullYear()} ${SITE_NAME}. Tous droits réservés.
        </div>
      </div>
    `,
    text: `Mise à jour commande #${order.id}\n\nBonjour ${order.name},\n\nLe statut de votre commande a changé:\n- Ancien: ${order.previousStatus}\n- Nouveau: ${order.status}\n\n${SITE_NAME}`,
    data: {
      order_id: order.id,
      customer_name: order.name,
      customer_phone: order.phone,
      new_status: order.status,
      previous_status: order.previousStatus,
      product: order.product,
    },
  }
}

/**
 * Abandoned cart reminder notification template
 */
export function abandonedCartTemplate(cart: {
  customer_name: string
  customer_email?: string
  items: Array<{ name: string; price: number; quantity: number; image_url?: string }>
  cart_total: number
  abandoned_at: string
}): NotificationTemplate {
  const totalDisplay = `${new Intl.NumberFormat('fr-DZ').format(cart.cart_total)} DZD`
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)

  return {
    type: 'abandoned_cart',
    subject: `Votre sélection vous attend — ${SITE_NAME}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #08080a; color: #f5f5f0;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <h1 style="font-size: 28px; color: #c9a84c; margin: 0; letter-spacing: 3px;">${SITE_NAME}</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #f5f5f0; font-size: 22px;">Votre sélection vous attend</h2>
          <p style="color: #a0a09a;">Vous avez laissé ${itemCount} article${itemCount > 1 ? 's' : ''} dans votre panier. Ces pièces d'exception n'attendent que vous.</p>
          
          <div style="background: #111113; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; margin: 24px 0;">
            ${cart.items.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                <div>
                  <div style="color: #f5f5f0; font-size: 14px;">${item.name}</div>
                  <div style="color: #606060; font-size: 12px;">Qté: ${item.quantity}</div>
                </div>
                <div style="color: #c9a84c; font-size: 14px; font-weight: 600;">${new Intl.NumberFormat('fr-DZ').format(item.price * item.quantity)} DZD</div>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding-top: 16px; margin-top: 8px;">
              <span style="color: #f5f5f0; font-weight: 600;">Total</span>
              <span style="color: #c9a84c; font-weight: 600; font-size: 18px;">${totalDisplay}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${SITE_URL}/checkout" style="background: #c9a84c; color: #0a0800; padding: 14px 32px; text-decoration: none; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; border-radius: 4px; display: inline-block;">Finaliser la commande</a>
          </div>
        </div>
        <div style="padding: 24px; text-align: center; border-top: px solid rgba(255,255,255,0.08); color: #606060; font-size: 11px;">
          © ${new Date().getFullYear()} ${SITE_NAME}. Tous droits réservés.
        </div>
      </div>
    `,
    text: `Votre sélection vous attend\n\nVous avez laissé ${itemCount} article${itemCount > 1 ? 's' : ''} dans votre panier:\n\n${cart.items.map(i => `- ${i.name} x${i.quantity}: ${new Intl.NumberFormat('fr-DZ').format(i.price * i.quantity)} DZD`).join('\n')}\n\nTotal: ${totalDisplay}\n\nFinalisez votre commande: ${SITE_URL}/checkout\n\n${SITE_NAME}`,
    data: {
      customer_name: cart.customer_name,
      customer_email: cart.customer_email,
      items: cart.items,
      cart_total: cart.cart_total,
      item_count: itemCount,
      abandoned_at: cart.abandoned_at,
    },
  }
}

/**
 * Low stock alert notification template
 */
export function lowStockTemplate(product: {
  id: number
  name: string
  category: string
  price: number
  available: boolean
}): NotificationTemplate {
  return {
    type: 'low_stock_alert',
    subject: `Alerte stock — ${product.name} indisponible`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #08080a; color: #f5f5f0;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <h1 style="font-size: 28px; color: #c9a84c; margin: 0; letter-spacing: 3px;">${SITE_NAME}</h1>
        </div>
        <div style="padding: 32px;">
          <div style="background: #f87171/10; border: 1px solid #f87171/30; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h2 style="color: #f87171; font-size: 18px; margin: 0 0 8px;">Alerte Stock</h2>
            <p style="color: #a0a09a; margin: 0;">Un produit a été marqué comme indisponible.</p>
          </div>
          
          <div style="background: #111113; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 24px;">
            <table style="width: 100%; color: #a0a09a; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #606060;">Produit</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0; font-weight: 600;">${product.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Catégorie</td><td style="padding: 8px 0; text-align: right; color: #f5f5f0;">${product.category}</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Prix</td><td style="padding: 8px 0; text-align: right; color: #c9a84c;">${new Intl.NumberFormat('fr-DZ').format(product.price)} DZD</td></tr>
              <tr><td style="padding: 8px 0; color: #606060;">Disponibilité</td><td style="padding: 8px 0; text-align: right; color: #f87171; font-weight: 600;">Indisponible</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${SITE_URL}/admin/products" style="background: #c9a84c; color: #0a0800; padding: 14px 32px; text-decoration: none; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; border-radius: 4px; display: inline-block;">Gérer les produits</a>
          </div>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); color: #606060; font-size: 11px;">
          © ${new Date().getFullYear()} ${SITE_NAME}. Tous droits réservés.
        </div>
      </div>
    `,
    text: `Alerte Stock\n\nLe produit "${product.name}" (${product.category}) a été marqué comme indisponible.\n\nPrix: ${new Intl.NumberFormat('fr-DZ').format(product.price)} DZD\n\nGérer: ${SITE_URL}/admin/products\n\n${SITE_NAME}`,
    data: {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.price,
      available: product.available,
    },
  }
}
