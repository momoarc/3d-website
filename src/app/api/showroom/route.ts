import { NextResponse } from 'next/server'

// Default walls - configure your showroom via the admin panel
const DEFAULT_WALLS: Array<Record<string, string>> = []

const DEFAULT_ROOM = {
  speed: 0.004,
  autoRotate: 0.0003,
  radius: 5.2,
  floorImage: null,
  ceilingImage: null,
}

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase.from('showroom_config').select('*').eq('id', 1).single()

    if (error || !data) {
      return NextResponse.json({ walls: DEFAULT_WALLS, room: DEFAULT_ROOM })
    }

    const walls = data.walls_config && data.walls_config.length > 0
      ? data.walls_config
      : DEFAULT_WALLS

    const room = data.room_config && Object.keys(data.room_config).length > 0
      ? { ...DEFAULT_ROOM, ...data.room_config }
      : DEFAULT_ROOM

    return NextResponse.json({ walls, room })
  } catch {
    return NextResponse.json({ walls: DEFAULT_WALLS, room: DEFAULT_ROOM })
  }
}
