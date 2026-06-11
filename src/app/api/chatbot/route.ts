import { NextResponse } from 'next/server'

// Default fallback config
const DEFAULT_CONFIG = {
  id: 1,
  greeting: 'Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?',
  quick_actions: [
    { label: 'Voir les collections', action: 'catalogue', response: 'Découvrez notre collection complète de montres de luxe. Redirection en cours...' },
    { label: 'Passer commande', action: 'commander', response: 'Commandez facilement en remplissant notre formulaire. Paiement à la livraison ! Redirection en cours...' },
    { label: 'Parler à un conseiller', action: 'whatsapp', response: '' },
  ],
  faq_items: [
    { key: 'livraison', label: 'Livraison', icon: 'truck', response: '📦 Nous livrons dans les 58 wilayas d\'Algérie. Délai de livraison : 48h dans les grandes villes, 3-5 jours pour les autres wilayas. Chaque montre est expédiée dans un écrin de luxe avec assurance transport.' },
    { key: 'garantie', label: 'Garantie', icon: 'shield', response: '🛡️ Toutes nos montres bénéficient d\'une garantie internationale de 3 ans couvrant le mouvement et les défauts de fabrication. Les montres avec tourbillon bénéficient d\'une garantie étendue de 5 ans.' },
    { key: 'paiement', label: 'Paiement', icon: 'shopping-bag', response: '💳 Nous proposons le paiement à la livraison (COD) sur toutes nos commandes. Aucun paiement en ligne requis. Vous pouvez inspecter votre montre avant de payer.' },
    { key: 'authenticite', label: 'Authenticité', icon: 'clock', response: '✅ Toutes nos montres sont livrées avec un certificat d\'authenticité et un numéro de série unique. Nous travaillons exclusivement avec des fournisseurs agréés et des manufactures certifiées.' },
  ],
  whatsapp_message: 'Bonjour, je suis intéressé(e) par vos montres de luxe. Puis-je avoir plus d\'informations ?',
  n8n_webhook_url: null,
  n8n_enabled: false,
  updated_at: new Date().toISOString(),
}

// GET /api/chatbot — public, returns chatbot config
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('chatbot_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return NextResponse.json(DEFAULT_CONFIG)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

// PATCH /api/chatbot — admin only, updates chatbot config
export async function PATCH(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin role
    const metaRole = user.app_metadata?.role
    let isAdmin = metaRole === 'super_admin' || metaRole === 'admin'

    if (!isAdmin) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      const userRoles = roles?.map(r => r.role) || []
      isAdmin = userRoles.some(r => r === 'super_admin' || r === 'admin')
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()

    // Build update object with only allowed fields
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.greeting !== undefined) update.greeting = body.greeting
    if (body.quick_actions !== undefined) update.quick_actions = body.quick_actions
    if (body.faq_items !== undefined) update.faq_items = body.faq_items
    if (body.whatsapp_message !== undefined) update.whatsapp_message = body.whatsapp_message
    if (body.n8n_webhook_url !== undefined) update.n8n_webhook_url = body.n8n_webhook_url || null
    if (body.n8n_enabled !== undefined) update.n8n_enabled = body.n8n_enabled

    const { data, error } = await supabase
      .from('chatbot_config')
      .update(update)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
