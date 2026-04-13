import Link from 'next/link'
import { Trophy, Crown, Medal, ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow shadow-amber-400/40">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 dark:from-slate-500 dark:to-slate-600 dark:text-slate-100">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 bg-gradient-to-br from-orange-300 to-amber-500 text-orange-950 dark:from-orange-600 dark:to-amber-700 dark:text-orange-100">
        3
      </span>
    )

  return (
    <span className="inline-flex items-center justify-center w-7 text-sm text-muted-foreground tabular-nums font-medium">
      {rank}
    </span>
  )
}

// ─── Row tint ──────────────────────────────────────────────────────────────────

function rowClass(rank: number) {
  if (rank === 1) return 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
  if (rank === 2) return 'bg-slate-50/60 dark:bg-slate-900/15 hover:bg-slate-50 dark:hover:bg-slate-900/25'
  if (rank === 3) return 'bg-orange-50/40 dark:bg-orange-950/12 hover:bg-orange-50 dark:hover:bg-orange-950/20'
  return 'hover:bg-muted/40'
}

// ─── Podium card ───────────────────────────────────────────────────────────────

const podiumConfig = {
  1: {
    label: '1er Lugar',
    card: 'border-amber-300/50 dark:border-amber-600/35 bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/30 dark:to-card shadow-lg shadow-amber-100/80 dark:shadow-amber-900/20',
    accent: 'text-amber-700 dark:text-amber-400',
    avatarRing: 'ring-2 ring-amber-300/70 dark:ring-amber-500/50 shadow-md shadow-amber-200/60 dark:shadow-amber-800/30',
    glow: 'rank-glow-gold',
    crown: true,
    topMargin: 'mt-0',
    avatarSize: 'h-14 w-14 sm:h-16 sm:w-16',
    pointsClass: 'text-2xl font-black text-amber-700 dark:text-amber-400',
    topAccent: 'h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent',
  },
  2: {
    label: '2do Lugar',
    card: 'border-slate-200/70 dark:border-slate-600/30 bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-800/20 dark:to-card shadow-sm',
    accent: 'text-slate-600 dark:text-slate-400',
    avatarRing: 'ring-1 ring-slate-300/70 dark:ring-slate-600/40',
    glow: 'rank-glow-silver',
    crown: false,
    topMargin: 'mt-8',
    avatarSize: 'h-12 w-12 sm:h-14 sm:w-14',
    pointsClass: 'text-xl font-black text-slate-700 dark:text-slate-300',
    topAccent: 'h-px w-full bg-gradient-to-r from-transparent via-slate-400/40 to-transparent',
  },
  3: {
    label: '3er Lugar',
    card: 'border-orange-200/70 dark:border-orange-800/30 bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-950/20 dark:to-card shadow-sm',
    accent: 'text-orange-700 dark:text-orange-400',
    avatarRing: 'ring-1 ring-orange-300/70 dark:ring-orange-700/35',
    glow: 'rank-glow-bronze',
    crown: false,
    topMargin: 'mt-14',
    avatarSize: 'h-12 w-12 sm:h-14 sm:w-14',
    pointsClass: 'text-xl font-black text-orange-700 dark:text-orange-400',
    topAccent: 'h-px w-full bg-gradient-to-r from-transparent via-orange-400/40 to-transparent',
  },
} as const

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const cfg = podiumConfig[rank]

  return (
    <Link href={`/profile/${entry.id}`} className={cn('block group', cfg.topMargin)}>
      <Card className={cn(
        'border transition-all duration-250 overflow-hidden',
        cfg.card,
        'hover:-translate-y-1.5 hover:shadow-xl',
        rank === 1 && 'dark:hover:shadow-amber-900/30',
      )}>
        <div className={cfg.topAccent} />
        <CardContent className="pt-4 pb-4 px-3 flex flex-col items-center text-center gap-2.5">

          {/* Rank label */}
          <span className={cn('text-[10px] font-black uppercase tracking-[0.18em]', cfg.accent)}>
            {cfg.label}
          </span>

          {/* Avatar */}
          <div className="relative">
            <Avatar className={cn(cfg.avatarSize, 'transition-transform duration-200 group-hover:scale-105', cfg.avatarRing, rank === 1 && cfg.glow)}>
              <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username} />
              <AvatarFallback className="text-sm font-bold">
                {entry.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {cfg.crown && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400 fill-amber-400 dark:fill-amber-400" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Name + Points */}
          <div className="space-y-0.5">
            <p className="font-bold text-sm leading-tight group-hover:underline underline-offset-4 truncate max-w-[90px] sm:max-w-[120px]">
              {entry.username}
            </p>
            <p className={cfg.pointsClass}>
              {entry.total_points}
              <span className="text-xs font-normal ml-0.5 opacity-70">pts</span>
            </p>
          </div>

          {/* W / D / % */}
          <p className="text-[11px] text-muted-foreground tabular-nums">
            <span className="text-green-600 dark:text-green-400 font-semibold">{entry.total_wins}V</span>
            <span className="mx-1 opacity-40">·</span>
            <span className="text-red-500 dark:text-red-400 font-semibold">{entry.total_losses}D</span>
            <span className="mx-1 opacity-40">·</span>
            {Number(entry.winrate).toFixed(0)}%
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyLeaderboard() {
  return (
    <div className="py-24 text-center space-y-5">
      {/* CSS Pokéball */}
      <div className="flex justify-center" aria-hidden>
        <div className="relative w-20 h-20 opacity-15">
          <div className="absolute inset-0 rounded-full border-[3px] border-foreground overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1/2 bg-red-500 dark:bg-red-400" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white dark:bg-slate-300" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-foreground -translate-y-px" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-[2.5px] border-foreground bg-white dark:bg-slate-200 z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground z-20" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight">La arena está vacía</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Ningún entrenador ha entrado aún. El admin debe crear cuentas de jugador para comenzar el torneo.
        </p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('leaderboard').select('*')

  const leaderboard = (data ?? []) as LeaderboardEntry[]
  const top3 = leaderboard.slice(0, 3) as (LeaderboardEntry & { rank: 1 | 2 | 3 })[]

  // Olympic podium order: 2nd (left) — 1st (center) — 3rd (right)
  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : top3

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/25">
              <Trophy className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Clasificación Global
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10.5">
            Rankings históricos de todas las ligas
            {leaderboard.length > 0 && (
              <span className="ml-1 text-muted-foreground/60">· {leaderboard.length} entrenadores</span>
            )}
          </p>
        </div>
        <Link
          href="/league"
          className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 shrink-0"
        >
          Liga activa
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Podium (top 3) — Olympic order ── */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
          {podiumOrder.map((entry) => {
            const rank = top3.findIndex((e) => e.id === entry.id) + 1
            return (
              <PodiumCard key={entry.id} entry={entry} rank={rank as 1 | 2 | 3} />
            )
          })}
        </div>
      )}

      {/* ── Full rankings table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold">Clasificación completa</CardTitle>
          <CardDescription className="text-xs">
            Desempate: Puntos → Victorias → % Victorias → Alfabético
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <EmptyLeaderboard />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-14 text-center pl-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">#</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Jugador</TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Puntos</TableHead>
                    <TableHead className="text-right hidden md:table-cell text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">V — D</TableHead>
                    <TableHead className="text-right pr-4 hidden sm:table-cell text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1
                    return (
                      <TableRow
                        key={entry.id}
                        className={cn('transition-all duration-150 border-border/40', rowClass(rank))}
                      >
                        {/* Rank */}
                        <TableCell className="text-center pl-4">
                          <RankBadge rank={rank} />
                        </TableCell>

                        {/* Player */}
                        <TableCell>
                          <Link
                            href={`/profile/${entry.id}`}
                            className="flex items-center gap-3 group w-fit"
                          >
                            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/40 transition-all duration-200 group-hover:scale-105 group-hover:ring-amber-400/40">
                              <AvatarImage
                                src={entry.avatar_url ?? undefined}
                                alt={entry.username}
                              />
                              <AvatarFallback className="text-xs font-bold">
                                {entry.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm leading-tight group-hover:underline underline-offset-4 truncate">
                                {entry.username}
                              </p>
                              {entry.status === 'inactive' && (
                                <p className="text-[11px] text-muted-foreground/60 leading-tight">
                                  inactivo
                                </p>
                              )}
                            </div>
                          </Link>
                        </TableCell>

                        {/* Points */}
                        <TableCell className="text-right">
                          <span className="font-black tabular-nums">{entry.total_points}</span>
                          <span className="text-muted-foreground text-xs ml-1">pts</span>
                        </TableCell>

                        {/* W — L */}
                        <TableCell className="text-right hidden md:table-cell tabular-nums text-sm">
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {entry.total_wins}
                          </span>
                          <span className="text-muted-foreground/50 mx-1.5">—</span>
                          <span className="text-red-500 dark:text-red-400 font-semibold">
                            {entry.total_losses}
                          </span>
                        </TableCell>

                        {/* Winrate */}
                        <TableCell className="text-right pr-4 hidden sm:table-cell tabular-nums text-sm text-muted-foreground">
                          {Number(entry.winrate).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-xs text-destructive text-center">
          Error al cargar clasificación: {error.message}
        </p>
      )}
    </div>
  )
}
