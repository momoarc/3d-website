import { NextResponse } from 'next/server'

async function getAuthenticatedUser() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

// GET /api/payment-methods — Public: returns enabled payment methods ordered by sort_order
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })

    if (error) {
      // If table doesn't exist yet, return empty array gracefully
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      console.error('Supabase payment_methods fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/payment-methods — Admin: create new payment method
export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { name, slug, description, icon, type, config, enabled, sort_order } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Le nom et le slug sont obligatoires.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || 'banknote',
        type: type || 'offline',
        config: config || {},
        enabled: enabled !== undefined ? enabled : true,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH /api/payment-methods — Admin: update payment method
export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const allowedFields = ['name', 'slug', 'description', 'icon', 'type', 'config', 'enabled', 'sort_order']
    const filteredUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key]
      }
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Méthode de paiement non trouvée.' }, { status: 404 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/payment-methods — Admin: delete payment method
export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
