import { NextResponse } from 'next/server'

/**
 * GET /api/webhooks/deliveries — List webhook delivery logs
 */
export async function GET(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const webhook_id = searchParams.get('webhook_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let query = supabase
      .from('webhook_deliveries')
      .select('*')
      .order('delivered_at', { ascending: false })
      .limit(limit)

    if (webhook_id) {
      query = query.eq('webhook_id', webhook_id)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
