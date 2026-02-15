'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Rápido y económico' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Balance calidad/costo' },
  { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Última generación GPT-4' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'GPT-4.1 económico' },
  { id: 'gpt-5.2', name: 'GPT-5.2', description: 'Flagship, mejor razonamiento' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'GPT-5 económico' },
]

export default function PromptPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [originalModel, setOriginalModel] = useState('gpt-4o-mini')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/prompt')
      if (res.ok) {
        const data = await res.json()
        setPrompt(data.prompt || '')
        setOriginalPrompt(data.prompt || '')
        setModel(data.model || 'gpt-4o-mini')
        setOriginalModel(data.model || 'gpt-4o-mini')
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error('Error cargando configuración:', err)
      setError('Error cargando configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
      })
      if (res.ok) {
        setOriginalPrompt(prompt)
        setOriginalModel(model)
        setSuccess('Configuración guardada correctamente')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Error guardando configuración')
      }
    } catch (err) {
      setError('Error guardando configuración')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const hasChanges = prompt !== originalPrompt || model !== originalModel

  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === model)

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración de Sofia</h1>
          <p className="text-gray-600 mt-2">Modelo y prompt del bot de cobranzas</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-300 rounded hover:bg-blue-50"
          >
            ← Dashboard
          </Link>
          <Link 
            href="/sessions"
            className="text-sm text-green-600 hover:text-green-800 px-3 py-2 border border-green-300 rounded hover:bg-green-50"
          >
            💬 Sesiones
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Salir
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          ✅ {success}
        </div>
      )}

      {/* Selector de Modelo */}
      <section className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">🤖 Modelo LLM</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center text-gray-500 py-4">Cargando...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      model === m.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{m.description}</div>
                  </button>
                ))}
              </div>
              {model !== originalModel && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm text-yellow-700">
                    ⚠️ Cambio de modelo: <strong>{originalModel}</strong> → <strong>{model}</strong>
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Editor de Prompt */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">📝 System Prompt</h2>
          {hasChanges && (
            <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
              ⚠️ Cambios sin guardar
            </span>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Cargando prompt...</div>
          ) : (
            <>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresá el prompt del sistema..."
              />

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {prompt.length} caracteres
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPrompt(originalPrompt)
                      setModel(originalModel)
                    }}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Descartar cambios
                  </button>
                  <button
                    onClick={saveConfig}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Info */}
      <section className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800 mb-2">ℹ️ Información</h2>
        <p className="text-sm text-blue-700">
          Los cambios de modelo y prompt se aplican a <strong>nuevas conversaciones</strong>. 
          Las conversaciones existentes mantienen la configuración con la que fueron creadas.
        </p>
        <p className="text-sm text-blue-600 mt-2">
          <strong>Nota:</strong> El prompt se guarda en memoria. Para persistir los cambios, 
          actualizar el archivo <code>prompts.py</code> del bot.
        </p>
      </section>

      {/* Tips */}
      <section className="mt-6 bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold text-gray-800 mb-3">💡 Tips</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Modelos recomendados:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>gpt-4o-mini:</strong> Mejor para producción (económico)</li>
              <li>• <strong>gpt-5-mini:</strong> Si necesitás mejor razonamiento</li>
              <li>• <strong>gpt-5.2:</strong> Para casos complejos (más caro)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Para el prompt:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Definí claramente el rol de Sofia</li>
              <li>• Especificá el tono (empático, profesional)</li>
              <li>• Indicá cuándo usar las herramientas</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
