import { NextResponse } from 'next/server'

const DEFAULT_DELIVERY_CONFIG = {
  id: 1,
  services: {
    yalidine: {
      name: 'Yalidine',
      enabled: true,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: { label: 'Domicile', wilayas: {} },
        stopdesk: { label: 'Stop Desk', wilayas: {} },
      },
    },
    maybox: {
      name: 'Maybox',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: { label: 'Domicile', wilayas: {} },
        stopdesk: { label: 'Stop Desk', wilayas: {} },
      },
    },
    ecolog: {
      name: 'ECO LOG',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: { label: 'Domicile', wilayas: {} },
        stopdesk: { label: 'Stop Desk', wilayas: {} },
      },
    },
  },
  global_settings: {
    free_shipping_enabled: false,
    free_shipping_min_amount: 0,
    delivery_estimate_days: 3,
    default_service: 'yalidine',
  },
  updated_at: new Date().toISOString(),
}

// GET /api/delivery — public, returns delivery config
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('delivery_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return NextResponse.json(DEFAULT_DELIVERY_CONFIG)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(DEFAULT_DELIVERY_CONFIG)
  }
}

// PATCH /api/delivery — admin only, updates delivery config
export async function PATCH(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

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

    const update: Record<string, unknown> = {
      services: body.services,
      global_settings: body.global_settings,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('delivery_config')
      .update(update)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
