'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
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
