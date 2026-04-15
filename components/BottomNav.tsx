'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Lightbulb, FileText, BarChart3, LayoutGrid } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Lightbulb, label: 'Improve', href: '/submit' },
  { icon: FileText, label: 'Updates', href: '/updates' },
  { icon: BarChart3, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: LayoutGrid, label: 'Admin', href: '/admin' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
        const isActive =
          href === '/'
            ? pathname === '/'
            : pathname.startsWith(href)

        return (
          <Link key={label} href={href} className="bottom-nav-item">
            <div className="bottom-nav-icon-wrap">
              <Icon
                size={20}
                className={isActive ? 'text-teal' : 'text-white/40'}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
            </div>
            <span className={`bottom-nav-label ${isActive ? 'text-teal' : 'text-white/40'}`}>
              {label}
            </span>
            {isActive && <span className="bottom-nav-dot" />}
          </Link>
        )
      })}
    </nav>
  )
}
