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
    <div className="dark relative min-h-screen bg-background flex flex-col">

      {/* ── Geometric grid (Unova urban) ── */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(oklch(0.762 0.148 200 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(0.762 0.148 200 / 0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Atmospheric depth glows ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/4 h-[500px] w-[700px] rounded-full bg-cyan-600/5 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-[400px] w-[400px] rounded-full bg-cyan-500/4 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-[300px] w-[500px] rounded-full bg-blue-700/4 blur-3xl" />
      </div>

      {/* ── Top Navbar ── */}
      <Navbar user={profile} />

      {/* ── Main content ── */}
      <main className="flex-1">
        <div className="container mx-auto px-5 py-8 max-w-5xl">
          {children}
        </div>
      </main>

      {unreadNotifications.length > 0 && (
        <NotificationEnvelope notifications={unreadNotifications} />
      )}
    </div>
  )
}
