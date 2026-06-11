import { NextResponse } from 'next/server'
import { WEBHOOK_EVENTS } from '@/lib/webhooks'

/**
 * GET /api/webhooks — Returns available webhook events
 */
export async function GET() {
  return NextResponse.json({
    site: 'maison-doree',
    events: WEBHOOK_EVENTS,
    version: '1.0.0',
  })
}

/**
 * POST /api/webhooks — Receive incoming webhook trigger from external tools (n8n, Zapier, Make)
 * This endpoint allows external tools to push data INTO Maison Dorée
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Supported incoming actions
    const supportedActions = [
      'update_order_status',
      'check_product_availability',
      'get_order',
      'ping',
    ]

    if (!supportedActions.includes(action)) {
      return NextResponse.json(
        { error: `Unsupported action: ${action}. Supported: ${supportedActions.join(', ')}` },
        { status: 400 }
      )
    }

    if (action === 'ping') {
      return NextResponse.json({ pong: true, site: 'maison-doree', timestamp: new Date().toISOString() })
    }

    // For other actions, return success acknowledgment
    return NextResponse.json({
      success: true,
      action,
      message: `Action "${action}" received`,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
