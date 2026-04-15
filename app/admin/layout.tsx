import { cookies } from 'next/headers'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const isAuthenticated = !!cookieStore.get('ops-admin-token')?.value

  return (
    <>
      {isAuthenticated && (
        <div className="fixed top-3 right-3 z-50">
          <Link
            href="/api/auth/admin-logout"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       border border-white/10 bg-white/[0.04] text-white/40
                       text-xs font-mono hover:text-white/70 hover:border-white/20
                       transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </Link>
        </div>
      )}
      {children}
    </>
  )
}
