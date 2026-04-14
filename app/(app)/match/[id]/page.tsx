import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Swords } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { Match, Profile } from '@/lib/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { VoteCard } from './_components/vote-card'
import { AdminControls } from './_components/admin-controls'

// ─── Head-to-head bar ─────────────────────────────────────────────────────────

function H2HBar({ aWins, bWins, aName, bName }: { aWins: number; bWins: number; aName: string; bName: string }) {
  const total = aWins + bWins
  const aPct = total === 0 ? 50 : Math.round((aWins / total) * 100)
  const bPct = 100 - aPct

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Historial H2H</p>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">{aWins} — {bWins}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {total === 0 ? (
          <div className="flex-1 bg-muted rounded-full"/>
        ) : (
          <>
            <div className="bg-blue-400 dark:bg-blue-500 rounded-l-full transition-all duration-700" style={{width:`${aPct}%`}}/>
            <div className="bg-rose-400 dark:bg-rose-500 rounded-r-full transition-all duration-700" style={{width:`${bPct}%`}}/>
          </>
        )}
      </div>
      <div className="flex justify-between text-[11px] font-bold">
        <span className="text-blue-500 dark:text-blue-400">{aName}{total > 0 ? ` ${aPct}%` : ''}</span>
        <span className="text-rose-500 dark:text-rose-400">{total > 0 ? `${bPct}% ` : ''}{bName}</span>
      </div>
    </div>
  )
}

// ─── Battle Arena VS card ─────────────────────────────────────────────────────

