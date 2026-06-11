import { NextResponse } from 'next/server'

async function getAuthenticatedUser() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

/**
 * GET /api/webhooks/register — List all registered webhooks
 */
export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/webhooks/register — Register a new webhook
 */
export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { url, events, secret, active } = body

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'URL et événements sont requis' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL invalide' },
        { status: 400 }
      )
    }

    // Validate events
    const validEvents = ['order.created', 'order.status_changed', 'cart.abandoned', 'stock.low', 'user.registered', '*']
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Événements invalides: ${invalidEvents.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        url,
        events,
        secret: secret || null,
        active: active !== false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * DELETE /api/webhooks/register — Remove a webhook
 */
export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID du webhook requis' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH /api/webhooks/register — Update a webhook (toggle active, change events, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID du webhook requis' },
        { status: 400 }
      )
    }

    const allowedFields = ['url', 'events', 'secret', 'active']
    const filteredUpdates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune mise à jour valide' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('webhooks')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
