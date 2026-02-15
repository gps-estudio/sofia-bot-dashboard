import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sofia Bot Dashboard - GPS Estudio',
  description: 'Dashboard de control para el bot Sofia de cobranzas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
