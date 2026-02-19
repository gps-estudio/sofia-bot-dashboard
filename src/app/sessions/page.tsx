'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Conversation {
  id: number
  contactName: string
  phoneNumber: string
  status: 'open' | 'resolved' | 'pending'
  lastMessage: string
  lastActivityAt: string | number
  createdAt: string | number
  messagesCount: number
  inboxName: string
  assignee: string | null
}

// Helper function to format dates correctly
// Handles epoch timestamps (seconds or milliseconds), ISO strings, and invalid values
function formatDate(value: string | number | null | undefined): string {
  if (!value) return '-'
  
  let date: Date
  
  if (typeof value === 'number') {
    // If it's a number, check if it's in seconds (epoch) or milliseconds
    // Epoch timestamps in seconds are typically 10 digits, milliseconds are 13
    if (value < 10000000000) {
      // Likely seconds, convert to milliseconds
      date = new Date(value * 1000)
    } else {
      date = new Date(value)
    }
  } else if (typeof value === 'string') {
    // Try to parse as ISO string or number string
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && String(numValue) === value) {
      // It's a numeric string (epoch)
      if (numValue < 10000000000) {
        date = new Date(numValue * 1000)
      } else {
        date = new Date(numValue)
      }
    } else {
      // ISO string or other date format
      date = new Date(value)
    }
  } else {
    return '-'
  }
  
  // Check if date is valid and not in 1970 (invalid epoch)
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return '-'
  }
  
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CHATWOOT_URL = 'https://178.156.255.182.sslip.io'
const CHATWOOT_ACCOUNT_ID = '2'

export default function SessionsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/chatwoot/conversations?status=${filterStatus}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
        if (data.error) {
          setError(data.error)
        } else {
          setError(null)
        }
      }
    } catch (err) {
      console.error('Error cargando conversaciones:', err)
      setError('Error cargando conversaciones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [filterStatus])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus])

  // Paginación
  const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedConversations = conversations.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      resolved: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    const labels: Record<string, string> = {
      open: '🟢 Abierta',
      resolved: '✅ Resuelta',
      pending: '⏳ Pendiente',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    )
  }

  const chatwootLink = (conversationId: number) => 
    `${CHATWOOT_URL}/app/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💬 Sesiones</h1>
          <p className="text-gray-600 mt-2">Conversaciones del bot Sofia en Chatwoot</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-300 rounded hover:bg-blue-50"
          >
            ← Dashboard
          </Link>
          <Link 
            href="/prompt"
            className="text-sm text-purple-600 hover:text-purple-800 px-3 py-2 border border-purple-300 rounded hover:bg-purple-50"
          >
            📝 Prompt
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
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* Filtros */}
      <section className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">Todas</option>
              <option value="open">🟢 Abiertas</option>
              <option value="pending">⏳ Pendientes</option>
              <option value="resolved">✅ Resueltas</option>
            </select>
          </div>

          <div className="pt-5">
            <button
              onClick={loadConversations}
              className="text-blue-600 hover:text-blue-800 px-3 py-2"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </section>

      {/* Tabla de conversaciones */}
      <section className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">📞 Conversaciones</h2>
          {conversations.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, conversations.length)} de {conversations.length}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando conversaciones...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay conversaciones {filterStatus !== 'all' ? 'con ese estado' : ''}. 
            <br />
            <span className="text-sm">Verificá la conexión con Chatwoot.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último mensaje</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actividad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedConversations.map((conv) => (
                    <tr key={conv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {statusBadge(conv.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{conv.contactName}</div>
                        {conv.assignee && (
                          <div className="text-xs text-blue-600">👤 {conv.assignee}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{conv.phoneNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {conv.lastMessage || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(conv.lastActivityAt)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={chatwootLink(conv.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
                        >
                          🔗 Ver en Chatwoot
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
