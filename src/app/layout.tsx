import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/layout/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roster',
  description: 'Employee Database & Onboarding Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="zinc"
          themes={['zinc', 'dark', 'midnight', 'obsidian', 'arctic', 'forest', 'noir', 'copper', 'petal', 'dusk']}
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
