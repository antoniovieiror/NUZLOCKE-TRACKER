import Link from 'next/link'
import { Crown, Flame, Swords } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Match, Profile } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────

type ArenaPlayer = Pick<Profile, 'id' | 'username' | 'avatar_url'> & {
  rank: number | null   // overall leaderboard rank (1-indexed); null if not ranked
  points: number | null
  wins: number | null
  losses: number | null
  winrate: number | null
}

interface ArenaHeroProps {
  leagueTitle: string | null
  matchIndex: number | null    // 1-indexed position within its league
  matchTotal: number | null    // total matches in the league
  playerA: ArenaPlayer
  playerB: ArenaPlayer
  winnerId: string | null
  status: Match['status']
}

// ─── Helpers ────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

function StatusPill({ status }: { status: Match['status'] }) {
  if (status === 'voided') {
    return <span className="mv-status-pill is-void"><span className="mv-dot" />VOIDED</span>
  }
  if (status === 'disputed') {
    return <span className="mv-status-pill is-disputed"><span className="mv-dot" />DISPUTED</span>
  }
  if (status === 'validated' || status === 'admin_resolved') {
    return <span className="mv-status-pill is-resolved"><span className="mv-dot" />FINAL</span>
  }
  return <span className="mv-status-pill is-live"><span className="mv-dot" />AWAITING</span>
}

// Decorative arena SVG (full-bleed inside hero)
function ArenaBackdrop({ leftWinning, rightWinning, voided }: { leftWinning: boolean; rightWinning: boolean; voided: boolean }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 320"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="bg-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0c0f1d" />
          <stop offset="55%"  stopColor="#070910" />
          <stop offset="100%" stopColor="#05070d" />
        </linearGradient>
        <radialGradient id="left-arena" cx="18%" cy="55%" r="55%">
          <stop offset="0%"   stopColor="#00c8e8" stopOpacity={voided ? 0.03 : rightWinning ? 0.04 : 0.16} />
          <stop offset="100%" stopColor="#00c8e8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="right-arena" cx="82%" cy="55%" r="55%">
          <stop offset="0%"   stopColor="#F43F5E" stopOpacity={voided ? 0.03 : leftWinning ? 0.04 : 0.14} />
          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="winner-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%"   stopColor="#22C55E" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </radialGradient>
        <pattern id="hex-grid" x="0" y="0" width="32" height="28" patternUnits="userSpaceOnUse">
          <path d="M16 0 L32 8 L32 22 L16 30 L0 22 L0 8 Z"
                fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* Base */}
      <rect width="800" height="320" fill="url(#bg-base)" />
      <rect width="800" height="320" fill="url(#left-arena)" />
      <rect width="800" height="320" fill="url(#right-arena)" />
      {(leftWinning || rightWinning) && <rect width="800" height="320" fill="url(#winner-glow)" />}

      {/* Hex mesh */}
      <rect width="800" height="320" fill="url(#hex-grid)" />

      {/* Arena rings */}
      <g fill="none">
        <ellipse cx="200" cy="170" rx="160" ry="96" stroke="rgba(0,200,232,0.06)" strokeWidth="0.8" />
        <ellipse cx="200" cy="170" rx="114" ry="70" stroke="rgba(0,200,232,0.04)" strokeWidth="0.8" />
        <ellipse cx="200" cy="170" rx="70"  ry="44" stroke="rgba(0,200,232,0.035)" strokeWidth="0.8" />
        <ellipse cx="600" cy="170" rx="160" ry="96" stroke="rgba(244,63,94,0.06)"  strokeWidth="0.8" />
        <ellipse cx="600" cy="170" rx="114" ry="70" stroke="rgba(244,63,94,0.04)"  strokeWidth="0.8" />
        <ellipse cx="600" cy="170" rx="70"  ry="44" stroke="rgba(244,63,94,0.035)" strokeWidth="0.8" />
      </g>

      {/* Center light beam */}
      <line x1="400" y1="10"  x2="400" y2="310"
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
      <line x1="400" y1="20"  x2="400" y2="60"
            stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
      <line x1="400" y1="260" x2="400" y2="300"
            stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />

      {/* Corner tick marks */}
      <g stroke="rgba(0,200,232,0.3)" strokeWidth="1" fill="none">
        <polyline points="22,20 22,34 38,34" />
        <polyline points="22,300 22,286 38,286" />
      </g>
      <g stroke="rgba(244,63,94,0.28)" strokeWidth="1" fill="none">
        <polyline points="778,20 778,34 762,34" />
        <polyline points="778,300 778,286 762,286" />
      </g>

      {/* Tick labels (decorative) */}
      <text x="46" y="30" fill="rgba(255,255,255,0.3)" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="2">
        ARENA-A
      </text>
      <text x="706" y="30" fill="rgba(255,255,255,0.3)" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="2">
        ARENA-B
      </text>

      {/* Crosshair ticks at center top/bottom */}
      <line x1="390" y1="38" x2="410" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="390" y1="282" x2="410" y2="282" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  )
}

