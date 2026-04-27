'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { CheckCircle, ArrowLeft, Home } from 'lucide-react'

function formatRef(id: string): string {
  // Convert first 8 chars of UUID to AB12-CD34 format
  const raw = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

function DonePage() {
  const params = useSearchParams()
  const ref = params.get('ref')
  const shortRef = ref ? formatRef(ref) : null

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <GlassCard highlighted className="p-8 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                <CheckCircle size={32} className="text-gold" />
              </div>
              <span className="absolute -top-1 -right-1">
                <ImpactDot size="md" />
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tight mb-3">
            Got it — thank you
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-4">
            I&apos;ll look at this personally. If you left your email, I&apos;ll drop you a note when it&apos;s been picked up.
          </p>

          {/* Tracking reference */}
          {shortRef && (
            <div className="bg-white/[0.04] rounded-xl px-4 py-3 mb-8 border border-white/[0.06]">
              <p className="text-white/35 text-xs font-mono mb-1">Your reference</p>
              <p className="text-gold font-mono font-bold text-lg tracking-widest">{shortRef}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/submit" className="btn-secondary w-full">
              <ArrowLeft size={15} />
              Submit another
            </Link>
            <Link href="/" className="btn-secondary w-full">
              <Home size={15} />
              Back to home
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}

export default function SubmitDonePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-md">
          <GlassCard highlighted className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                <CheckCircle size={32} className="text-gold" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">Got it — thank you</h1>
            <p className="text-white/55 text-sm leading-relaxed">
              I&apos;ll look at this personally. If you left your email, I&apos;ll drop you a note when it&apos;s been picked up.
            </p>
          </GlassCard>
        </div>
      </main>
    }>
      <DonePage />
    </Suspense>
  )
}
  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <GlassCard highlighted className="p-8 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                <CheckCircle size={32} className="text-gold" />
              </div>
              <span className="absolute -top-1 -right-1">
                <ImpactDot size="md" />
              </span>
            </div>
          </div>

          {/* Heading */}
          <p className="mono-label mb-3">Submission Received</p>
          <h1 className="text-2xl font-bold tracking-tight mb-3">
            Thanks for your input.
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8">
            Your submission has been logged and will be reviewed by the operations team.
            You&apos;ll see the outcome in the{' '}
            <Link href="/updates" className="text-gold underline underline-offset-2">
              Updates feed
            </Link>{' '}
            once it&apos;s actioned.
          </p>

          {/* What happens next */}
          <div className="bg-white/[0.04] rounded-xl p-4 text-left mb-8 border border-white/[0.06]">
            <p className="mono-label mb-3">What happens next</p>
            <ol className="space-y-2 text-sm text-white/55">
              <li className="flex gap-2">
                <span className="text-gold font-mono font-bold shrink-0">01</span>
                Admin reviews your submission within 48 hours.
              </li>
              <li className="flex gap-2">
                <span className="text-gold font-mono font-bold shrink-0">02</span>
                It&apos;s triaged, assigned, and tracked.
              </li>
              <li className="flex gap-2">
                <span className="text-gold font-mono font-bold shrink-0">03</span>
                When fixed, it appears in the &quot;From Feedback to Action&quot; feed.
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/submit" className="btn-secondary w-full">
              <ArrowLeft size={15} />
              Submit another
            </Link>
            <Link href="/" className="btn-secondary w-full">
              <Home size={15} />
              Back to home
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}
