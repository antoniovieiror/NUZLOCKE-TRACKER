import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { Profile, League, GlobalNotification } from '@/lib/types'
import { listNotifications } from '@/lib/actions/notifications'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import { UsersPanel } from './_components/users-panel'
import { LeaguesPanel } from './_components/leagues-panel'
import { NotificationsPanel } from './_components/notifications-panel'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Gate: admin only
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'admin') redirect('/')

  // Parallel fetches
  const [{ data: usersRaw }, { data: leaguesRaw }, { data: matchStatsRaw }, notifications] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, role, status, avatar_url, created_at')
        .order('created_at', { ascending: true }),
      supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('matches').select('league_id, status'),
      listNotifications(),
    ])

  const users = (usersRaw ?? []) as Pick<
    Profile,
    'id' | 'username' | 'role' | 'status' | 'avatar_url' | 'created_at'
  >[]
  const leagues = (leaguesRaw ?? []) as League[]
  const matchStats = (matchStatsRaw ?? []) as { league_id: string; status: string }[]

  const activePlayerCount = users.filter((u) => u.status === 'active').length

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-500 shrink-0" />
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage players, leagues, and match outcomes
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Players ({users.length})</TabsTrigger>
          <TabsTrigger value="leagues">Leagues ({leagues.length})</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {notifications.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-bold">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersPanel users={users} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="leagues" className="mt-4">
          <LeaguesPanel
            leagues={leagues}
            matchStats={matchStats}
            activePlayerCount={activePlayerCount}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationsPanel initialNotifications={notifications as GlobalNotification[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
