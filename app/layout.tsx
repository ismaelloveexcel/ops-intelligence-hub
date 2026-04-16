import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Ops Intelligence Hub — ARIE Finance',
  description: 'Internal portal for surfacing and resolving operational pain points.',
  robots: 'noindex, nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="page-bg has-bottom-nav">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
