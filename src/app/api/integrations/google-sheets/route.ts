import { NextResponse } from 'next/server'

/**
 * POST /api/integrations/google-sheets — Format order data for Google Sheets via n8n/Zapier
 * 
 * This endpoint takes an order and formats it as a row suitable for Google Sheets.
 * The formatted data can then be pushed via n8n, Zapier, or Make to a Google Sheet.
 */
export async function POST(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { order_id, format } = body

    // If order_id provided, fetch the order
    if (order_id) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single()

      if (error || !order) {
        return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
      }

      const formatted = formatOrderForSheets(order)
      return NextResponse.json({ order, formatted })
    }

    // If no order_id, return the template/schema
    return NextResponse.json({
      message: 'Google Sheets Integration Template',
      site: 'maison-doree',
      columns: [
        { column: 'A', header: 'ID Commande', example: 'ORD-1234567890-ABC12' },
        { column: 'B', header: 'Nom Client', example: 'Ahmed Benali' },
        { column: 'C', header: 'Téléphone', example: '0555123456' },
        { column: 'D', header: 'Wilaya', example: 'Alger' },
        { column: 'E', header: 'Commune', example: 'Bab El Oued' },
        { column: 'F', header: 'Produit', example: 'Royal Chronographe Or' },
        { column: 'G', header: 'Quantité', example: '1' },
        { column: 'H', header: 'Total (DZD)', example: '285000' },
        { column: 'I', header: 'Statut', example: 'Nouveau' },
        { column: 'J', header: 'Source', example: 'website' },
        { column: 'K', header: 'Notes', example: 'Préférence bracelet cuir' },
        { column: 'L', header: 'Date', example: '2025-01-15T10:30:00Z' },
      ],
      webhook_url: '/api/webhooks',
      n8n_workflow_hint: {
        trigger: 'Webhook (POST /api/webhooks)',
        action1: 'Format data using this template',
        action2: 'Google Sheets - Append Row',
      },
      format: format || 'sheets',
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * Format an order row for Google Sheets
 */
function formatOrderForSheets(order: Record<string, unknown>): string[] {
  return [
    order.id as string || '',
    order.name as string || '',
    order.phone as string || '',
    order.wilaya as string || '',
    order.commune as string || '',
    order.product as string || '',
    String(order.quantity || 1),
    String(order.total || ''),
    order.status as string || 'Nouveau',
    order.source as string || 'website',
    order.notes as string || '',
    order.created_at as string || new Date().toISOString(),
  ]
}
