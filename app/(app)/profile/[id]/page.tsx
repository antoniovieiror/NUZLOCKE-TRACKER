import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Skull, Shield, Zap } from 'lucide-react'

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

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  borderColor,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  borderColor?: string
}) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {borderColor && <div className={cn('h-0.5 w-full', borderColor)} />}
      <CardContent className="pt-4 pb-4 px-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={cn('text-2xl font-bold tabular-nums', accent)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Gym badge visual ──────────────────────────────────────────────────────────

function GymBadges({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
            i < count
              ? 'bg-amber-400 border-amber-500 dark:bg-amber-500 dark:border-amber-400 shadow-md shadow-amber-400/40 dark:shadow-amber-500/30'
              : 'bg-muted border-border opacity-40'
          )}
        >
          {i < count && <span className="text-[8px] font-bold text-amber-900">✦</span>}
        </div>
      ))}
      <span className="text-sm text-muted-foreground ml-1 self-center">{count}/12</span>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    currentUserRole = currentProfile?.role ?? 'player'
  }

  const canEdit = !!currentUser && (currentUser.id === profile.id || currentUserRole === 'admin')
  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="space-y-6 pb-10">

      {/* ── Back link ── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Clasificación
      </Link>

      {/* ── Profile header ── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-violet-50 via-sky-50/50 to-emerald-50/30 dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-slate-900/60 p-5 shadow-sm">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-300/10 dark:bg-amber-500/5 blur-2xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar — client component handles upload */}
          <AvatarUpload
            profileId={profile.id}
            avatarUrl={profile.avatar_url}
            username={profile.username}
            canEdit={canEdit}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Username — client component handles inline edit */}
              <UsernameEditor
                profileId={profile.id}
                initialUsername={profile.username}
                canEdit={canEdit}
              />

              {profile.role === 'admin' && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {profile.status === 'inactive' && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactivo
                </Badge>
              )}
              {isOwnProfile && (
                <Badge variant="outline" className="text-muted-foreground">
                  Tú
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Entrenador desde{' '}
              {new Date(profile.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Puntos Totales"
          value={stats?.total_points ?? 0}
          sub="en todas las ligas"
          accent="text-amber-600 dark:text-amber-400"
          borderColor="bg-gradient-to-r from-amber-400 to-amber-500"
        />
        <StatCard
          label="Victorias"
          value={stats?.total_wins ?? 0}
          accent="text-green-600 dark:text-green-400"
          borderColor="bg-gradient-to-r from-green-400 to-emerald-500"
        />
        <StatCard
          label="Derrotas"
          value={stats?.total_losses ?? 0}
          accent="text-red-500 dark:text-red-400"
          borderColor="bg-gradient-to-r from-red-400 to-rose-500"
        />
        <StatCard
          label="% Victorias"
          value={`${Number(stats?.winrate ?? 0).toFixed(1)}%`}
          sub={
            (stats?.total_wins ?? 0) + (stats?.total_losses ?? 0) > 0
              ? `${(stats?.total_wins ?? 0) + (stats?.total_losses ?? 0)} partidas jugadas`
              : 'Sin partidas aún'
          }
          borderColor="bg-gradient-to-r from-violet-400 to-blue-500"
        />
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">

        {/* Nuzlocke state card */}
        <Card className="self-start">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Estado Nuzlocke</CardTitle>
            {canEdit && (
              <EditStateDialog
                profileId={profile.id}
                initialValues={{
                  badges: profile.badges,
                  deaths: profile.deaths,
                  wipes: profile.wipes,
                  notes: profile.notes,
                }}
              />
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Gym badges */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Medallas de Gimnasio
              </p>
              <GymBadges count={profile.badges} />
            </div>

            <Separator />

            {/* Deaths */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Skull className="h-4 w-4 text-muted-foreground" />
                Muertes
              </div>
              <span className={cn(
                'text-lg font-bold tabular-nums',
                profile.deaths > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'
              )}>
                {profile.deaths}
              </span>
            </div>

            <Separator />

            {/* Wipes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Wipes
              </div>
              <span className={cn(
                'text-lg font-bold tabular-nums',
                profile.wipes > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'
              )}>
                {profile.wipes}
              </span>
            </div>

            <Separator />

            {/* MVP */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                MVP
              </p>
              {profile.mvp ? (
                <MvpCard
                  species={profile.mvp}
                  nickname={profile.team.find((e) => e.species === profile.mvp)?.nickname ?? ''}
                />
              ) : (
                <MvpEmpty />
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notas de la partida
              </p>
              {profile.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {profile.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin notas todavía.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team + Box */}
        <PokemonSection
          profileId={profile.id}
          initialTeam={profile.team}
          initialBox={profile.box}
          initialMvp={profile.mvp}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
