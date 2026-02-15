'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PromptPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const loadPrompt = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/prompt')
      if (res.ok) {
        const data = await res.json()
        setPrompt(data.prompt || '')
        setOriginalPrompt(data.prompt || '')
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error('Error cargando prompt:', err)
      setError('Error cargando prompt')
    } finally {
      setIsLoading(false)
    }
  }

  const savePrompt = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (res.ok) {
        setOriginalPrompt(prompt)
        setSuccess('Prompt guardado correctamente')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Error guardando prompt')
      }
    } catch (err) {
      setError('Error guardando prompt')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    loadPrompt()
  }, [])

  const hasChanges = prompt !== originalPrompt

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Prompt de Sofia</h1>
          <p className="text-gray-600 mt-2">Instrucciones del sistema para el bot de cobranzas</p>
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

      {/* Info */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">ℹ️ Información</h2>
        <p className="text-sm text-blue-700">
          Este es el prompt del sistema que usa Sofia para responder a los clientes. 
          Los cambios se aplican a nuevas conversaciones.
        </p>
        <p className="text-sm text-blue-600 mt-2">
          <strong>Nota:</strong> Si Langfuse está configurado, el prompt se obtiene desde ahí. 
          De lo contrario, se usa el prompt local del archivo <code>prompts.py</code>.
        </p>
      </section>

      {/* Editor de Prompt */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">System Prompt</h2>
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
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresá el prompt del sistema..."
              />

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {prompt.length} caracteres
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrompt(originalPrompt)}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Descartar cambios
                  </button>
                  <button
                    onClick={savePrompt}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Prompt'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Tips */}
      <section className="mt-6 bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold text-gray-800 mb-3">💡 Tips para el prompt</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Definí claramente el rol de Sofia (asesora de cobranzas)</li>
          <li>• Incluí instrucciones sobre tono y lenguaje (español rioplatense)</li>
          <li>• Especificá cuándo debe usar las herramientas disponibles</li>
          <li>• Indicá qué información NO debe inventar</li>
          <li>• Mencioná que debe proteger la privacidad de los clientes</li>
        </ul>
      </section>
    </main>
  )
}
