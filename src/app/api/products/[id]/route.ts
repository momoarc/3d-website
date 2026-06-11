import { NextResponse } from 'next/server'

// GET /api/products/[id] — fetch a single product by ID or slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Try to parse as number (ID) first
    const numericId = parseInt(id)
    let query

    if (!isNaN(numericId) && /^\d+$/.test(id)) {
      // Lookup by ID
      query = supabase.from('products').select('*').eq('id', numericId).single()
    } else {
      // Lookup by slug
      query = supabase.from('products').select('*').eq('slug', id).single()
    }

    const { data, error } = await query

    if (error || !data) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
