import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// URL del bot Sofia
const BOT_URL = process.env.BOT_URL || 'https://gps-bot-231066423024.us-central1.run.app'

export async function POST() {
  try {
    // Llamar al endpoint del bot para recargar el prompt
    const response = await fetch(`${BOT_URL}/api/v1/reload-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Error recargando prompt en bot:', error)
      return NextResponse.json(
        { error: 'Error recargando prompt en el bot', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error conectando con el bot:', error)
    return NextResponse.json(
      { error: 'Error conectando con el bot' },
      { status: 500 }
    )
  }
}
