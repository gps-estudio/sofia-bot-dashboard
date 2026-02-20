import { NextRequest, NextResponse } from 'next/server'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
const CHATWOOT_ACCESS_TOKEN = process.env.CHATWOOT_ACCESS_TOKEN

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'all' // open, resolved, pending, all

  if (!CHATWOOT_BASE_URL || !CHATWOOT_ACCESS_TOKEN || !CHATWOOT_ACCOUNT_ID) {
    return NextResponse.json({
      conversations: [],
      error: 'Chatwoot no configurado'
    })
  }

  try {
    // Fetch ALL pages from Chatwoot API (it paginates at 25 per page)
    const allConversations: any[] = []
    let page = 1
    const maxPages = 20 // Safety limit: 20 pages x 25 = 500 conversations max
    
    while (page <= maxPages) {
      const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=${status}&page=${page}`
      
      const response = await fetch(url, {
        headers: {
          'Api-Access-Token': CHATWOOT_ACCESS_TOKEN,
        },
      })

      if (!response.ok) {
        throw new Error(`Chatwoot API error: ${response.status}`)
      }

      const data = await response.json()
      const pageConversations = data.data?.payload || data.payload || []
      
      // If no conversations on this page, we've reached the end
      if (pageConversations.length === 0) {
        break
      }
      
      allConversations.push(...pageConversations)
      
      // Check if we got less than a full page (end of results)
      if (pageConversations.length < 25) {
        break
      }
      
      page++
    }

    // Transform to dashboard format
    const conversations = allConversations.map((conv: any) => ({
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
      total: conversations.length,
      pagesLoaded: page
    })
  } catch (error: any) {
    console.error('Error fetching Chatwoot conversations:', error)
    return NextResponse.json({
      conversations: [],
      error: error.message
    })
  }
}
