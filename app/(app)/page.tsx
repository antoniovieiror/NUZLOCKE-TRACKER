import Link from 'next/link'
import { Trophy, Crown, ChevronRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ─── Arena Hero Banner ────────────────────────────────────────────────────────

function ArenaHero({ trainerCount }: { trainerCount: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 mb-6 h-52 sm:h-64">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 280"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="arenaCenter" cx="50%" cy="75%" r="55%">
            <stop offset="0%" stopColor="#00c8e8" stopOpacity="0.18"/>
            <stop offset="45%" stopColor="#0066ff" stopOpacity="0.06"/>
            <stop offset="100%" stopColor="#07080f" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="platformLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00c8e8" stopOpacity="0.55"/>
            <stop offset="60%" stopColor="#00c8e8" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#00c8e8" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="leftGlow" cx="0%" cy="60%" r="60%">
            <stop offset="0%" stopColor="#00c8e8" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#00c8e8" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rightGlow" cx="100%" cy="60%" r="60%">
            <stop offset="0%" stopColor="#4060ff" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="#4060ff" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#040610"/>
            <stop offset="100%" stopColor="#080c1c"/>
          </linearGradient>
          <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1030"/>
            <stop offset="100%" stopColor="#07080f"/>
          </linearGradient>
          <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#090c1e"/>
            <stop offset="100%" stopColor="#050608"/>
          </linearGradient>
          <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
          <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>

        <rect width="1200" height="280" fill="url(#skyGrad)"/>
        <rect width="1200" height="280" fill="url(#leftGlow)"/>
        <rect width="1200" height="280" fill="url(#rightGlow)"/>
        <rect width="1200" height="280" fill="url(#arenaCenter)"/>

        {/* Cyan grid overlay */}
        <g stroke="rgba(0,200,232,0.025)" strokeWidth="0.8" fill="none">
          <ellipse cx="600" cy="200" rx="480" ry="180"/>
          <ellipse cx="600" cy="200" rx="400" ry="150"/>
          <ellipse cx="600" cy="200" rx="320" ry="118"/>
          <ellipse cx="600" cy="200" rx="240" ry="88"/>
          <ellipse cx="600" cy="200" rx="160" ry="58"/>
          <ellipse cx="600" cy="200" rx="90" ry="32"/>
        </g>
        <g stroke="rgba(0,160,200,0.018)" strokeWidth="1" fill="none">
          <ellipse cx="600" cy="200" rx="360" ry="132"/>
          <ellipse cx="600" cy="200" rx="200" ry="72"/>
        </g>

        {/* Distant mountains */}
        <path
          d="M0,280 L60,210 L120,230 L200,185 L280,205 L360,165 L440,190 L510,148 L580,172 L640,145 L700,168 L770,138 L840,160 L920,130 L1000,155 L1080,125 L1140,148 L1200,135 L1200,280Z"
          fill="url(#mountainFar)"
        />
        <path
          d="M0,280 L80,240 L160,258 L260,215 L360,238 L470,195 L560,222 L660,188 L760,215 L870,175 L970,205 L1060,172 L1140,195 L1200,180 L1200,280Z"
          fill="url(#mountainMid)"
        />

        {/* Cyan light beams */}
        <g opacity="0.055" filter="url(#blur8)">
          <line x1="600" y1="260" x2="250" y2="0" stroke="#00c8e8" strokeWidth="60"/>
          <line x1="600" y1="260" x2="600" y2="0" stroke="#00c8e8" strokeWidth="80"/>
          <line x1="600" y1="260" x2="950" y2="0" stroke="#00c8e8" strokeWidth="60"/>
        </g>

        {/* Stars */}
        {[
          [120,40],[200,20],[350,55],[480,18],[680,30],[820,15],[950,45],[1080,22],[1150,58],
          [80,80],[300,70],[550,65],[750,72],[1000,68],[100,28],[420,35],[700,48],[1100,35],
        ].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 0.8 : 0.5} fill="white" opacity={0.3 + (i % 4) * 0.10}/>
        ))}

        {/* Platform glow */}
        <ellipse cx="600" cy="265" rx="160" ry="14" fill="url(#platformLight)" filter="url(#blur4)"/>
        <ellipse cx="600" cy="265" rx="100" ry="8" fill="none" stroke="#00c8e8" strokeWidth="0.8" opacity="0.40"/>
        <ellipse cx="600" cy="265" rx="70" ry="5.5" fill="none" stroke="#00c8e8" strokeWidth="0.5" opacity="0.25"/>

        {/* Pokeball watermark */}
        <circle cx="600" cy="175" r="55" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
        <circle cx="600" cy="175" r="44" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
        <line x1="545" y1="175" x2="655" y2="175" stroke="rgba(255,255,255,0.030)" strokeWidth="0.8"/>
        <circle cx="600" cy="175" r="11" fill="none" stroke="rgba(0,200,232,0.08)" strokeWidth="1"/>
        <circle cx="600" cy="175" r="6" fill="rgba(0,200,232,0.06)"/>

        <rect width="1200" height="280" fill="url(#skyGrad)" opacity="0.12"/>
      </svg>

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-primary/80 mb-3">
          Campeonato Nuzlocke
        </p>
        <h1 className="font-heading text-5xl sm:text-6xl font-700 tracking-widest leading-none mb-2 uppercase">
          <span className="text-white/90">Clasificación</span>
          <br/>
          <span className="text-primary drop-shadow-[0_0_20px_rgba(0,200,232,0.5)]">
            Global
          </span>
        </h1>
        <p className="text-xs text-white/30 font-medium tracking-widest uppercase mt-1">
          Rankings históricos · todas las ligas
          {trainerCount > 0 && ` · ${trainerCount} entrenadores`}
        </p>
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow shadow-amber-400/50">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 bg-gradient-to-br from-slate-400 to-slate-500 text-slate-100">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 bg-gradient-to-br from-orange-600 to-amber-700 text-orange-100">
        3
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-7 text-sm text-muted-foreground tabular-nums font-medium">
      {rank}
    </span>
  )
}

