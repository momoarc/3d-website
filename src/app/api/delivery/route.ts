import { NextResponse } from 'next/server'

// Default delivery config with Algeria zone pricing pre-configured
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
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 400, '9': 400, '35': 400, '42': 400, '44': 400,
            '2': 600, '6': 600, '15': 600, '18': 600, '21': 600, '23': 600, '24': 600, '25': 600, '27': 600, '31': 600, '34': 600, '36': 600, '43': 600, '46': 600, '48': 600,
            '3': 700, '4': 700, '5': 700, '7': 700, '10': 700, '12': 700, '14': 700, '17': 700, '19': 700, '20': 700, '22': 700, '26': 700, '28': 700, '29': 700, '38': 700, '40': 700, '41': 700, '45': 700,
            '1': 900, '8': 900, '11': 900, '13': 900, '30': 900, '32': 900, '33': 900, '37': 900, '39': 900, '47': 900, '49': 900, '50': 900, '51': 900, '52': 900, '53': 900, '54': 900, '55': 900, '56': 900, '57': 900, '58': 900,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 200, '9': 200, '35': 200, '42': 200, '44': 200,
            '2': 300, '6': 300, '15': 300, '18': 300, '21': 300, '23': 300, '24': 300, '25': 300, '27': 300, '31': 300, '34': 300, '36': 300, '43': 300, '46': 300, '48': 300,
            '3': 350, '4': 350, '5': 350, '7': 350, '10': 350, '12': 350, '14': 350, '17': 350, '19': 350, '20': 350, '22': 350, '26': 350, '28': 350, '29': 350, '38': 350, '40': 350, '41': 350, '45': 350,
            '1': 450, '8': 450, '11': 450, '13': 450, '30': 450, '32': 450, '33': 450, '37': 450, '39': 450, '47': 450, '49': 450, '50': 450, '51': 450, '52': 450, '53': 450, '54': 450, '55': 450, '56': 450, '57': 450, '58': 450,
          },
        },
      },
    },
    maybox: {
      name: 'Maybox',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 350, '9': 350, '35': 350, '42': 350, '44': 350,
            '2': 550, '6': 550, '15': 550, '18': 550, '21': 550, '23': 550, '24': 550, '25': 550, '27': 550, '31': 550, '34': 550, '36': 550, '43': 550, '46': 550, '48': 550,
            '3': 650, '4': 650, '5': 650, '7': 650, '10': 650, '12': 650, '14': 650, '17': 650, '19': 650, '20': 650, '22': 650, '26': 650, '28': 650, '29': 650, '38': 650, '40': 650, '41': 650, '45': 650,
            '1': 850, '8': 850, '11': 850, '13': 850, '30': 850, '32': 850, '33': 850, '37': 850, '39': 850, '47': 850, '49': 850, '50': 850, '51': 850, '52': 850, '53': 850, '54': 850, '55': 850, '56': 850, '57': 850, '58': 850,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 180, '9': 180, '35': 180, '42': 180, '44': 180,
            '2': 280, '6': 280, '15': 280, '18': 280, '21': 280, '23': 280, '24': 280, '25': 280, '27': 280, '31': 280, '34': 280, '36': 280, '43': 280, '46': 280, '48': 280,
            '3': 330, '4': 330, '5': 330, '7': 330, '10': 330, '12': 330, '14': 330, '17': 330, '19': 330, '20': 330, '22': 330, '26': 330, '28': 330, '29': 330, '38': 330, '40': 330, '41': 330, '45': 330,
            '1': 430, '8': 430, '11': 430, '13': 430, '30': 430, '32': 430, '33': 430, '37': 430, '39': 430, '47': 430, '49': 430, '50': 430, '51': 430, '52': 430, '53': 430, '54': 430, '55': 430, '56': 430, '57': 430, '58': 430,
          },
        },
      },
    },
    ecolog: {
      name: 'ECO LOG',
      enabled: false,
      logo: '',
      pricing_type: 'zone',
      flat_price: 0,
      zones: {
        home: {
          label: 'Domicile',
          wilayas: {
            '16': 380, '9': 380, '35': 380, '42': 380, '44': 380,
            '2': 580, '6': 580, '15': 580, '18': 580, '21': 580, '23': 580, '24': 580, '25': 580, '27': 580, '31': 580, '34': 580, '36': 580, '43': 580, '46': 580, '48': 580,
            '3': 680, '4': 680, '5': 680, '7': 680, '10': 680, '12': 680, '14': 680, '17': 680, '19': 680, '20': 680, '22': 680, '26': 680, '28': 680, '29': 680, '38': 680, '40': 680, '41': 680, '45': 680,
            '1': 880, '8': 880, '11': 880, '13': 880, '30': 880, '32': 880, '33': 880, '37': 880, '39': 880, '47': 880, '49': 880, '50': 880, '51': 880, '52': 880, '53': 880, '54': 880, '55': 880, '56': 880, '57': 880, '58': 880,
          },
        },
        stopdesk: {
          label: 'Stop Desk',
          wilayas: {
            '16': 190, '9': 190, '35': 190, '42': 190, '44': 190,
            '2': 290, '6': 290, '15': 290, '18': 290, '21': 290, '23': 290, '24': 290, '25': 290, '27': 290, '31': 290, '34': 290, '36': 290, '43': 290, '46': 290, '48': 290,
            '3': 340, '4': 340, '5': 340, '7': 340, '10': 340, '12': 340, '14': 340, '17': 340, '19': 340, '20': 340, '22': 340, '26': 340, '28': 340, '29': 340, '38': 340, '40': 340, '41': 340, '45': 340,
            '1': 440, '8': 440, '11': 440, '13': 440, '30': 440, '32': 440, '33': 440, '37': 440, '39': 440, '47': 440, '49': 440, '50': 440, '51': 440, '52': 440, '53': 440, '54': 440, '55': 440, '56': 440, '57': 440, '58': 440,
          },
        },
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

// SQL to create delivery_config table if it doesn't exist
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS delivery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  services JSONB NOT NULL DEFAULT '{}',
  global_settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE delivery_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_config' AND policyname = 'allow_public_read'
  ) THEN
    CREATE POLICY allow_public_read ON delivery_config FOR SELECT USING (true);
  END IF;
END $$;

-- Allow admin write access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'delivery_config' AND policyname = 'allow_admin_write'
  ) THEN
    CREATE POLICY allow_admin_write ON delivery_config FOR ALL USING (
      EXISTS (
        SELECT 1 FROM auth.users WHERE auth.uid() = id
        AND (
          raw_user_meta_data->>'role' IN ('super_admin', 'admin')
          OR EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
          )
        )
      )
    );
  END IF;