// ─── Component ──────────────────────────────────────────────────────────

export function ArenaHero({
  leagueTitle,
  matchIndex,
  matchTotal,
  playerA,
  playerB,
  winnerId,
  status,
}: ArenaHeroProps) {
  const isResolved = status === 'validated' || status === 'admin_resolved'
  const isVoided = status === 'voided'
  const isDisputed = status === 'disputed'
  const aWon = isResolved && winnerId === playerA.id
  const bWon = isResolved && winnerId === playerB.id

  // Center medallion glyph + caption
  const centerCaption = isVoided ? 'VOID' : isDisputed ? 'DISP' : isResolved ? 'FIN' : 'VS'

  return (
    <div className="mv-dossier mv-enter-hero relative">
      <ArenaBackdrop leftWinning={aWon} rightWinning={bWon} voided={isVoided} />

      {/* Overlays */}
      <div className="mv-arena-scanlines" />
      <div className="mv-energy-sweep" />
      <div className="mv-arena-vignette" />

      {/* Top strip: league + match index + status */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <span className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
            {leagueTitle ?? 'Liga'}
          </span>
          {matchIndex && matchTotal && (
            <>
              <span className="text-white/15">·</span>
              <span className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                Ronda {String(matchIndex).padStart(2, '0')} / {String(matchTotal).padStart(2, '0')}
              </span>
            </>
          )}
        </div>
        <StatusPill status={status} />
      </div>

      {/* Arena: player A | VS | player B */}
      <div className="relative grid grid-cols-[1fr_minmax(72px,92px)_1fr]">
        {/* Player A */}
        <div className={cn('mv-trainer-col mv-enter-playerA', isResolved && !aWon && 'is-dim')}>
          <div className={cn('mv-trainer-avatar', aWon ? 'mv-avatar-ring--win is-winner' : isVoided ? 'mv-avatar-ring--voided' : 'mv-avatar-ring--cyan')}>
            <Avatar className="h-full w-full rounded-full overflow-hidden">
              <AvatarImage src={playerA.avatar_url ?? undefined} alt={playerA.username} />
              <AvatarFallback className="rounded-full bg-cyan-950/80 text-cyan-200 text-xl font-black tracking-wider">
                {initials(playerA.username)}
              </AvatarFallback>
            </Avatar>
            {aWon && (
              <span className="absolute -top-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-green-400 text-black shadow-[0_0_12px_rgba(34,197,94,0.7)]">
                <Crown className="w-3.5 h-3.5" strokeWidth={2.75} />
              </span>
            )}
          </div>

          <Link
            href={`/profile/${playerA.id}`}
            className="mv-font-display font-bold text-lg sm:text-xl tracking-wide text-white/95 hover:text-cyan-200 transition-colors uppercase truncate max-w-[140px] sm:max-w-[180px] text-center"
          >
            {playerA.username}
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {playerA.rank != null && (
              <span className="mv-rank">
                <Crown className="w-3 h-3" strokeWidth={2.5} />
                #{playerA.rank}
              </span>
            )}
            <span className="mv-meta-strip">
              <span className="text-white/85">{playerA.points ?? 0}</span>
              <span className="text-white/30">PTS</span>
              <span className="mv-meta-sep">|</span>
              <span className="text-white/85">{playerA.wins ?? 0}–{playerA.losses ?? 0}</span>
            </span>
          </div>

          {aWon && (
            <span className="mv-outcome-ribbon mv-enter-stamp">
              <Crown className="w-3 h-3" strokeWidth={2.75} />
              Victory
            </span>
          )}
        </div>

        {/* VS medallion */}
        <div className="mv-vs-medallion mv-enter-vs">
          <div className={cn(
            'mv-vs-core',
            isResolved && 'is-final',
            isVoided && 'is-void',
            !isResolved && !isVoided && 'is-live'
          )}>
            {isVoided ? (
              <span className="mv-font-display font-bold text-xs text-white/35">VOID</span>
            ) : isResolved ? (
              <Flame className="w-5 h-5 text-green-400" strokeWidth={2} />
            ) : isDisputed ? (
              <Swords className="w-5 h-5 text-amber-300" strokeWidth={2} />
            ) : (
              <Swords className="w-5 h-5 text-white/85" strokeWidth={2} />
            )}
          </div>
          <span className={cn(
            'mv-font-display mv-tracking-ultra text-[10px] font-bold',
            isVoided ? 'text-white/30'
            : isResolved ? 'text-green-300/85'
            : isDisputed ? 'text-amber-300/85'
            : 'text-white/55'
          )}>
            {centerCaption}
          </span>
        </div>

        {/* Player B */}
        <div className={cn('mv-trainer-col mv-enter-playerB', isResolved && !bWon && 'is-dim')}>
          <div className={cn('mv-trainer-avatar', bWon ? 'mv-avatar-ring--win is-winner' : isVoided ? 'mv-avatar-ring--voided' : 'mv-avatar-ring--rose')}>
            <Avatar className="h-full w-full rounded-full overflow-hidden">
              <AvatarImage src={playerB.avatar_url ?? undefined} alt={playerB.username} />
              <AvatarFallback className="rounded-full bg-rose-950/80 text-rose-200 text-xl font-black tracking-wider">
                {initials(playerB.username)}
              </AvatarFallback>
            </Avatar>
            {bWon && (
              <span className="absolute -top-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-green-400 text-black shadow-[0_0_12px_rgba(34,197,94,0.7)]">
                <Crown className="w-3.5 h-3.5" strokeWidth={2.75} />
              </span>
            )}
          </div>

          <Link
            href={`/profile/${playerB.id}`}
            className="mv-font-display font-bold text-lg sm:text-xl tracking-wide text-white/95 hover:text-rose-200 transition-colors uppercase truncate max-w-[140px] sm:max-w-[180px] text-center"
          >
            {playerB.username}
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {playerB.rank != null && (
              <span className="mv-rank">
                <Crown className="w-3 h-3" strokeWidth={2.5} />
                #{playerB.rank}
              </span>
            )}
            <span className="mv-meta-strip">
              <span className="text-white/85">{playerB.points ?? 0}</span>
              <span className="text-white/30">PTS</span>
              <span className="mv-meta-sep">|</span>
              <span className="text-white/85">{playerB.wins ?? 0}–{playerB.losses ?? 0}</span>
            </span>
          </div>

          {bWon && (
            <span className="mv-outcome-ribbon mv-enter-stamp">
              <Crown className="w-3 h-3" strokeWidth={2.75} />
              Victory
            </span>
          )}
        </div>
      </div>

      {/* Voided banner below the grid */}
      {isVoided && (
        <div className="relative px-4 sm:px-6 pb-4 -mt-2">
          <div className="mv-outcome-ribbon is-void w-full justify-center">
            Sin puntos — Partida anulada
          </div>
        </div>
      )}
    </div>
  )
}
