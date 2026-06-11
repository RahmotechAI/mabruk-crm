import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mabruk CRM — Птицефабрика',
  description: 'Система учёта продаж и складского учёта',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
