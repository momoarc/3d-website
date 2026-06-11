import { NextResponse } from 'next/server'

const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: "Collection Royale 2025",
    location: "Genève, Suisse",
    image_url: "/images/watches/showroom-interior.jpg",
    badge: "Lancé",
    description: "Présentation de la collection royale 2025 lors du salon horloger de Genève.",
    specs: ["8 Nouvelles Pièces", "Présentation Salon Genève", "Édition Limitée"],
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Boutique Alger Centre",
    location: "Alger, Algérie",
    image_url: "/images/watches/showroom-interior.jpg",
    badge: "Inauguré",
    description: "Inauguration de notre flagship store au cœur d'Alger, un espace dédié à l'art horloger.",
    specs: ["Flagship Store", "Service Premium", "Espace VIP"],
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Partenariat Swiss Movement",
    location: "La Chaux-de-Fonds",
    image_url: "/images/watches/automatique-acier.jpg",
    badge: "Partenariat",
    description: "Signature d'un partenariat exclusif avec une manufacture suisse pour des mouvements certifiés.",
    specs: ["Mouvements Certifiés", "Exclusivité", "Qualité Suisse"],
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase.from('projects').select('*').order('sort_order')

    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_PROJECTS)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(DEFAULT_PROJECTS)
  }
}
