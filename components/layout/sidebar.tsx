'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Swords, History, Shield, LogOut } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types'

interface SidebarProps {
  user: Pick<Profile, 'id' | 'username' | 'role' | 'avatar_url'> | null
}

const navLinks = [
  { href: '/',        label: 'Clasificación', icon: BarChart3 },
  { href: '/league',  label: 'Liga Activa',   icon: Swords    },
  { href: '/history', label: 'Historial',     icon: History   },
]

export function Sidebar({ user }: SidebarProps) {
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
    <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-16 lg:w-60 border-r border-sidebar-border bg-sidebar">

      {/* ── Brand ── */}
      <div className="flex items-center gap-3 h-16 px-3 lg:px-5 border-b border-sidebar-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md shadow-cyan-500/30 shrink-0">
          <Swords className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="hidden lg:flex flex-col overflow-hidden leading-tight">
          <span className="font-heading font-700 text-sm tracking-widest text-primary uppercase">
            Nuzlocke
          </span>
          <span className="font-light text-[9px] tracking-[0.30em] text-foreground/40 uppercase">
            Tracker
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="hidden lg:block truncate">{label}</span>
            </Link>
          )
        })}

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
              pathname === '/admin'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            {pathname === '/admin' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
            )}
            <Shield
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                pathname === '/admin' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
              strokeWidth={pathname === '/admin' ? 2.5 : 2}
            />
            <span className="hidden lg:block truncate">Admin</span>
          </Link>
        )}
      </nav>

      {/* ── User section ── */}
      <div className="border-t border-sidebar-border p-2 shrink-0 space-y-1">
        {user && (
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
          >
            <Avatar className="h-7 w-7 ring-1 ring-border/60 shrink-0 transition-all duration-200 group-hover:ring-primary/50">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] font-bold bg-muted">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block min-w-0">
              <p className="text-xs font-semibold truncate text-foreground/90">{user.username}</p>
              <p className="text-[10px] text-muted-foreground/60 capitalize">{user.role}</p>
            </div>
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden lg:block">Salir</span>
        </button>
      </div>
    </aside>
  )
}
