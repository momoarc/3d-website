import { NextResponse } from 'next/server'

// GET: Returns single landing page by slug (public if published, admin can see drafts)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)

    // Non-authenticated users only see published pages
    if (!user) {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json({ error: 'Page non trouvée' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
