import { NextResponse } from 'next/server'

// Default fallback FOMO config
const DEFAULT_FOMO_CONFIG = {
  id: 1,
  recent_purchases_enabled: true,
  recent_purchases_interval: 20,
  recent_purchases_names: ['Karim', 'Amina', 'Yacine', 'Sara', 'Mohamed', 'Leila', 'Omar', 'Nadia', 'Rami', 'Ines', 'Sofiane', 'Meriem'],
  recent_purchases_wilayas: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Blida', 'Tlemcen', 'Batna', 'Béjaïa', 'Tizi Ouzou'],
  viewers_counter_enabled: true,
  viewers_counter_min: 3,
  viewers_counter_max: 28,
  stock_urgency_enabled: true,
  stock_urgency_threshold: 5,
  stock_urgency_use_real: true,
  order_count_enabled: true,
  order_count_min: 12,
  order_count_max: 87,
  order_count_use_real: true,
  delivery_estimate_enabled: true,
  delivery_estimate_days: 2,
  trust_badges_enabled: true,
  trust_badges_items: [
    { icon: 'award', label: 'Authenticité certifiée' },
    { icon: 'shield', label: 'Garantie 3 ans' },
    { icon: 'truck', label: 'Livraison assurée' },
    { icon: 'package', label: 'Paiement à la livraison' },
  ],
  updated_at: new Date().toISOString(),
}

// GET /api/fomo — public, returns FOMO config
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fomo_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      console.warn('[FOMO] Table not found or empty, using default config:', error?.message)
      return NextResponse.json(DEFAULT_FOMO_CONFIG)
    }

    // Ensure trust_badges_items exists (backward compatibility)
    if (!data.trust_badges_items) {
      data.trust_badges_items = DEFAULT_FOMO_CONFIG.trust_badges_items
    }
    if (data.stock_urgency_use_real === undefined || data.stock_urgency_use_real === null) {
      data.stock_urgency_use_real = true
    }
    if (data.order_count_use_real === undefined || data.order_count_use_real === null) {
      data.order_count_use_real = true
    }

    return NextResponse.json(data)
  } catch (err) {
    console.warn('[FOMO] Error fetching config, using default:', err)
    return NextResponse.json(DEFAULT_FOMO_CONFIG)
  }
}

// PATCH /api/fomo — admin only, updates FOMO config
export async function PATCH(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin role
    const metaRole = user.app_metadata?.role
    let isAdmin = metaRole === 'super_admin' || metaRole === 'admin'

    if (!isAdmin) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      const userRoles = roles?.map(r => r.role) || []
      isAdmin = userRoles.some(r => r === 'super_admin' || r === 'admin')
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()

    // Build update object with only allowed fields
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const booleanFields = [
      'recent_purchases_enabled',
      'viewers_counter_enabled',
      'stock_urgency_enabled',
      'stock_urgency_use_real',
      'order_count_enabled',
      'order_count_use_real',
      'delivery_estimate_enabled',
      'trust_badges_enabled',
    ]

    const numberFields = [
      'recent_purchases_interval',
      'viewers_counter_min',
      'viewers_counter_max',
      'stock_urgency_threshold',
      'order_count_min',
      'order_count_max',
      'delivery_estimate_days',
    ]

    const arrayFields = [
      'recent_purchases_names',
      'recent_purchases_wilayas',
      'trust_badges_items',
    ]

    for (const field of booleanFields) {
      if (body[field] !== undefined) update[field] = Boolean(body[field])
    }

    for (const field of numberFields) {
      if (body[field] !== undefined) update[field] = Number(body[field])
    }

    for (const field of arrayFields) {
      if (body[field] !== undefined) update[field] = body[field]
    }

    const { data, error } = await supabase
      .from('fomo_config')
      .update(update)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('[FOMO] Update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[FOMO] Patch error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

// POST /api/fomo — auto-setup: create the fomo_config table and default row if missing
export async function POST() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check auth first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin role
    const metaRole = user.app_metadata?.role
    let isAdmin = metaRole === 'super_admin' || metaRole === 'admin'
    if (!isAdmin) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      const userRoles = roles?.map(r => r.role) || []
      isAdmin = userRoles.some(r => r === 'super_admin' || r === 'admin')
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Try to check if fomo_config exists by selecting from it
    const { error: checkError } = await supabase
      .from('fomo_config')
      .select('id')
      .eq('id', 1)
      .single()

    if (checkError) {
      // Table doesn't exist or no row - try to upsert a default row
      // If the table doesn't exist, this will also fail, but we provide the SQL
      const { data: insertData, error: insertError } = await supabase
        .from('fomo_config')
        .upsert({
          id: 1,
          recent_purchases_enabled: true,
          recent_purchases_interval: 20,
          recent_purchases_names: ['Karim', 'Amina', 'Yacine', 'Sara', 'Mohamed', 'Leila', 'Omar', 'Nadia', 'Rami', 'Ines', 'Sofiane', 'Meriem'],
          recent_purchases_wilayas: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Blida', 'Tlemcen', 'Batna', 'Béjaïa', 'Tizi Ouzou'],
          viewers_counter_enabled: true,
          viewers_counter_min: 3,
          viewers_counter_max: 28,
          stock_urgency_enabled: true,
          stock_urgency_threshold: 5,
          stock_urgency_use_real: true,
          order_count_enabled: true,
          order_count_min: 12,
          order_count_max: 87,
          order_count_use_real: true,
          delivery_estimate_enabled: true,
          delivery_estimate_days: 2,
          trust_badges_enabled: true,
          trust_badges_items: [
            { icon: 'award', label: 'Authenticité certifiée' },
            { icon: 'shield', label: 'Garantie 3 ans' },
            { icon: 'truck', label: 'Livraison assurée' },
            { icon: 'package', label: 'Paiement à la livraison' },
          ],
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({
          error: 'La table fomo_config n\'existe pas. Veuillez exécuter le script SQL de migration dans votre Supabase SQL Editor.',
          sql_file: 'supabase-migration-fomo-images.sql',
          details: insertError.message,
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: insertData, created: true })
    }

    // Row already exists
    return NextResponse.json({ success: true, exists: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
