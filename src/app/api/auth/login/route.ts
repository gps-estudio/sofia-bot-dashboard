import { NextRequest, NextResponse } from 'next/server'

const VALID_USERNAME = process.env.DASHBOARD_USER || 'admin'
const VALID_PASSWORD = process.env.DASHBOARD_PASSWORD || 'gps2026'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('auth', username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}
