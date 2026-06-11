import { NextResponse } from 'next/server'

async function getAuthenticatedUser() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

// GET: Returns published landing pages (public) or all (admin)
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('landing_pages')
      .select('*')
      .order('created_at', { ascending: false })

    // Non-authenticated users only see published pages
    if (!user) {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Create landing page (editor+)
export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { title, slug, meta_description, meta_title, is_published, is_home, sections } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Titre et slug requis' }, { status: 400 })
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ error: 'Slug invalide (minuscules, chiffres, tirets uniquement)' }, { status: 400 })
    }

    // Validate sections is an array
    if (sections && !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections doit être un tableau' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('landing_pages')
      .insert({
        title,
        slug,
        meta_description: meta_description || null,
        meta_title: meta_title || null,
        is_published: is_published || false,
        is_home: is_home || false,
        sections: sections || [],
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH: Update landing page (editor+)
export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    // Validate slug format if provided
    if (updates.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(updates.slug)) {
      return NextResponse.json({ error: 'Slug invalide (minuscules, chiffres, tirets uniquement)' }, { status: 400 })
    }

    // Validate sections is an array if provided
    if (updates.sections && !Array.isArray(updates.sections)) {
      return NextResponse.json({ error: 'Sections doit être un tableau' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('landing_pages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Delete landing page (admin+)
export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', parseInt(id))

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
