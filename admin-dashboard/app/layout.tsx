import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Telegram Referral Admin Dashboard',
  description: 'Admin dashboard for Telegram referral system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