END $$;
`

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
      return NextResponse.json(DEFAULT_DELIVERY_CONFIG)
    }

    return NextResponse.json(data)
  } catch {
    // If table doesn't exist or Supabase is not configured, return defaults
    return NextResponse.json(DEFAULT_DELIVERY_CONFIG)
  }
}

// POST /api/delivery — auto-setup: creates table + default config row
export async function POST() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Try to create table if it doesn't exist
    try {
      await supabase.rpc('exec_sql', { sql: CREATE_TABLE_SQL })
    } catch {
      // exec_sql might not exist, try alternative: just attempt the insert directly
    }

    // Check if config exists
    const { data: existing } = await supabase
      .from('delivery_config')
      .select('id')
      .eq('id', 1)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, message: 'Configuration déjà existante', data: existing })
    }

    // Insert default config
    const { data, error } = await supabase
      .from('delivery_config')
      .insert({
        id: 1,
        services: DEFAULT_DELIVERY_CONFIG.services,
        global_settings: DEFAULT_DELIVERY_CONFIG.global_settings,
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, try creating it with raw SQL
      if (error.code === '42P01') {
        return NextResponse.json({
          error: 'La table delivery_config n\'existe pas. Veuillez exécuter le script SQL de migration dans le Supabase SQL Editor.',
          needsMigration: true,
          sql: CREATE_TABLE_SQL,
        }, { status: 500 })
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

    // Try update first
    const { data, error } = await supabase
      .from('delivery_config')
      .update(update)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      // If table doesn't exist, return helpful error
      if (error.code === '42P01') {
        return NextResponse.json({
          error: 'La table delivery_config n\'existe pas. Veuillez exécuter le script SQL de migration.',
          needsMigration: true,
        }, { status: 500 })
      }

      // If row doesn't exist, try insert (upsert)
      if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
        const { data: insertData, error: insertError } = await supabase
          .from('delivery_config')
          .insert({ id: 1, ...update })
          .select()
          .single()

        if (insertError) {
          if (insertError.code === '42P01') {
            return NextResponse.json({
              error: 'La table delivery_config n\'existe pas. Veuillez exécuter le script SQL de migration.',
              needsMigration: true,
            }, { status: 500 })
          }
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json(insertData)
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
