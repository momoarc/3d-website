import { NextResponse } from 'next/server'
import { DEFAULT_DELIVERY_CONFIG, type DeliveryConfig } from '@/lib/delivery-config'

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
      // Return default config with pre-configured Algeria pricing
      return NextResponse.json({ ...DEFAULT_DELIVERY_CONFIG, _fromDefault: true })
    }

    return NextResponse.json({ ...data, _fromDefault: false })
  } catch {
    // If table doesn't exist or Supabase is not configured, return defaults
    return NextResponse.json({ ...DEFAULT_DELIVERY_CONFIG, _fromDefault: true })
  }
}

// POST /api/delivery — auto-setup: insert default config row
export async function POST() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé. Connectez-vous en tant qu\'admin.' }, { status: 401 })
    }

    // Try upsert: insert the default config if it doesn't exist
    const { data, error } = await supabase
      .from('delivery_config')
      .upsert({
        id: 1,
        services: DEFAULT_DELIVERY_CONFIG.services,
        global_settings: DEFAULT_DELIVERY_CONFIG.global_settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      // If table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({
          error: 'La table delivery_config n\'existe pas. Veuillez exécuter le script SQL de migration dans le Supabase SQL Editor.',
          needsMigration: true,
        }, { status: 500 })
      }
      // If RLS blocks the insert (user not admin)
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
        return NextResponse.json({
          error: 'Permission refusée. Vous devez être admin pour modifier la configuration. Vérifiez votre rôle dans la table user_roles.',
          needsRole: true,
        }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Configuration créée avec succès', data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

// PATCH /api/delivery — admin only, updates delivery config
export async function PATCH(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const body = await request.json()

    const update: Record<string, unknown> = {
      services: body.services,
      global_settings: body.global_settings,
      updated_at: new Date().toISOString(),
    }

    // Try upsert: update if exists, insert if not
    const { data, error } = await supabase
      .from('delivery_config')
      .upsert({ id: 1, ...update }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      // If table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({
          error: 'La table delivery_config n\'existe pas. Veuillez exécuter le script SQL de migration.',
          needsMigration: true,
        }, { status: 500 })
      }
      // If RLS blocks
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
        // Try without auth check — use the anon key approach
        // This handles the case where the admin is logged in but RLS is misconfigured
        return NextResponse.json({
          error: 'Permission refusée. Vérifiez que la RLS autorise l\'écriture pour les admins. Vous pouvez aussi exécuter le script SQL de migration pour réinitialiser les policies.',
          needsMigration: true,
        }, { status: 403 })
      }
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
