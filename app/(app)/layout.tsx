import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import type { Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Pick<Profile, 'username' | 'role' | 'avatar_url'> | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, role, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="relative min-h-screen bg-background">

      {/* ── Ambient gradient — fixed, behind everything ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Light mode: soft lavender top, pale teal bottom */}
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-violet-100/40 via-sky-50/20 to-transparent dark:from-indigo-950/60 dark:via-blue-950/20 dark:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[400px] bg-gradient-to-t from-emerald-50/30 via-transparent to-transparent dark:from-slate-950/60 dark:to-transparent" />
        {/* Dark mode: deep blue radial glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-indigo-500/0 dark:bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-teal-500/0 dark:bg-teal-500/4 blur-3xl" />
      </div>

      <Navbar user={profile} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
