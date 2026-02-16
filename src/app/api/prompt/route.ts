import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY
const LANGFUSE_BASE_URL = process.env.LANGFUSE_BASE_URL || 'https://us.cloud.langfuse.com'
const PROMPT_NAME = process.env.LANGFUSE_PROMPT_NAME || 'sofia_system_prompt'

// Headers para auth de Langfuse
function getLangfuseHeaders() {
  const auth = Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64')
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  }
}

// GET: Obtener prompt actual desde Langfuse
export async function GET() {
  // Si no está configurado Langfuse, retornar error
  if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
    return NextResponse.json({ 
      error: 'Langfuse no configurado',
      source: 'none',
    }, { status: 500 })
  }

  try {
    // Obtener prompt con label "production"
    const response = await fetch(
      `${LANGFUSE_BASE_URL}/api/public/v2/prompts/${PROMPT_NAME}?label=production`,
      {
        headers: getLangfuseHeaders(),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Langfuse error:', error)
      return NextResponse.json({ 
        error: 'Error obteniendo prompt de Langfuse',
        details: error,
        source: 'langfuse',
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      prompt: data.prompt,
      name: data.name,
      version: data.version,
      labels: data.labels,
      source: 'langfuse',
      lastUpdated: data.updatedAt,
      langfuseUrl: `${LANGFUSE_BASE_URL}/project/${data.projectId}/prompts/${PROMPT_NAME}`,
    })
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return NextResponse.json({ 
      error: 'Error conectando con Langfuse',
      source: 'langfuse',
    }, { status: 500 })
  }
}

// PUT: Crear nueva versión del prompt en Langfuse
export async function PUT(request: NextRequest) {
  if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
    return NextResponse.json({ 
      error: 'Langfuse no configurado' 
    }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { prompt } = body
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 })
    }

    // Crear nueva versión del prompt en Langfuse
    const response = await fetch(
      `${LANGFUSE_BASE_URL}/api/public/v2/prompts`,
      {
        method: 'POST',
        headers: getLangfuseHeaders(),
        body: JSON.stringify({
          name: PROMPT_NAME,
          prompt: prompt,
          type: 'text',
          labels: ['production'],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Langfuse error:', error)
      return NextResponse.json({ 
        error: 'Error guardando prompt en Langfuse',
        details: error,
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      success: true,
      version: data.version,
      promptLength: prompt.length,
      message: `Prompt actualizado en Langfuse (versión ${data.version})`,
      note: 'El bot usará el nuevo prompt en las próximas conversaciones (cache TTL: 60s)',
    })
  } catch (error) {
    console.error('Error saving prompt:', error)
    return NextResponse.json({ 
      error: 'Error guardando prompt' 
    }, { status: 500 })
  }
}
