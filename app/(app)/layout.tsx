import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Pick<Profile, 'id' | 'username' | 'role' | 'avatar_url'> | null = null

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

      {/* ── Topographic pattern — dark mode only ── */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 hidden dark:block topo-lines opacity-100"
        aria-hidden
      />

      {/* ── Atmospheric depth layers ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Light mode: clean cool gradient */}
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-blue-50/60 via-indigo-50/20 to-transparent dark:from-transparent dark:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-slate-50/40 to-transparent dark:from-transparent dark:to-transparent" />

        {/* Dark mode: deep radial glows that complement the topo pattern */}
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-blue-950/40 via-indigo-950/15 to-transparent opacity-0 dark:opacity-100" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[400px] w-[900px] rounded-full bg-blue-600/0 dark:bg-blue-600/4 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-[500px] w-[500px] rounded-full bg-indigo-500/0 dark:bg-indigo-500/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[600px] rounded-full bg-violet-500/0 dark:bg-violet-500/3 blur-3xl" />
      </div>

      <Navbar user={profile} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
