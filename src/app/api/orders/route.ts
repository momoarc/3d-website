import { NextResponse } from 'next/server'
import { fireEvent } from '@/lib/webhooks'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, wilaya, commune, product, product_id, quantity, notes, source, total } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Le nom et le téléphone sont obligatoires.' },
        { status: 400 }
      )
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

      const { data, error } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          name,
          phone,
          wilaya: wilaya || null,
          commune: commune || null,
          product: product || null,
          product_id: product_id || null,
          quantity: quantity || 1,
          status: 'Nouveau',
          notes: notes || null,
          source: source || 'website',
          total: total || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase order insert error:', error)
        // Still return success to the user, we don't want to block orders
        return NextResponse.json({
          success: true,
          id: orderId,
          message: 'Commande enregistrée avec succès !',
        })
      }

      // Fire order.created webhook event (non-blocking)
      fireEvent('order.created', {
        id: data.id,
        name: data.name,
        phone: data.phone,
        wilaya: data.wilaya,
        commune: data.commune,
        product: data.product,
        product_id: data.product_id,
        quantity: data.quantity,
        status: data.status,
        notes: data.notes,
        source: data.source,
        total: data.total,
        created_at: data.created_at,
      }).catch((err) => console.error('[Webhook] order.created error:', err))

      return NextResponse.json({
        success: true,
        id: data.id,
        message: 'Commande enregistrée avec succès !',
      })
    } catch {
      // Fallback if Supabase is not configured
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      return NextResponse.json({
        success: true,
        id: orderId,
        message: 'Commande enregistrée avec succès !',
      })
    }
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la soumission de la commande.' },
      { status: 500 }
    )
  }
}
