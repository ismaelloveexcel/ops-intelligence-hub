import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import { CheckCircle, ArrowLeft, Home } from 'lucide-react'

export default function SubmitDonePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <GlassCard highlighted className="p-8 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-teal/10 border border-teal/25 flex items-center justify-center">
                <CheckCircle size={32} className="text-teal" />
              </div>
              <span className="absolute -top-1 -right-1">
                <ImpactDot size="md" />
              </span>
            </div>
          </div>

          {/* Heading */}
          <p className="mono-label mb-3">Submission Received</p>
          <h1 className="text-2xl font-bold tracking-tight mb-3">
            Thanks for speaking up.
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8">
            Your submission has been logged and will be reviewed by the operations team.
            You&apos;ll see the outcome in the{' '}
            <Link href="/updates" className="text-teal underline underline-offset-2">
              Updates feed
            </Link>{' '}
            once it&apos;s actioned.
          </p>

          {/* What happens next */}
          <div className="bg-white/[0.04] rounded-xl p-4 text-left mb-8 border border-white/[0.06]">
            <p className="mono-label mb-3">What happens next</p>
            <ol className="space-y-2 text-sm text-white/55">
              <li className="flex gap-2">
                <span className="text-teal font-mono font-bold shrink-0">01</span>
                Admin reviews your submission within 48 hours.
              </li>
              <li className="flex gap-2">
                <span className="text-teal font-mono font-bold shrink-0">02</span>
                It&apos;s triaged, assigned, and tracked.
              </li>
              <li className="flex gap-2">
                <span className="text-teal font-mono font-bold shrink-0">03</span>
                When fixed, it appears in the &quot;You Said / We Fixed&quot; feed.
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/submit" className="btn-secondary w-full">
              <ArrowLeft size={15} />
              Submit another issue
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
