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
  lastActivityAt: string | number
}

interface HetznerServer {
  id: number
  name: string
  status: string
  type: string
  typeName: string
  cores: number
  memory: number
  disk: number
  location: string
  country: string
  ip: string
  monthlyPrice: number
  currency: string
  created: string
}

interface InfrastructureData {
  servers: HetznerServer[]
  totalMonthlyCost: number
  currency: string
  provider: string
  fetchedAt: string
  error?: string
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
            href="https://178.156.255.182.sslip.io"
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
            href="https://178.156.255.182.sslip.io/app/accounts/2/conversations"
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
                    {formatDate(conv.lastActivityAt)}
                  </span>
                  <a
                    href={`https://178.156.255.182.sslip.io/app/accounts/2/conversations/${conv.id}`}
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

      {/* Infrastructure Costs */}
      <InfrastructureSection />

      {/* Bot Status */}
      <BotStatusSection />
    </main>
  )
}

function InfrastructureSection() {
  const [infraData, setInfraData] = useState<InfrastructureData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hetzner')
      .then(res => res.json())
      .then(data => {
        setInfraData(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching infrastructure data:', err)
        setIsLoading(false)
      })
  }, [])

  const statusBadge = (status: string) => {
    const isRunning = status === 'running'
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isRunning ? '🟢 Activo' : '🔴 ' + status}
      </span>
    )
  }

  return (
    <section className="mt-8 bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">☁️ Infraestructura</h2>
          <p className="text-sm text-gray-500">Servidores Hetzner Cloud</p>
        </div>
        {infraData && !infraData.error && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              €{infraData.totalMonthlyCost.toFixed(2)}<span className="text-sm font-normal text-gray-500">/mes</span>
            </div>
            <div className="text-xs text-gray-400">
              ~${(infraData.totalMonthlyCost * 1.08).toFixed(2)} USD
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">Cargando infraestructura...</div>
      ) : infraData?.error ? (
        <div className="p-6 text-center text-red-500">
          ⚠️ Error: {infraData.error}
        </div>
      ) : infraData?.servers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No hay servidores configurados
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {infraData?.servers.map(server => (
            <div key={server.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">🖥️ {server.name}</span>
                    {statusBadge(server.status)}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📍 {server.location}, {server.country}</span>
                    <span>💻 {server.type}</span>
                    <span>🔧 {server.cores} vCPU · {server.memory}GB RAM · {server.disk}GB SSD</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    IP: {server.ip}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    €{server.monthlyPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">por mes</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {infraData?.fetchedAt && (
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
          Actualizado: {formatDate(infraData.fetchedAt)}
        </div>
      )}
    </section>
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
