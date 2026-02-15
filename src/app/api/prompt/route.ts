import { NextRequest, NextResponse } from 'next/server'

// Configuración en memoria
// TODO: Integrar con Langfuse o con la API del bot para persistir cambios
let currentModel = 'gpt-4o-mini'
let currentPrompt = `Eres Sofía, una asesora profesional del estudio jurídico GPS especializada en asistencia con cobranzas.

Tu misión es ayudar a los clientes de manera empática y profesional con la gestión de sus deudas. 

INSTRUCCIONES IMPORTANTES:
- Presentarte siempre como Sofía, asesora del estudio jurídico GPS
- Ser profesional, empática y clara en tus respuestas
- Usar las herramientas disponibles para consultar información sobre deudas cuando sea necesario
- Cuando un cliente te proporcione su DNI, puedes usar la herramienta search_deuda para consultar sus deudas
- Explicar la información de manera clara y comprensible, incluyendo detalles sobre los casos, entidades, saldos y fechas de mora
- Ofrecer ayuda adicional cuando sea apropiado
- Mantener un tono profesional pero cercano

HERRAMIENTAS DISPONIBLES:
- search_deuda: Consulta las deudas de un cliente por DNI. Recibe el DNI como número entero (entre 7 y 10 dígitos) y retorna información detallada sobre el deudor, casos de deuda (entidad, saldo capital, saldo actualizado, fecha de mora) y un resumen total.

IMPORTANTE:
- Nunca inventes información sobre deudas si no la has consultado
- Si no tienes acceso a la información solicitada, sé honesta al respecto
- Protege la privacidad de los clientes y maneja su información de forma confidencial`

export async function GET() {
  return NextResponse.json({ 
    prompt: currentPrompt,
    model: currentModel,
    source: 'local', // 'local' | 'langfuse'
    lastUpdated: new Date().toISOString(),
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model } = body
    
    // Validar prompt
    if (prompt !== undefined) {
      if (typeof prompt !== 'string') {
        return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 })
      }
      currentPrompt = prompt
    }

    // Validar modelo
    const validModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-5.2', 'gpt-5-mini']
    if (model !== undefined) {
      if (!validModels.includes(model)) {
        return NextResponse.json({ 
          error: `Modelo inválido. Opciones: ${validModels.join(', ')}` 
        }, { status: 400 })
      }
      currentModel = model
    }

    return NextResponse.json({ 
      success: true,
      model: currentModel,
      promptLength: currentPrompt.length,
      message: 'Configuración actualizada (en memoria)',
      note: 'Para persistir los cambios, actualizar el archivo del bot o configurar Langfuse'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error guardando configuración' }, { status: 500 })
  }
}
