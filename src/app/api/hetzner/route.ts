import { NextResponse } from 'next/server'

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN

export const dynamic = 'force-dynamic'

interface HetznerServer {
  id: number
  name: string
  status: string
  server_type: {
    name: string
    description: string
    cores: number
    memory: number
    disk: number
    prices: Array<{
      location: string
      price_monthly: {
        gross: string
        net: string
      }
    }>
  }
  datacenter: {
    name: string
    location: {
      name: string
      city: string
      country: string
    }
  }
  public_net: {
    ipv4: {
      ip: string
    }
  }
  created: string
}

export async function GET() {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json({
      error: 'Hetzner API token no configurado',
      servers: []
    })
  }

  try {
    const response = await fetch('https://api.hetzner.cloud/v1/servers', {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Hetzner API error: ${response.status}`)
    }

    const data = await response.json()
    const servers: HetznerServer[] = data.servers || []

    // Calcular costos totales
    let totalMonthlyCost = 0
    const serverDetails = servers.map(server => {
      // Buscar el precio para la ubicación del servidor
      const locationCode = server.datacenter?.location?.name?.toLowerCase() || ''
      const prices = server.server_type?.prices || []
      
      // Mapear ubicación de datacenter a código de precio
      const locationMap: Record<string, string> = {
        'ash': 'ash',      // Ashburn
        'hil': 'hil',      // Hillsboro
        'fsn1': 'fsn1',    // Falkenstein
        'nbg1': 'nbg1',    // Nuremberg
        'hel1': 'hel1',    // Helsinki
      }
      
      const priceLocation = locationMap[locationCode] || locationCode
      const priceInfo = prices.find(p => p.location === priceLocation) || prices[0]
      const monthlyPrice = priceInfo ? parseFloat(priceInfo.price_monthly.gross) : 0
      
      totalMonthlyCost += monthlyPrice

      return {
        id: server.id,
        name: server.name,
        status: server.status,
        type: server.server_type?.description || server.server_type?.name,
        typeName: server.server_type?.name,
        cores: server.server_type?.cores,
        memory: server.server_type?.memory,
        disk: server.server_type?.disk,
        location: server.datacenter?.location?.city || server.datacenter?.name,
        country: server.datacenter?.location?.country,
        ip: server.public_net?.ipv4?.ip,
        monthlyPrice: monthlyPrice,
        currency: 'EUR',
        created: server.created,
      }
    })

    return NextResponse.json({
      servers: serverDetails,
      totalMonthlyCost,
      currency: 'EUR',
      provider: 'Hetzner Cloud',
      fetchedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching Hetzner data:', error)
    return NextResponse.json({
      error: error.message,
      servers: []
    })
  }
}
