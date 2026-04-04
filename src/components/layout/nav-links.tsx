'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  PauseCircle,
  UserX,
  Monitor,
  Upload,
} from 'lucide-react'

// Defined here (client component) so icon functions never cross the server/client boundary
const NAV_LINKS = [
  { href: '/dashboard',         label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/onboarding/weekly', label: 'Weekly',      icon: CalendarDays    },
  { href: '/contractors',       label: 'Contractors', icon: ClipboardList   },
  { href: '/loa',               label: 'LOA',         icon: PauseCircle     },
  { href: '/offboarding',       label: 'Offboarding', icon: UserX           },
  { href: '/hardware',          label: 'Hardware',    icon: Monitor         },
  { href: '/admin/import',      label: 'Import',      icon: Upload          },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-0.5">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
            )}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-primary')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
