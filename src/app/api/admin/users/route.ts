import { NextResponse } from 'next/server'

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
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Check if user is super_admin
    const metaRole = user.app_metadata?.role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = roles?.map(r => r.role) || []
    const isSuperAdmin = metaRole === 'super_admin' || userRoles.includes('super_admin')

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé - Super Admin requis' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email et rôle requis' }, { status: 400 })
    }

    const validRoles = ['super_admin', 'admin', 'editeur', 'lecteur']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert({ email, role, user_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Check if user is super_admin
    const metaRole = user.app_metadata?.role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = roles?.map(r => r.role) || []
    const isSuperAdmin = metaRole === 'super_admin' || userRoles.includes('super_admin')

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Accès refusé - Super Admin requis' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { error } = await supabase.from('user_roles').delete().eq('id', parseInt(id))

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
