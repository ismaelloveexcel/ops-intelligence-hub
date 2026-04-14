'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Mail, FileText, LayoutGrid, QrCode } from 'lucide-react'

const NAV_ITEMS = [
  { icon: MessageSquare, label: 'Home', href: '/' },
  { icon: Mail, label: 'Submit', href: '/submit' },
  { icon: FileText, label: 'Updates', href: '/updates' },
  { icon: LayoutGrid, label: 'Admin', href: '/admin' },
  { icon: QrCode, label: 'QR', href: '#' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
        const isActive =
          href === '/'
            ? pathname === '/'
            : href !== '#' && pathname.startsWith(href)

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
