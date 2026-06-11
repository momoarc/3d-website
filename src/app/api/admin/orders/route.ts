import { NextResponse } from 'next/server'
import { fireEvent } from '@/lib/webhooks'

async function getAuthenticatedUser(request: Request) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser(new Request(''))
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id, status, previous_status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID et statut requis' }, { status: 400 })
    }

    // Fetch current order to get previous status
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status, name, phone, product')
      .eq('id', id)
      .single()

    const previousStatus = previous_status || currentOrder?.status || 'Nouveau'

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fire order.status_changed webhook event (non-blocking)
    fireEvent('order.status_changed', {
      id: data.id,
      name: data.name,
      phone: data.phone,
      product: data.product,
      previous_status: previousStatus,
      new_status: status,
      updated_at: data.updated_at,
    }).catch((err) => console.error('[Webhook] order.status_changed error:', err))

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