function VSHero({
  playerA, playerB, winnerId, status,
}: {
  playerA: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  playerB: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  winnerId: string | null
  status: Match['status']
}) {
  const isResolved = status === 'validated' || status === 'admin_resolved'
  const isVoided = status === 'voided'
  const aWon = isResolved && winnerId === playerA.id
  const bWon = isResolved && winnerId === playerB.id

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 shadow-xl">
      {/* Battle arena SVG background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="vsBase" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0A0E1F"/>
            <stop offset="50%" stopColor="#060810"/>
            <stop offset="100%" stopColor="#0A0E1F"/>
          </linearGradient>
          <radialGradient id="leftArena" cx="15%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={isResolved && !aWon ? "0.02" : "0.12"}/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rightArena" cx="85%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity={isResolved && !bWon ? "0.02" : "0.10"}/>
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="winGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="centerClash" cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isResolved ? "0.03" : "0.08"}/>
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="600" height="200" fill="url(#vsBase)"/>
        <rect width="600" height="200" fill="url(#leftArena)"/>
        <rect width="600" height="200" fill="url(#rightArena)"/>
        {(aWon || bWon) && <rect width="600" height="200" fill="url(#winGlow)"/>}
        <rect width="600" height="200" fill="url(#centerClash)"/>

        {/* Terrain contour lines */}
        <g stroke="rgba(255,255,255,0.022)" strokeWidth="0.6" fill="none">
          <ellipse cx="150" cy="100" rx="100" ry="80"/>
          <ellipse cx="150" cy="100" rx="72" ry="56"/>
          <ellipse cx="150" cy="100" rx="44" ry="34"/>
          <ellipse cx="450" cy="100" rx="100" ry="80"/>
          <ellipse cx="450" cy="100" rx="72" ry="56"/>
          <ellipse cx="450" cy="100" rx="44" ry="34"/>
        </g>

        {/* Center divider energy line */}
        <line x1="300" y1="0" x2="300" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
        <line x1="295" y1="30" x2="305" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <line x1="295" y1="170" x2="305" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>

        {/* VS / clash spark in center */}
        {!isResolved && (
          <>
            <circle cx="300" cy="100" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            <circle cx="300" cy="100" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
          </>
        )}

        {/* Ground platform lines */}
        <line x1="50" y1="175" x2="250" y2="175" stroke="rgba(59,130,246,0.15)" strokeWidth="0.6"/>
        <line x1="350" y1="175" x2="550" y2="175" stroke="rgba(244,63,94,0.15)" strokeWidth="0.6"/>
      </svg>

      {/* Top status bar */}
      <div className={cn(
        'absolute top-0 inset-x-0 h-0.5',
        isVoided ? 'bg-muted'
        : isResolved ? 'bg-gradient-to-r from-blue-500 via-green-400 to-rose-500'
        : 'bg-gradient-to-r from-blue-400 via-white/20 to-rose-400'
      )}/>

      {/* Player grid */}
      <div className="relative grid grid-cols-[1fr_72px_1fr]">

        {/* Player A */}
        <div className={cn(
          'flex flex-col items-center gap-3 p-6 transition-all duration-300',
          aWon ? 'opacity-100' : isResolved && !aWon ? 'opacity-35' : 'opacity-100'
        )}>
          <Avatar className={cn(
            'h-16 w-16 sm:h-20 sm:w-20 ring-2 transition-all duration-300',
            aWon ? 'ring-green-400 dark:ring-green-500 scale-110 shadow-lg shadow-green-500/25'
            : 'ring-blue-400/40 dark:ring-blue-500/30'
          )}>
            <AvatarImage src={playerA.avatar_url ?? undefined}/>
            <AvatarFallback className="text-xl font-black bg-blue-950/80 text-blue-300 border-0">
              {playerA.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link href={`/profile/${playerA.id}`} className="font-bold text-sm sm:text-base text-center text-white/90 hover:underline underline-offset-4 truncate max-w-[100px]">
            {playerA.username}
          </Link>
          {aWon && (
            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] bg-green-950/60 px-2 py-0.5 rounded-full border border-green-500/30">
              Ganador
            </span>
          )}
        </div>

        {/* Center VS / result */}
        <div className="flex flex-col items-center justify-center gap-2 border-x border-white/5 bg-black/20">
          <Swords className={cn(
            'h-5 w-5',
            isVoided ? 'text-white/15' : 'text-white/50'
          )} strokeWidth={1.5}/>
          <span className={cn(
            'text-[9px] font-black tracking-[0.25em]',
            isVoided ? 'text-white/20'
            : isResolved ? 'text-green-400/80'
            : 'text-white/40'
          )}>
            {isVoided ? 'VOID' : isResolved ? 'FIN' : 'VS'}
          </span>
        </div>

        {/* Player B */}
        <div className={cn(
          'flex flex-col items-center gap-3 p-6 transition-all duration-300',
          bWon ? 'opacity-100' : isResolved && !bWon ? 'opacity-35' : 'opacity-100'
        )}>
          <Avatar className={cn(
            'h-16 w-16 sm:h-20 sm:w-20 ring-2 transition-all duration-300',
            bWon ? 'ring-green-400 dark:ring-green-500 scale-110 shadow-lg shadow-green-500/25'
            : 'ring-rose-400/40 dark:ring-rose-500/30'
          )}>
            <AvatarImage src={playerB.avatar_url ?? undefined}/>
            <AvatarFallback className="text-xl font-black bg-rose-950/80 text-rose-300 border-0">
              {playerB.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link href={`/profile/${playerB.id}`} className="font-bold text-sm sm:text-base text-center text-white/90 hover:underline underline-offset-4 truncate max-w-[100px]">
            {playerB.username}
          </Link>
          {bWon && (
            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] bg-green-950/60 px-2 py-0.5 rounded-full border border-green-500/30">
              Ganador
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: matchRaw }, { data: { user: authUser } }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!matchRaw) notFound()
  const match = matchRaw as Match

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', [match.player_a_id, match.player_b_id])

  const profiles = (profilesRaw ?? []) as Pick<Profile, 'id' | 'username' | 'avatar_url' | 'role'>[]
  const playerA = profiles.find((p) => p.id === match.player_a_id)
  const playerB = profiles.find((p) => p.id === match.player_b_id)
  if (!playerA || !playerB) notFound()

  const currentUserId = authUser?.id ?? null

  let isAdmin = false
  if (authUser) {
    const me = profiles.find((p) => p.id === authUser.id)
    if (me?.role === 'admin') {
      isAdmin = true
    } else {
      const { data: adminCheck } = await supabase.from('profiles').select('role').eq('id', authUser.id).single()
      isAdmin = adminCheck?.role === 'admin'
    }
  }

  const { data: allMatchesRaw } = await supabase
    .from('matches')
    .select('winner_id, player_a_id, player_b_id, status')
    .or(`and(player_a_id.eq.${playerA.id},player_b_id.eq.${playerB.id}),and(player_a_id.eq.${playerB.id},player_b_id.eq.${playerA.id})`)

  const allMatches = (allMatchesRaw ?? []) as Pick<Match, 'winner_id' | 'player_a_id' | 'player_b_id' | 'status'>[]

  const h2h = allMatches.reduce(
    (acc, m) => {
      if (m.status !== 'validated' && m.status !== 'admin_resolved') return acc
      if (m.winner_id === playerA.id) acc.aWins++
      else if (m.winner_id === playerB.id) acc.bWins++
      return acc
    },
    { aWins: 0, bWins: 0 }
  )

  const isPlayerA = currentUserId === playerA.id
  const isPlayerB = currentUserId === playerB.id
  const isResolved = match.status === 'validated' || match.status === 'admin_resolved'

  let myVote = null
  let otherVoted = false
  if (isPlayerA) { myVote = match.vote_a; otherVoted = !!match.vote_b }
  else if (isPlayerB) { myVote = match.vote_b; otherVoted = !!match.vote_a }
  else if (isAdmin || isResolved) { myVote = null; otherVoted = !!(match.vote_a || match.vote_b) }

  const { data: leagueRaw } = await supabase.from('leagues').select('id, title, status').eq('id', match.league_id).single()

  return (
    <div className="space-y-5 pb-10 max-w-xl mx-auto">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Clasificación</Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-40"/>
        {leagueRaw?.status === 'active' ? (
          <Link href="/league" className="hover:text-foreground transition-colors">{leagueRaw.title}</Link>
        ) : (
          <Link href="/history" className="hover:text-foreground transition-colors">{leagueRaw?.title ?? 'Liga'}</Link>
        )}
        <ChevronRight className="h-3.5 w-3.5 opacity-40"/>
        <span className="text-foreground font-semibold">Partida</span>
      </div>

      {/* ── Battle Arena VS ── */}
      <VSHero playerA={playerA} playerB={playerB} winnerId={match.winner_id} status={match.status}/>

      {/* ── H2H ── */}
      <H2HBar aWins={h2h.aWins} bWins={h2h.bWins} aName={playerA.username} bName={playerB.username}/>

      <Separator className="opacity-40"/>

      {/* ── Vote card ── */}
      {currentUserId && (
        <VoteCard
          matchId={match.id}
          status={match.status}
          currentUserId={currentUserId}
          playerAId={playerA.id}
          playerBId={playerB.id}
          playerAUsername={playerA.username}
          playerBUsername={playerB.username}
          myVote={myVote}
          otherVoted={otherVoted}
          replayUrl={match.replay_url}
          winnerId={match.winner_id}
        />
      )}

      {!currentUserId && isResolved && (
        <Card className="border-border/40">
          <CardContent className="py-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Ganador</p>
            <p className="font-black text-xl">{match.winner_id === playerA.id ? playerA.username : playerB.username}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Admin controls ── */}
      {isAdmin && (
        <AdminControls
          matchId={match.id}
          status={match.status}
          playerAId={playerA.id}
          playerBId={playerB.id}
          playerAUsername={playerA.username}
          playerBUsername={playerB.username}
        />
      )}
    </div>
  )
}
