import { NextResponse } from 'next/server'

// Fallback products - displayed only when Supabase has no data
// Replace these with your actual products via the admin panel
const DEFAULT_PRODUCTS: Array<Record<string, unknown>> = []

export async function GET(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      if (category) {
        const filtered = DEFAULT_PRODUCTS.filter(p => p.category === category)
        return NextResponse.json(filtered)
      }
      return NextResponse.json(DEFAULT_PRODUCTS)
    }

    return NextResponse.json(data)
  } catch {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    if (category) {
      return NextResponse.json(DEFAULT_PRODUCTS.filter(p => p.category === category))
    }
    return NextResponse.json(DEFAULT_PRODUCTS)
  }
}
