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

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'admin') redirect('/')

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

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-lg p-6">
        {/* Subtle background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, oklch(0.108 0.022 262) 0%, oklch(0.090 0.020 262) 100%)',
          }}
        />
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary/50 via-cyan-300/60 to-primary/50"/>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 shrink-0">
            <Shield className="h-5 w-5 text-primary" strokeWidth={2}/>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-700 tracking-widest uppercase text-foreground">
              Admin Panel
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona jugadores, ligas y resultados de partidas
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="bg-muted/30 border border-border/40">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Jugadores ({users.length})
          </TabsTrigger>
          <TabsTrigger
            value="leagues"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Ligas ({leagues.length})
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Notificaciones
            {notifications.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
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
