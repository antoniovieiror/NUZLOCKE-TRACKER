'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Swords, History, Shield, LogOut } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types'

interface NavbarProps {
  user: Pick<Profile, 'id' | 'username' | 'role' | 'avatar_url'> | null
}

const navLinks = [
  { href: '/',        label: 'Clasificación', icon: BarChart3 },
  { href: '/league',  label: 'Liga Activa',   icon: Swords    },
  { href: '/history', label: 'Historial',     icon: History   },
]

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

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
    <header
      className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-5 gap-4"
      style={{
        background: 'linear-gradient(180deg, oklch(0.098 0.022 262) 0%, oklch(0.072 0.018 262) 100%)',
        borderBottom: '1px solid rgba(0,200,232,0.14)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,200,232,0.5) 40%, rgba(0,200,232,0.5) 60%, transparent 100%)' }}
      />

      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div
          className="flex h-7 w-7 items-center justify-center rounded"
          style={{
            background: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
            boxShadow: '0 0 10px rgba(0,200,232,0.40), inset 0 1px 0 rgba(255,255,255,0.20)',
          }}
        >
          <Swords className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none gap-px">
          <span className="font-heading font-bold text-xs tracking-[0.22em] uppercase" style={{ color: '#00c8e8' }}>
            Nuzlocke
          </span>
          <span className="text-[8px] tracking-[0.38em] uppercase font-light text-white/25">
            Tracker
          </span>
        </div>
      </Link>

      {/* Vertical divider */}
      <div className="h-5 w-px bg-white/8 shrink-0" />

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 flex-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
              style={isActive ? {
                background: 'linear-gradient(180deg, rgba(0,200,232,0.09), rgba(0,200,232,0.04))',
                boxShadow: 'inset 0 0 0 1px rgba(0,200,232,0.18)',
              } : undefined}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden sm:block">{label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 inset-x-1 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #00c8e8, transparent)' }}
                />
              )}
            </Link>
          )
        })}

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150',
              pathname === '/admin' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
            style={pathname === '/admin' ? {
              background: 'linear-gradient(180deg, rgba(0,200,232,0.09), rgba(0,200,232,0.04))',
              boxShadow: 'inset 0 0 0 1px rgba(0,200,232,0.18)',
            } : undefined}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={pathname === '/admin' ? 2.5 : 2} />
            <span className="hidden sm:block">Admin</span>
            {pathname === '/admin' && (
              <span
                className="absolute bottom-0 inset-x-1 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #00c8e8, transparent)' }}
              />
            )}
          </Link>
        )}
      </nav>

      {/* User + logout */}
      <div className="flex items-center gap-1.5 shrink-0">
        {user && (
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-2 px-2 py-1 rounded transition-all hover:bg-white/5"
          >
            <Avatar className="h-6 w-6 ring-1 ring-border/50">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px] font-bold bg-muted">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-foreground/60 hidden md:block max-w-[100px] truncate">
              {user.username}
            </span>
          </Link>
        )}

        <div className="h-4 w-px bg-white/8" />

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-150"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
