import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('site_settings')
      .select('business_name, phone, email, whatsapp_number, whatsapp_greeting, whatsapp_enabled')
      .eq('id', 1)
      .single()

    if (error) {
      return NextResponse.json({
        business_name: 'Maison Dorée',
        phone: null,
        email: null,
        whatsapp_number: '+213XXXXXXXXX',
        whatsapp_greeting: 'Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?',
        whatsapp_enabled: true,
      })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      business_name: 'Maison Dorée',
      phone: null,
      email: null,
      whatsapp_number: '+213XXXXXXXXX',
      whatsapp_greeting: 'Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?',
      whatsapp_enabled: true,
    })
  }
}
