import { NextResponse } from 'next/server'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
const CHATWOOT_ACCESS_TOKEN = process.env.CHATWOOT_ACCESS_TOKEN

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!CHATWOOT_BASE_URL || !CHATWOOT_ACCESS_TOKEN || !CHATWOOT_ACCOUNT_ID) {
    return NextResponse.json({
      totalConversations: 0,
      openConversations: 0,
      resolvedToday: 0,
      pendingConversations: 0,
      error: 'Chatwoot no configurado'
    })
  }

  try {
    // Obtener conversaciones para calcular stats
    const response = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=all`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_ACCESS_TOKEN,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Chatwoot API error: ${response.status}`)
    }

    const data = await response.json()
    const conversations = data.data?.payload || data.payload || []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = {
      totalConversations: conversations.length,
      openConversations: conversations.filter((c: any) => c.status === 'open').length,
      pendingConversations: conversations.filter((c: any) => c.status === 'pending').length,
      resolvedToday: conversations.filter((c: any) => {
        if (c.status !== 'resolved') return false
        const resolvedAt = new Date(c.last_activity_at || c.updated_at)
        return resolvedAt >= today
      }).length,
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching Chatwoot stats:', error)
    return NextResponse.json({
      totalConversations: 0,
      openConversations: 0,
      resolvedToday: 0,
      pendingConversations: 0,
      error: error.message
    })
  }
}
