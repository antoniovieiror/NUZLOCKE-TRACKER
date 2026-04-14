import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { NotificationEnvelope } from '@/components/notification-envelope'
import { getUnreadNotifications } from '@/lib/actions/notifications'
import type { Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Pick<Profile, 'id' | 'username' | 'role' | 'avatar_url'> | null = null
  const unreadNotifications = user ? await getUnreadNotifications() : []

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="relative min-h-screen bg-background">

      {/* ── Topographic SVG background (dark mode) ── */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 hidden dark:block"
        aria-hidden
        style={{
          backgroundImage: 'url(/topo-pattern.svg)',
          backgroundSize: '600px 600px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ── Atmospheric depth ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Light mode subtle gradient */}
        <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-blue-50/50 via-indigo-50/20 to-transparent dark:from-transparent" />
        {/* Dark mode multi-layer glow */}
        <div className="absolute inset-x-0 top-0 h-[500px] opacity-0 dark:opacity-100 bg-gradient-to-b from-indigo-950/50 via-blue-950/20 to-transparent" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-[300px] w-[1000px] rounded-full bg-blue-600/0 dark:bg-blue-600/4 blur-3xl" />
        <div className="absolute top-1/4 -right-32 h-[600px] w-[400px] rounded-full bg-violet-500/0 dark:bg-violet-500/3 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-[400px] w-[500px] rounded-full bg-indigo-600/0 dark:bg-indigo-600/3 blur-3xl" />
      </div>

      <Navbar user={profile} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>

      {unreadNotifications.length > 0 && (
        <NotificationEnvelope notifications={unreadNotifications} />
      )}
    </div>
  )
}
