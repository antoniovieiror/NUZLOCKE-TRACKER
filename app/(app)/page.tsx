import Link from 'next/link'
import { Trophy } from 'lucide-react'

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
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-md shadow-amber-400/40">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-sm shadow-slate-400/30 dark:from-slate-500 dark:to-slate-600 dark:text-slate-100">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 bg-gradient-to-br from-orange-300 to-amber-500 text-orange-950 shadow-sm shadow-orange-400/30 dark:from-orange-600 dark:to-amber-700 dark:text-orange-100">
        3
      </span>
    )

  return (
    <span className="inline-flex items-center justify-center w-7 text-sm text-muted-foreground tabular-nums">
      {rank}
    </span>
  )
}

// ─── Row tint ──────────────────────────────────────────────────────────────────

function rowClass(rank: number) {
  if (rank === 1) return 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
  if (rank === 2) return 'bg-slate-50/60 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/30'
  if (rank === 3) return 'bg-orange-50/40 dark:bg-orange-950/15 hover:bg-orange-50 dark:hover:bg-orange-950/25'
  return 'hover:bg-muted/50'
}

// ─── Podium card ───────────────────────────────────────────────────────────────

const podiumConfig = {
  1: {
    label: '1st Place',
    card: 'border-amber-300/60 dark:border-amber-700/50 bg-gradient-to-b from-amber-50 to-amber-50/30 dark:from-amber-950/40 dark:to-transparent shadow-lg shadow-amber-100 dark:shadow-amber-900/20',
    accent: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-2 ring-amber-300/60 dark:ring-amber-600/40 shadow-md shadow-amber-200/50 dark:shadow-amber-800/30',
    crown: true,
  },
  2: {
    label: '2nd Place',
    card: 'border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-b from-slate-50 to-slate-50/30 dark:from-slate-800/30 dark:to-transparent shadow-sm',
    accent: 'text-slate-600 dark:text-slate-400',
    ring: 'ring-1 ring-slate-200/80 dark:ring-slate-600/30',
    crown: false,
  },
  3: {
    label: '3rd Place',
    card: 'border-orange-200/80 dark:border-orange-800/40 bg-gradient-to-b from-orange-50 to-orange-50/20 dark:from-orange-950/30 dark:to-transparent shadow-sm',
    accent: 'text-orange-700 dark:text-orange-400',
    ring: 'ring-1 ring-orange-200/80 dark:ring-orange-700/30',
    crown: false,
  },
} as const

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const cfg = podiumConfig[rank]

  return (
    <Link href={`/profile/${entry.id}`} className="block group">
      <Card className={cn('border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl', cfg.card)}>
        <CardContent className="pt-4 pb-4 px-3 flex flex-col items-center text-center gap-2">
          <span className={cn('text-[11px] font-bold uppercase tracking-widest', cfg.accent)}>
            {cfg.label}
          </span>

          <div className="relative">
            <Avatar className={cn('h-12 w-12 sm:h-14 sm:w-14 transition-transform duration-200 group-hover:scale-105', cfg.ring)}>
              <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username} />
              <AvatarFallback className="text-sm font-bold">
                {entry.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {cfg.crown && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base select-none" aria-hidden>
                👑
              </span>
            )}
          </div>

          <div>
            <p className="font-semibold text-sm leading-tight group-hover:underline underline-offset-4 truncate max-w-[90px] sm:max-w-none">
              {entry.username}
            </p>
            <p className={cn('text-xl font-black tabular-nums leading-tight', cfg.accent)}>
              {entry.total_points}
              <span className="text-xs font-normal ml-0.5">pts</span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="text-green-600 dark:text-green-400 font-medium">{entry.total_wins}W</span>
            {' — '}
            <span className="text-red-500 dark:text-red-400 font-medium">{entry.total_losses}L</span>
            {' · '}
            {Number(entry.winrate).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyLeaderboard() {
  return (
    <div className="py-20 text-center space-y-5">
      {/* CSS Pokéball */}
      <div className="flex justify-center" aria-hidden>
        <div className="relative w-20 h-20 opacity-20">
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
        <p className="text-base font-semibold">The arena is empty</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          No trainers have entered yet. The admin needs to create player accounts to begin the tournament.
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

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500 shrink-0" />
            Global Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historical rankings across all leagues
            {leaderboard.length > 0 && ` · ${leaderboard.length} trainers`}
          </p>
        </div>
        <Link
          href="/league"
          className="text-sm text-primary hover:underline underline-offset-4 shrink-0 hidden sm:block mt-1 transition-opacity hover:opacity-80"
        >
          Active league →
        </Link>
      </div>

      {/* ── Podium cards (top 3) ── */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {top3.map((entry, i) => (
            <PodiumCard key={entry.id} entry={entry} rank={(i + 1) as 1 | 2 | 3} />
          ))}
        </div>
      )}

      {/* ── Full rankings table ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Full Rankings</CardTitle>
          <CardDescription>
            Tiebreaker: Points → Wins → Winrate → Alphabetical
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <EmptyLeaderboard />
          ) : (
            <div className="overflow-x-auto rounded-b-xl">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-t">
                    <TableHead className="w-14 text-center pl-4">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right hidden md:table-cell">W — L</TableHead>
                    <TableHead className="text-right pr-4 hidden sm:table-cell">Winrate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1
                    return (
                      <TableRow
                        key={entry.id}
                        className={cn('transition-all duration-150', rowClass(rank))}
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
                            <Avatar className="h-8 w-8 shrink-0 transition-transform duration-200 group-hover:scale-105">
                              <AvatarImage
                                src={entry.avatar_url ?? undefined}
                                alt={entry.username}
                              />
                              <AvatarFallback className="text-xs font-semibold">
                                {entry.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm leading-tight group-hover:underline underline-offset-4 truncate">
                                {entry.username}
                              </p>
                              {entry.status === 'inactive' && (
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                  inactive
                                </p>
                              )}
                            </div>
                          </Link>
                        </TableCell>

                        {/* Points */}
                        <TableCell className="text-right">
                          <span className="font-bold tabular-nums">{entry.total_points}</span>
                          <span className="text-muted-foreground text-xs ml-1">pts</span>
                        </TableCell>

                        {/* W — L */}
                        <TableCell className="text-right hidden md:table-cell tabular-nums text-sm">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {entry.total_wins}
                          </span>
                          <span className="text-muted-foreground mx-1.5">—</span>
                          <span className="text-red-500 dark:text-red-400 font-medium">
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
          Failed to load leaderboard: {error.message}
        </p>
      )}
    </div>
  )
}
