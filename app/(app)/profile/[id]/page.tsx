import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Skull, Shield, Zap, Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { Profile, LeaderboardEntry } from '@/lib/types'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { AvatarUpload } from './_components/avatar-upload'
import { UsernameEditor } from './_components/username-editor'
import { EditStateDialog } from './_components/edit-state-dialog'
import { PokemonSection } from './_components/pokemon-section'
import { MvpCard, MvpEmpty } from './_components/mvp-card'
import { SaveSyncWidget } from './_components/save-sync-widget'

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, accentBar,
}: {
  label: string; value: string | number; sub?: string; accent?: string; accentBar?: string
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/50">
      {accentBar && <div className={cn('h-0.5 w-full', accentBar)}/>}
      <CardContent className="pt-4 pb-4 px-5">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className={cn('text-2xl font-black tabular-nums', accent)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Trainer card header ───────────────────────────────────────────────────────

function TrainerCardHeader({
  profile, stats, canEdit, isOwnProfile,
}: {
  profile: Profile
  stats: LeaderboardEntry | null
  canEdit: boolean
  isOwnProfile: boolean
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl">
      {/* SVG trainer card background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 900 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="tcBase" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0A0E20"/>
            <stop offset="100%" stopColor="#06080F"/>
          </linearGradient>
          <radialGradient id="tcGlow" cx="15%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="tcRight" cx="90%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="900" height="200" fill="url(#tcBase)"/>
        <rect width="900" height="200" fill="url(#tcGlow)"/>
        <rect width="900" height="200" fill="url(#tcRight)"/>
        {/* Terrain contours */}
        <g stroke="rgba(255,255,255,0.022)" strokeWidth="0.6" fill="none">
          <ellipse cx="150" cy="100" rx="130" ry="90"/>
          <ellipse cx="150" cy="100" rx="96" ry="66"/>
          <ellipse cx="150" cy="100" rx="64" ry="44"/>
          <ellipse cx="750" cy="80" rx="110" ry="76"/>
          <ellipse cx="750" cy="80" rx="78" ry="52"/>
          <ellipse cx="750" cy="80" rx="48" ry="32"/>
        </g>
        {/* Corner decorations */}
        <circle cx="850" cy="160" r="80" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.7"/>
        <circle cx="850" cy="160" r="55" fill="none" stroke="rgba(255,255,255,0.020)" strokeWidth="0.6"/>
        <line x1="870" y1="100" x2="900" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
        <line x1="900" y1="0" x2="820" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
        {/* Stars */}
        {[[60,20],[140,15],[300,25],[500,18],[700,22],[800,12],[880,30]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="0.7" fill="white" opacity={0.2+(i%3)*0.08}/>
        ))}
      </svg>

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500/60 via-amber-400/40 to-violet-500/60"/>

      {/* Content */}
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 p-6">
        <AvatarUpload
          profileId={profile.id}
          avatarUrl={profile.avatar_url}
          username={profile.username}
          canEdit={canEdit}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <UsernameEditor profileId={profile.id} initialUsername={profile.username} canEdit={canEdit}/>
            {profile.role === 'admin' && (
              <Badge variant="secondary" className="gap-1 text-xs bg-blue-500/15 text-blue-400 border-blue-500/20 dark:bg-blue-500/15">
                <Shield className="h-3 w-3"/>Admin
              </Badge>
            )}
            {profile.status === 'inactive' && (
              <Badge variant="outline" className="text-white/40 border-white/15 text-xs">Inactivo</Badge>
            )}
            {isOwnProfile && (
              <Badge variant="outline" className="text-white/30 border-white/10 text-xs">Tú</Badge>
            )}
          </div>
          <p className="text-sm text-white/40">
            Entrenador desde{' '}
            {new Date(profile.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
          </p>
          {stats && stats.total_points > 0 && (
            <p className="text-xs text-amber-400/70 mt-1 font-bold">
              {stats.total_points} pts · {stats.total_wins}V {stats.total_losses}D · {Number(stats.winrate).toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Gym badges ───────────────────────────────────────────────────────────────

function GymBadges({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          i < count
            ? 'bg-amber-400 border-amber-500 dark:bg-amber-500 dark:border-amber-400 shadow shadow-amber-400/40'
            : 'bg-muted/50 border-border/50 opacity-30'
        )}>
          {i < count && <Star className="h-2.5 w-2.5 text-amber-950 fill-amber-950" strokeWidth={0}/>}
        </div>
      ))}
      <span className="text-xs text-muted-foreground ml-1 self-center tabular-nums">{count}/12</span>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [profileResult, statsResult, userResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('leaderboard').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (profileResult.error || !profileResult.data) notFound()

  const profile = profileResult.data as Profile
  const stats = statsResult.data as LeaderboardEntry | null
  const currentUser = userResult.data.user

  let currentUserRole: 'admin' | 'player' = 'player'
  if (currentUser) {
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
    currentUserRole = currentProfile?.role ?? 'player'
  }

  const canEdit = !!currentUser && (currentUser.id === profile.id || currentUserRole === 'admin')
  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="space-y-6 pb-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4"/>Clasificación
      </Link>

      {/* ── Trainer card header ── */}
      <TrainerCardHeader profile={profile} stats={stats} canEdit={canEdit} isOwnProfile={isOwnProfile}/>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Puntos Totales" value={stats?.total_points ?? 0} sub="en todas las ligas" accent="text-amber-600 dark:text-amber-400" accentBar="bg-gradient-to-r from-amber-400 to-amber-500"/>
        <StatCard label="Victorias" value={stats?.total_wins ?? 0} accent="text-green-600 dark:text-green-400" accentBar="bg-gradient-to-r from-green-400 to-emerald-500"/>
        <StatCard label="Derrotas" value={stats?.total_losses ?? 0} accent="text-red-500 dark:text-red-400" accentBar="bg-gradient-to-r from-red-400 to-rose-500"/>
        <StatCard
          label="% Victorias"
          value={`${Number(stats?.winrate ?? 0).toFixed(1)}%`}
          sub={(stats?.total_wins ?? 0) + (stats?.total_losses ?? 0) > 0 ? `${(stats?.total_wins ?? 0) + (stats?.total_losses ?? 0)} partidas` : 'Sin partidas aún'}
          accentBar="bg-gradient-to-r from-violet-400 to-blue-500"
        />
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">

        {/* Nuzlocke state */}
        <Card className="self-start overflow-hidden border-border/50">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold">Estado Nuzlocke</CardTitle>
            {canEdit && (
              <EditStateDialog
                profileId={profile.id}
                initialValues={{ badges: profile.badges, deaths: profile.deaths, wipes: profile.wipes, notes: profile.notes }}
              />
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Medallas de Gimnasio</p>
              <GymBadges count={profile.badges}/>
            </div>
            <Separator className="opacity-40"/>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Skull className="h-4 w-4 text-muted-foreground"/>Muertes
              </div>
              <span className={cn('text-xl font-black tabular-nums', profile.deaths > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground')}>
                {profile.deaths}
              </span>
            </div>
            <Separator className="opacity-40"/>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="h-4 w-4 text-muted-foreground"/>Wipes
              </div>
              <span className={cn('text-xl font-black tabular-nums', profile.wipes > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground')}>
                {profile.wipes}
              </span>
            </div>
            <Separator className="opacity-40"/>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">MVP</p>
              {profile.mvp ? (
                <MvpCard species={profile.mvp} nickname={profile.team.find((e) => e.species === profile.mvp)?.nickname ?? ''}/>
              ) : (
                <MvpEmpty/>
              )}
            </div>
            <Separator className="opacity-40"/>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Notas</p>
              {profile.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/80">{profile.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Sin notas todavía.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team + Box + Save sync */}
        <div className="space-y-4">
          <PokemonSection
            profileId={profile.id}
            initialTeam={profile.team}
            initialBox={profile.box}
            initialMvp={profile.mvp}
            canEdit={canEdit}
          />
          {canEdit && (
            <SaveSyncWidget
              profileId={profile.id}
              saveSyncedAt={profile.save_synced_at ?? null}
              saveSyncStatus={profile.save_sync_status ?? 'never'}
              saveParseError={profile.save_parse_error ?? null}
            />
          )}
        </div>
      </div>
    </div>
  )
}
