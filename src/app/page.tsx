'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  totalConversations: number
  openConversations: number
  resolvedToday: number
  pendingConversations: number
}

interface RecentConversation {
  id: number
  contactName: string
  phoneNumber: string
  status: 'open' | 'resolved' | 'pending'
  lastMessage: string
  lastActivityAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, convsRes] = await Promise.all([
        fetch('/api/chatwoot/stats'),
        fetch('/api/chatwoot/conversations?limit=5')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (convsRes.ok) {
        const convsData = await convsRes.json()
        setRecentConversations(convsData.conversations || [])
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError('Error cargando datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

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

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🤖 Sofia Bot Dashboard</h1>
          <p className="text-gray-600 mt-2">Control y monitoreo del bot de cobranzas GPS</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/sessions"
            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-300 rounded hover:bg-blue-50"
          >
            💬 Sesiones
          </Link>
          <Link 
            href="/prompt"
            className="text-sm text-purple-600 hover:text-purple-800 px-3 py-2 border border-purple-300 rounded hover:bg-purple-50"
          >
            📝 Prompt
          </Link>
          <a 
            href="https://34.170.148.211.nip.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:text-green-800 px-3 py-2 border border-green-300 rounded hover:bg-green-50"
          >
            🔗 Chatwoot
          </a>
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
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : stats?.totalConversations || 0}
          </div>
          <div className="text-sm text-gray-600">Total Conversaciones</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="text-3xl font-bold text-green-600">
            {isLoading ? '...' : stats?.openConversations || 0}
          </div>
          <div className="text-sm text-green-700">🟢 Abiertas</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600">
            {isLoading ? '...' : stats?.pendingConversations || 0}
          </div>
          <div className="text-sm text-yellow-700">⏳ Pendientes</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">
            {isLoading ? '...' : stats?.resolvedToday || 0}
          </div>
          <div className="text-sm text-blue-700">✅ Resueltas Hoy</div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/sessions"
            className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <span className="text-2xl">💬</span>
            <span className="text-sm font-medium">Ver Sesiones</span>
          </Link>
          <Link
            href="/prompt"
            className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <span className="text-2xl">📝</span>
            <span className="text-sm font-medium">Editar Prompt</span>
          </Link>
          <a
            href="https://34.170.148.211.nip.io/app/accounts/2/conversations"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <span className="text-2xl">🔗</span>
            <span className="text-sm font-medium">Abrir Chatwoot</span>
          </a>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl">🔄</span>
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>
      </section>

      {/* Recent Conversations */}
      <section className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">📞 Conversaciones Recientes</h2>
          <Link href="/sessions" className="text-sm text-blue-600 hover:text-blue-800">
            Ver todas →
          </Link>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : recentConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay conversaciones recientes. Conectá con Chatwoot para ver las sesiones.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentConversations.map((conv) => (
              <div key={conv.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{conv.contactName || 'Sin nombre'}</span>
                    {statusBadge(conv.status)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {conv.phoneNumber} • {conv.lastMessage?.slice(0, 50)}...
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(conv.lastActivityAt).toLocaleString('es-AR')}
                  </span>
                  <a
                    href={`https://34.170.148.211.nip.io/app/accounts/2/conversations/${conv.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    🔗 Ver
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bot Status */}
      <BotStatusSection />
    </main>
  )
}

function BotStatusSection() {
  const [botConfig, setBotConfig] = useState<{model: string} | null>(null)

  useEffect(() => {
    fetch('/api/prompt')
      .then(res => res.json())
      .then(data => setBotConfig({ model: data.model || 'gpt-4o-mini' }))
      .catch(() => setBotConfig({ model: 'gpt-4o-mini' }))
  }, [])

  return (
    <section className="mt-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🤖 Estado del Bot</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Modelo LLM</div>
          <div className="font-semibold text-gray-900">{botConfig?.model || '...'}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">WhatsApp</div>
          <div className="font-semibold text-gray-900">+54 9 11 7374-0109</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Estado</div>
          <div className="font-semibold text-green-600">🟢 Activo</div>
        </div>
      </div>
    </section>
  )
}
