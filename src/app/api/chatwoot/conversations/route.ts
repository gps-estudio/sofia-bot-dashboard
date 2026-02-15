import { NextRequest, NextResponse } from 'next/server'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
const CHATWOOT_ACCESS_TOKEN = process.env.CHATWOOT_ACCESS_TOKEN

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all' // open, resolved, pending, all

  if (!CHATWOOT_BASE_URL || !CHATWOOT_ACCESS_TOKEN || !CHATWOOT_ACCOUNT_ID) {
    return NextResponse.json({
      conversations: [],
      error: 'Chatwoot no configurado'
    })
  }

  try {
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=${status}`
    
    const response = await fetch(url, {
      headers: {
        'Api-Access-Token': CHATWOOT_ACCESS_TOKEN,
      },
    })

    if (!response.ok) {
      throw new Error(`Chatwoot API error: ${response.status}`)
    }

    const data = await response.json()
    const rawConversations = data.data?.payload || data.payload || []

    // Transformar al formato del dashboard
    const conversations = rawConversations
      .slice(0, limit)
      .map((conv: any) => ({
        id: conv.id,
        contactName: conv.meta?.sender?.name || conv.contact?.name || 'Sin nombre',
        phoneNumber: conv.meta?.sender?.phone_number || conv.contact?.phone_number || 'N/A',
        status: conv.status,
        lastMessage: conv.last_non_activity_message?.content || conv.messages?.[0]?.content || '',
        lastActivityAt: conv.last_activity_at || conv.updated_at,
        createdAt: conv.created_at,
        messagesCount: conv.messages_count || 0,
        inboxId: conv.inbox_id,
        inboxName: conv.meta?.inbox?.name || 'Inbox',
        assignee: conv.meta?.assignee?.name || null,
      }))

    return NextResponse.json({ 
      conversations,
      total: rawConversations.length
    })
  } catch (error: any) {
    console.error('Error fetching Chatwoot conversations:', error)
    return NextResponse.json({
      conversations: [],
      error: error.message
    })
  }
}
