'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { ShieldAlert, Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin/dashboard'
  const configError = searchParams.get('error') === 'not_configured'
  const callbackError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const useSupabase = Boolean(supabaseUrl && supabaseAnonKey)

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!supabaseUrl || !supabaseAnonKey) throw new Error('Auth not configured.')

      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(from)}`
          : `/auth/callback?next=${encodeURIComponent(from)}`

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })

      if (signInError) throw new Error(signInError.message)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (configError) {
    return (
      <GlassCard className="p-6 text-center">
        <ShieldAlert size={28} className="text-danger mx-auto mb-3" />
        <h2 className="text-white font-semibold mb-2">Admin Not Configured</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Supabase environment variables are not set. Admin access is disabled.
        </p>
      </GlassCard>
    )
  }

  if (sent) {
    return (
      <GlassCard className="p-6 text-center">
        <CheckCircle2 size={28} className="text-success mx-auto mb-3" />
        <h2 className="text-white font-semibold mb-2">Check your email</h2>
        <p className="text-white/55 text-sm leading-relaxed">
          We sent a sign-in link to <span className="text-gold">{email}</span>.
          Click it to access the dashboard.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      {callbackError && callbackError !== 'not_configured' && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-sm mb-4">
          Sign-in failed. Please try again.
        </div>
      )}

      {useSupabase ? (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="mono-label" htmlFor="admin-email">
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ismael@arieFinance.com"
              required
              autoComplete="email"
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
            disabled={loading || !email.trim()}
            className="btn-primary w-full"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Sending…</>
            ) : (
              <><Mail size={16} /> Send magic link</>
            )}
          </button>

          <p className="text-white/25 text-xs text-center">
            You&apos;ll receive a sign-in link by email. No password needed.
          </p>
        </form>
      ) : (
        <LegacyPasswordForm from={from} />
      )}
    </GlassCard>
  )
}

function LegacyPasswordForm({ from }: { from: string }) {
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

      window.location.href = from
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="mono-label" htmlFor="admin-password">Admin Password</label>
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

      <button type="submit" disabled={loading || !password} className="btn-primary w-full">
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Signing in…</>
        ) : (
          <><ShieldAlert size={16} /> Sign In</>
        )}
      </button>

      <p className="text-white/25 text-xs text-center">
        This password is the ADMIN_API_SECRET set in environment variables.
      </p>
    </form>
  )
}

export default function AdminLoginPage() {
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

        <Suspense fallback={
          <GlassCard className="p-6 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white/40" />
          </GlassCard>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

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
              The <code className="text-gold text-xs">ADMIN_API_SECRET</code> environment
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
