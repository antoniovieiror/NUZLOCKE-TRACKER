import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Skull, Shield, Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { Profile, LeaderboardEntry } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { EditStateDialog } from './_components/edit-state-dialog'
import { PokemonSection } from './_components/pokemon-section'

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
      {borderColor && (
        <div className={cn('h-0.5 w-full', borderColor)} />
      )}
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
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
            i < count
              ? 'bg-amber-400 border-amber-500 dark:bg-amber-500 dark:border-amber-400 shadow-md shadow-amber-400/40 dark:shadow-amber-500/30 scale-100'
              : 'bg-muted border-border opacity-40'
          )}
        >
          {i < count && (
            <span className="text-[8px] font-bold text-amber-900">✦</span>
          )}
        </div>
      ))}
      <span className="text-sm text-muted-foreground ml-1 self-center">
        {count}/8
      </span>
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

  // Parallel fetches: profile data + this player's leaderboard stats + current user
  const [profileResult, statsResult, userResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('leaderboard').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (profileResult.error || !profileResult.data) notFound()

  const profile = profileResult.data as Profile
  const stats = statsResult.data as LeaderboardEntry | null
  const currentUser = userResult.data.user

  // Fetch current user's role to determine edit permission
  let currentUserRole: 'admin' | 'player' = 'player'
  if (currentUser) {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    currentUserRole = currentProfile?.role ?? 'player'
  }

  const canEdit =
    !!currentUser &&
    (currentUser.id === profile.id || currentUserRole === 'admin')

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="space-y-6 pb-10">

      {/* ── Back link ── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Leaderboard
      </Link>

      {/* ── Profile header — gradient trainer card ── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-violet-50 via-sky-50/50 to-emerald-50/30 dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-slate-900/60 p-5 shadow-sm">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-300/10 dark:bg-amber-500/5 blur-2xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-20 w-20 shrink-0 ring-4 ring-white/80 dark:ring-white/10 shadow-lg">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-violet-100 to-sky-100 dark:from-indigo-900 dark:to-blue-900 text-violet-700 dark:text-violet-300">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {profile.username}
              </h1>
              {profile.role === 'admin' && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {profile.status === 'inactive' && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
              {isOwnProfile && (
                <Badge variant="outline" className="text-muted-foreground">
                  You
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Trainer since{' '}
              {new Date(profile.created_at).toLocaleDateString('en-US', {
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
          label="Total Points"
          value={stats?.total_points ?? 0}
          sub="across all leagues"
          accent="text-amber-600 dark:text-amber-400"
          borderColor="bg-gradient-to-r from-amber-400 to-amber-500"
        />
        <StatCard
          label="Wins"
          value={stats?.total_wins ?? 0}
          accent="text-green-600 dark:text-green-400"
          borderColor="bg-gradient-to-r from-green-400 to-emerald-500"
        />
        <StatCard
          label="Losses"
          value={stats?.total_losses ?? 0}
          accent="text-red-500 dark:text-red-400"
          borderColor="bg-gradient-to-r from-red-400 to-rose-500"
        />
        <StatCard
          label="Winrate"
          value={`${Number(stats?.winrate ?? 0).toFixed(1)}%`}
          sub={
            (stats?.total_wins ?? 0) + (stats?.total_losses ?? 0) > 0
              ? `${(stats?.total_wins ?? 0) + (stats?.total_losses ?? 0)} matches played`
              : 'No matches yet'
          }
          borderColor="bg-gradient-to-r from-violet-400 to-blue-500"
        />
      </div>

      {/* ── Main content: Nuzlocke state + Pokémon ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">

        {/* Left: Nuzlocke state card */}
        <Card className="self-start">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Nuzlocke State</CardTitle>
            {canEdit && (
              <EditStateDialog
                profileId={profile.id}
                initialValues={{
                  badges: profile.badges,
                  deaths: profile.deaths,
                  mvp: profile.mvp,
                  notes: profile.notes,
                }}
              />
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Gym badges */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Gym Badges
              </p>
              <GymBadges count={profile.badges} />
            </div>

            <Separator />

            {/* Deaths */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Skull className="h-4 w-4 text-muted-foreground" />
                Deaths
              </div>
              <span
                className={cn(
                  'text-lg font-bold tabular-nums',
                  profile.deaths > 0
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-muted-foreground'
                )}
              >
                {profile.deaths}
              </span>
            </div>

            <Separator />

            {/* MVP */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Star className="h-3.5 w-3.5" />
                MVP
              </div>
              <p className="text-sm capitalize">
                {profile.mvp ? (
                  profile.mvp.replace(/-/g, ' ')
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </p>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Run Notes
              </p>
              {profile.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {profile.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Team + Box */}
        <PokemonSection
          profileId={profile.id}
          initialTeam={profile.team}
          initialBox={profile.box}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
