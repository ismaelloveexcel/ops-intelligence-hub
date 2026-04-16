'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { ShieldAlert, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin'
  const configError = searchParams.get('error') === 'not_configured'

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Login failed.')
      }

      // Cookie is set by the API — redirect to the intended page
      router.push(from)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ImpactDot />
            <p className="mono-label">Admin Access</p>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Ops Intelligence Hub</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to access admin tools.</p>
        </div>

        {configError ? (
          <GlassCard className="p-6 text-center">
            <ShieldAlert size={28} className="text-danger mx-auto mb-3" />
            <h2 className="text-white font-semibold mb-2">Admin Not Configured</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              The <code className="text-teal text-xs">ADMIN_API_SECRET</code> environment
              variable is not set. Admin access is disabled until it is configured.
            </p>
          </GlassCard>
        ) : (
          <GlassCard className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="mono-label" htmlFor="admin-password">
                  Admin Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                  className="input"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} /> Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-white/25 text-xs text-center mt-4">
              This password is the ADMIN_API_SECRET set in environment variables.
            </p>
          </GlassCard>
        )}
      </div>
    </main>
  )
}