// ─── Row tint ─────────────────────────────────────────────────────────────────

function rowClass(rank: number) {
  if (rank === 1) return 'bg-amber-950/15 hover:bg-amber-950/25'
  if (rank === 2) return 'bg-slate-900/10 hover:bg-slate-900/20'
  if (rank === 3) return 'bg-orange-950/8 hover:bg-orange-950/15'
  return 'hover:bg-muted/30'
}

// ─── Podium card ──────────────────────────────────────────────────────────────

const podiumConfig = {
  1: {
    label: '1er Lugar',
    card: 'border-amber-600/30 bg-gradient-to-b from-amber-950/35 to-card shadow-xl shadow-amber-900/25',
    accent: 'text-amber-400',
    avatarRing: 'ring-2 ring-amber-500/50',
    topAccent: 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400',
    crown: true,
    topMargin: 'mt-0',
    pointsClass: 'text-3xl font-black text-amber-400',
    glow: 'rank-glow-gold',
  },
  2: {
    label: '2do Lugar',
    card: 'border-slate-600/25 bg-gradient-to-b from-slate-800/20 to-card shadow-md',
    accent: 'text-slate-400',
    avatarRing: 'ring-1 ring-slate-600/35',
    topAccent: 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600',
    crown: false,
    topMargin: 'mt-8',
    pointsClass: 'text-2xl font-black text-slate-300',
    glow: 'rank-glow-silver',
  },
  3: {
    label: '3er Lugar',
    card: 'border-orange-800/25 bg-gradient-to-b from-orange-950/20 to-card shadow-md',
    accent: 'text-orange-400',
    avatarRing: 'ring-1 ring-orange-700/30',
    topAccent: 'bg-gradient-to-r from-orange-700 via-amber-600 to-orange-700',
    crown: false,
    topMargin: 'mt-14',
    pointsClass: 'text-2xl font-black text-orange-400',
    glow: 'rank-glow-bronze',
  },
} as const

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const cfg = podiumConfig[rank]
  return (
    <Link href={`/profile/${entry.id}`} className={cn('block group', cfg.topMargin)}>
      <Card className={cn('border transition-all duration-200 overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl', cfg.card)}>
        <div className={cn('h-0.5', cfg.topAccent)} />
        <CardContent className="pt-4 pb-5 px-3 flex flex-col items-center text-center gap-3">
          <span className={cn('text-[9px] font-black uppercase tracking-[0.2em]', cfg.accent)}>
            {cfg.label}
          </span>
          <div className="relative">
            <Avatar className={cn(
              'h-14 w-14 transition-transform duration-200 group-hover:scale-105',
              cfg.avatarRing,
              rank === 1 ? cfg.glow : ''
            )}>
              <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username} />
              <AvatarFallback className="text-sm font-black">{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {cfg.crown && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Crown className="h-4 w-4 text-amber-500 fill-amber-400" strokeWidth={0.5}/>
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-sm leading-tight group-hover:underline underline-offset-4 truncate max-w-[88px] sm:max-w-[110px]">
              {entry.username}
            </p>
            <p className={cfg.pointsClass}>
              {entry.total_points}
              <span className="text-xs font-normal ml-0.5 opacity-60">pts</span>
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            <span className="text-green-400 font-bold">{entry.total_wins}V</span>
            <span className="mx-1 opacity-30">·</span>
            <span className="text-red-400 font-bold">{entry.total_losses}D</span>
            <span className="mx-1 opacity-30">·</span>
            {Number(entry.winrate).toFixed(0)}%
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyLeaderboard() {
  return (
    <div className="py-24 text-center space-y-5">
      <div className="flex justify-center" aria-hidden>
        <div className="relative w-20 h-20 opacity-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-foreground overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1/2 bg-red-500"/>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/20"/>
            <div className="absolute inset-x-0 top-1/2 h-px bg-foreground -translate-y-px"/>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-[2.5px] border-foreground bg-background z-10"/>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground z-20"/>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold">La arena está vacía</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Ningún entrenador ha entrado aún. El admin debe crear cuentas de jugador para comenzar.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('leaderboard').select('*')

  const leaderboard = (data ?? []) as LeaderboardEntry[]
  const top3 = leaderboard.slice(0, 3) as (LeaderboardEntry & { rank: 1 | 2 | 3 })[]

  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : top3

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <ArenaHero trainerCount={leaderboard.length} />

      {/* ── Active league link ── */}
      <div className="flex justify-end -mt-2">
        <Link href="/league" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
          Liga activa
          <ChevronRight className="h-3.5 w-3.5"/>
        </Link>
      </div>

      {/* ── Podium (top 3) ── */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
          {podiumOrder.map((entry) => {
            const rank = top3.findIndex((e) => e.id === entry.id) + 1
            return <PodiumCard key={entry.id} entry={entry} rank={rank as 1 | 2 | 3}/>
          })}
        </div>
      )}

      {/* ── Full rankings table ── */}
      <Card className="shadow-sm overflow-hidden border-border/50">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary shadow-sm shadow-primary/25 shrink-0">
              <Trophy className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2}/>
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Clasificación completa</CardTitle>
              <CardDescription className="text-[11px]">Desempate: Puntos → Victorias → % Victorias → Alfabético</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <EmptyLeaderboard/>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none bg-muted/20">
                    <TableHead className="w-14 text-center pl-4 text-[10px] font-black uppercase tracking-wide text-muted-foreground/60 py-2.5">#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wide text-muted-foreground/60 py-2.5">Jugador</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-wide text-muted-foreground/60 py-2.5">Puntos</TableHead>
                    <TableHead className="text-right hidden md:table-cell text-[10px] font-black uppercase tracking-wide text-muted-foreground/60 py-2.5">V — D</TableHead>
                    <TableHead className="text-right pr-4 hidden sm:table-cell text-[10px] font-black uppercase tracking-wide text-muted-foreground/60 py-2.5">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1
                    return (
                      <TableRow key={entry.id} className={cn('transition-all duration-150 border-border/20', rowClass(rank))}>
                        <TableCell className="text-center pl-4 py-3"><RankBadge rank={rank}/></TableCell>
                        <TableCell className="py-3">
                          <Link href={`/profile/${entry.id}`} className="flex items-center gap-3 group w-fit">
                            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/40 transition-all duration-200 group-hover:scale-105 group-hover:ring-primary/40">
                              <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username}/>
                              <AvatarFallback className="text-xs font-bold">{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm leading-tight group-hover:underline underline-offset-4 truncate">{entry.username}</p>
                              {entry.status === 'inactive' && <p className="text-[11px] text-muted-foreground/60 leading-tight">inactivo</p>}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <span className="font-black tabular-nums text-primary">{entry.total_points}</span>
                          <span className="text-muted-foreground text-xs ml-1">pts</span>
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell tabular-nums text-sm py-3">
                          <span className="text-green-400 font-bold">{entry.total_wins}</span>
                          <span className="text-muted-foreground/40 mx-1.5">—</span>
                          <span className="text-red-400 font-bold">{entry.total_losses}</span>
                        </TableCell>
                        <TableCell className="text-right pr-4 hidden sm:table-cell tabular-nums text-sm text-muted-foreground py-3">
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

      {error && <p className="text-xs text-destructive text-center">Error: {error.message}</p>}
    </div>
  )
}
