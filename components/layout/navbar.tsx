'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Shield, Swords, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types'

interface NavbarProps {
  user: Pick<Profile, 'id' | 'username' | 'role' | 'avatar_url'> | null
}

const navLinks = [
  { href: '/',        label: 'Clasificación' },
  { href: '/league',  label: 'Liga Activa' },
  { href: '/history', label: 'Historial' },
]

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for theme icon
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error al cerrar sesión', { description: error.message })
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-6xl flex h-14 items-center justify-between gap-4">

        {/* ── Brand ── */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-sm tracking-tight shrink-0 group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/30 transition-transform duration-200 group-hover:scale-110">
            <Swords className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="hidden sm:block">
            <span className="bg-gradient-to-r from-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
              Nuzlocke
            </span>
            {' '}
            <span className="text-foreground">Tracker</span>
          </span>
        </Link>

        {/* ── Nav links ── */}
        <nav className="flex items-center gap-0.5">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {label}
                {isActive && (
                  <span className="absolute inset-x-3 bottom-0 h-px rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                )}
              </Link>
            )
          })}

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === '/admin'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
              {pathname === '/admin' && (
                <span className="absolute inset-x-3 bottom-0 h-px rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
              )}
            </Link>
          )}
        </nav>

        {/* ── Right side ── */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Dark mode toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {user && (
            <Link
              href={`/profile/${user.id}`}
              className="hidden sm:flex items-center gap-2 pl-1 group"
            >
              <Avatar className="h-6 w-6 transition-transform duration-200 group-hover:scale-110">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors select-none">
                {user.username}
              </span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>

      </div>
    </header>
  )
}
