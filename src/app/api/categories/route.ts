import { NextResponse } from 'next/server'

// Fallback categories - displayed only when Supabase has no data
// Add your actual categories via the admin panel
const DEFAULT_CATEGORIES: Array<Record<string, unknown>> = []

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase.from('categories').select('*').order('sort_order')

    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_CATEGORIES)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(DEFAULT_CATEGORIES)
  }
}
