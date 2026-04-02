import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { ThemeToggle } from './theme-toggle'
import { Users, CalendarDays, Monitor, Upload, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/onboarding/weekly', label: 'Weekly', icon: CalendarDays },
  { href: '/hardware', label: 'Hardware', icon: Monitor },
  { href: '/admin/import', label: 'Import', icon: Upload },
]

export async function Navbar() {
  const session = await auth()
  const userInitials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold shrink-0">
          <Users className="h-5 w-5" />
          <span>Roster</span>
        </Link>

        <nav className="flex items-center gap-1 ml-4">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/auth/signin' })
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
