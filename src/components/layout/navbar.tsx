import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { ThemeToggle } from './theme-toggle'
import { NavLinks } from './nav-links'
import {
  Users,
  CalendarDays,
  Monitor,
  Upload,
  LayoutDashboard,
  Terminal,
  ClipboardList,
  PauseCircle,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navLinks = [
  { href: '/dashboard',       label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/onboarding/weekly', label: 'Weekly',    icon: CalendarDays    },
  { href: '/contractors',     label: 'Contractors', icon: ClipboardList   },
  { href: '/loa',             label: 'LOA',         icon: PauseCircle     },
  { href: '/offboarding',     label: 'Offboarding', icon: UserX           },
  { href: '/hardware',        label: 'Hardware',    icon: Monitor         },
  { href: '/admin/import',    label: 'Import',      icon: Upload          },
]

const devBypass = process.env.AUTH_DEV_BYPASS === 'true'

export async function Navbar() {
  const session = await auth()
  const userInitials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Dev-mode banner */}
      {devBypass && (
        <div className="flex items-center justify-center gap-1.5 bg-yellow-400 dark:bg-yellow-600 py-1 px-4 text-xs font-medium text-yellow-900 dark:text-yellow-100">
          <Terminal className="h-3 w-3 shrink-0" />
          DEV MODE — JumpCloud auth is bypassed. Do not use in production.
        </div>
      )}

      {/* Main nav bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">

          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold shrink-0 text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Users className="h-4 w-4" />
            </div>
            <span className="tracking-tight">Roster</span>
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-border shrink-0" />

          {/* Nav links — client component for active state */}
          <NavLinks links={navLinks} />

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />

            <div className="h-5 w-px bg-border mx-1 shrink-0" />

            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 ring-1 ring-border">
                <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/auth/signin' })
                }}
              >
                <Button variant="ghost" size="sm" type="submit" className="h-7 text-xs text-muted-foreground hover:text-foreground px-2">
                  Sign out
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
