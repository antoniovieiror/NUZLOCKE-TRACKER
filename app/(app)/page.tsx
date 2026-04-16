import Link from 'next/link'
import { Trophy, Crown, Swords, History } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ─── Full-bleed atmosphere ────────────────────────────────────────────────────

function PageAtmosphere() {
  return (
    <div className="pointer-events-none select-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Animated dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,223,0,0.22) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          animation: 'lb-grid-drift 30s linear infinite',
          opacity: 0.28,
        }}
      />

      {/* Atmospheric radial glows */}
      <div className="absolute" style={{ top: '-15%', left: '-8%', width: '60%', height: '65%', background: 'radial-gradient(ellipse, rgba(255,223,0,0.065) 0%, transparent 65%)' }} />
      <div className="absolute" style={{ bottom: '-8%', right: '-5%', width: '48%', height: '52%', background: 'radial-gradient(ellipse, rgba(0,200,232,0.050) 0%, transparent 65%)' }} />
      <div className="absolute" style={{ top: '30%', right: '25%', width: '30%', height: '35%', background: 'radial-gradient(ellipse, rgba(255,223,0,0.030) 0%, transparent 70%)' }} />

      {/* ── Main Pokéball — right side, slowly rotating ── */}
      <svg
        className="absolute"
        style={{
          width: '700px', height: '700px',
          right: '-80px', top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.085,           /* brighter than before */
          animation: 'lb-pokeball-spin 90s linear infinite',
          transformOrigin: 'center center',
        }}
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="92" stroke="white" strokeWidth="5" />
        <path d="M8 100 H192" stroke="white" strokeWidth="5" />
        <circle cx="100" cy="100" r="26" stroke="white" strokeWidth="5" />
        <circle cx="100" cy="100" r="14" fill="white" />
        {/* Inner decorative rings */}
        <circle cx="100" cy="100" r="55" stroke="white" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.5"/>
        <circle cx="100" cy="100" r="72" stroke="white" strokeWidth="1" strokeDasharray="12 8" opacity="0.3"/>
      </svg>

      {/* ── Secondary smaller Pokéball — bottom left ── */}
      <svg
        className="absolute"
        style={{
          width: '340px', height: '340px',
          left: '-50px', bottom: '3%',
          opacity: 0.055,
        }}
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="92" stroke="white" strokeWidth="6" />
        <path d="M8 100 H192" stroke="white" strokeWidth="6" />
        <circle cx="100" cy="100" r="26" stroke="white" strokeWidth="6" />
        <circle cx="100" cy="100" r="14" fill="white" />
      </svg>

      {/* ── Energy sweep line — periodic flash across the page ── */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,223,0,0.35), transparent)',
          animation: 'lb-energy-sweep 12s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '55%',
          width: '80px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,200,232,0.25), transparent)',
          animation: 'lb-energy-sweep 16s ease-in-out infinite',
          animationDelay: '8s',
        }}
      />
    </div>
  )
}

// ─── Podium platform config ───────────────────────────────────────────────────

const PODIUM = {
  1: {
    order: 2,
    platformH: 130,
    sideH: 17,
    avatarSz: 88,
    ringColor: 'rgba(255,223,0,0.65)',
    ringWidth: 3,
    glow: true,
    crownIcon: true,
    numColor: '#ffdf00',
    numShadow: '0 0 32px rgba(255,223,0,0.60)',
    platformGrad: 'linear-gradient(180deg, #252f3f 0%, #121a28 100%)',
    platformTopBorder: '2px solid rgba(255,223,0,0.30)',
    platformSide: 'linear-gradient(180deg, #0d1822 0%, #080e18 100%)',
    sideBorder: '1px solid rgba(255,223,0,0.10)',
    ptsColor: '#ffdf00',
    ptsSz: '2rem',
    nameColor: '#ffffff',
    nameSz: '1rem',
    labelColor: 'rgba(255,223,0,0.65)',
    animDelay: '0ms',
    flex: '0 0 36%',
    maxWidth: '320px',
    isChampion: true,
  },
  2: {
    order: 1,
    platformH: 88,
    sideH: 13,
    avatarSz: 70,
    ringColor: 'rgba(180,190,215,0.45)',
    ringWidth: 2,
    glow: false,
    crownIcon: false,
    numColor: 'rgba(170,182,200,0.62)',
    numShadow: 'none',
    platformGrad: 'linear-gradient(180deg, #1c2838 0%, #0e1825 100%)',
    platformTopBorder: '1px solid rgba(255,255,255,0.10)',
    platformSide: 'linear-gradient(180deg, #0a1320 0%, #060d18 100%)',
    sideBorder: '1px solid rgba(255,255,255,0.04)',
    ptsColor: '#9aaec0',
    ptsSz: '1.6rem',
    nameColor: '#c0ccd8',
    nameSz: '0.92rem',
    labelColor: 'rgba(148,168,192,0.58)',
    animDelay: '90ms',
    flex: '0 0 32%',
    maxWidth: '290px',
    isChampion: false,
  },
  3: {
    order: 3,
    platformH: 58,
    sideH: 10,
    avatarSz: 60,
    ringColor: 'rgba(185,115,60,0.48)',
    ringWidth: 2,
    glow: false,
    crownIcon: false,
    numColor: 'rgba(185,115,60,0.72)',
    numShadow: 'none',
    platformGrad: 'linear-gradient(180deg, #1e2332 0%, #111520 100%)',
    platformTopBorder: '1px solid rgba(185,115,60,0.18)',
    platformSide: 'linear-gradient(180deg, #0a0e1a 0%, #060810 100%)',
    sideBorder: '1px solid rgba(185,115,60,0.07)',
    ptsColor: '#c47a38',
    ptsSz: '1.35rem',
    nameColor: '#c0ccd8',
    nameSz: '0.88rem',
    labelColor: 'rgba(185,115,60,0.58)',
    animDelay: '160ms',
    flex: '0 0 32%',
    maxWidth: '290px',
    isChampion: false,
  },
} as const

// ─── Podium slot ──────────────────────────────────────────────────────────────

function PodiumSlot({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const c = PODIUM[rank]
  const rankLabels = { 1: '1er Lugar', 2: '2do Lugar', 3: '3er Lugar' } as const

  return (
    <div
      className={`lb-podium-slot${c.isChampion ? ' is-champion' : ''}`}
      style={{
        order: c.order,
        flex: c.flex,
        maxWidth: c.maxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: `lb-fade-up 0.65s ease both`,
        animationDelay: c.animDelay,
      }}
    >
      {/* ── Player info above platform ── */}
      <Link
        href={`/profile/${entry.id}`}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', marginBottom: '14px', textDecoration: 'none' }}
        className="group"
      >
        {/* Floating crown */}
        {c.crownIcon && (
          <Crown
            style={{
              width: '22px', height: '22px',
              color: '#ffdf00', fill: '#ffdf00',
              filter: 'drop-shadow(0 0 10px rgba(255,223,0,0.70))',
              animation: 'lb-float-crown 3.2s ease-in-out infinite',
            }}
            strokeWidth={0.5}
          />
        )}

        {/* Avatar with ring glow */}
        <div
          className={c.isChampion ? 'lb-champion-ring' : ''}
          style={{
            width: c.avatarSz + 10,
            height: c.avatarSz + 10,
            borderRadius: '9999px',
            border: `${c.ringWidth}px solid ${c.ringColor}`,
            padding: '4px',
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.04), transparent)',
            ...(c.glow ? { animation: 'lb-gold-pulse 2.8s ease-in-out infinite' } : {}),
          }}
        >
          <Avatar
            style={{ width: c.avatarSz, height: c.avatarSz }}
            className="transition-transform duration-200 group-hover:scale-105"
          >
            <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username} />
            <AvatarFallback
              style={{
                background: '#111a28',
                color: rank === 1 ? '#ffdf00' : '#4a6880',
                fontSize: c.avatarSz > 80 ? '1.4rem' : c.avatarSz > 65 ? '1.1rem' : '0.95rem',
                fontWeight: 900,
              }}
            >
              {entry.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Rank label pill */}
        <span
          style={{
            fontSize: '9px',
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: c.labelColor,
            border: `1px solid ${c.ringColor}`,
            borderRadius: '999px',
            padding: '2px 10px',
          }}
        >
          {rankLabels[rank]}
        </span>

        {/* Username */}
        <p
          style={{ color: c.nameColor, fontSize: c.nameSz, fontWeight: 700, maxWidth: '110px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          className="group-hover:underline underline-offset-4"
        >
          {entry.username}
        </p>

        {/* Points */}
        <p style={{ color: c.ptsColor, fontSize: c.ptsSz, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 900, lineHeight: 1 }}>
          {entry.total_points}
          <span style={{ fontSize: '0.55em', opacity: 0.5, marginLeft: '3px', fontWeight: 400 }}>pts</span>
        </p>

        {/* W / L */}
        <p style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: '#2e4055' }}>
          <span style={{ color: 'rgba(74,222,128,0.78)' }}>{entry.total_wins}V</span>
          <span style={{ margin: '0 5px', opacity: 0.25 }}>·</span>
          <span style={{ color: 'rgba(248,113,113,0.78)' }}>{entry.total_losses}D</span>
          <span style={{ margin: '0 5px', opacity: 0.25 }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.22)' }}>{Number(entry.winrate).toFixed(0)}%</span>
        </p>
      </Link>

      {/* ── 3D Platform ── */}
      <div style={{ width: '100%' }}>
        {/* Top face */}
        <div
          className="lb-platform-face"
          style={{
            height: c.platformH,
            background: c.platformGrad,
            borderTop: c.platformTopBorder,
            borderLeft: c.sideBorder,
            borderRight: c.sideBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <span
            className="font-heading font-black select-none"
            style={{ fontSize: '4.2rem', color: c.numColor, textShadow: c.numShadow, lineHeight: 1 }}
          >
            {rank}
          </span>
        </div>
        {/* Side depth */}
        <div style={{ height: c.sideH, background: c.platformSide, clipPath: 'polygon(0 0, 100% 0, 97% 100%, 3% 100%)' }} />
        {/* Ground shadow */}
        <div style={{ height: '10px', background: 'rgba(0,0,0,0.78)', filter: 'blur(10px)', borderRadius: '0 0 8px 8px', marginTop: '1px' }} />
      </div>
    </div>
  )
}

// ─── Player row (#4+) ─────────────────────────────────────────────────────────

function PlayerRow({ entry, rank, delay }: { entry: LeaderboardEntry; rank: number; delay: number }) {
  const winrate = Number(entry.winrate) || 0
  const rankStr = String(rank).padStart(2, '0')

  return (
    <Link
      href={`/profile/${entry.id}`}
      className="lb-player-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '14px 40px',
        borderBottom: '1px solid #0c1620',
        animation: 'lb-fade-up 0.5s ease both',
        animationDelay: `${delay}ms`,
        textDecoration: 'none',
      }}
    >
      <span className="lb-rank-num" style={{ width: '38px', textAlign: 'right', flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 900, fontSize: '1rem', color: '#182430', transition: 'color 0.2s ease' }}>
        #{rankStr}
      </span>

      <Avatar style={{ width: '44px', height: '44px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.07)' }}>
        <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username} />
        <AvatarFallback style={{ background: '#0d1820', color: '#334858', fontSize: '0.8rem', fontWeight: 700 }}>
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#b0c0d0', fontSize: '0.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.username}
          {entry.status === 'inactive' && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#1e2e3e', fontFamily: "'IBM Plex Mono', monospace" }}>inactivo</span>}
        </p>
        {/* Win-rate bar */}
        <div style={{ marginTop: '6px', height: '3px', background: '#0a1420', borderRadius: '2px', overflow: 'hidden', maxWidth: '220px' }}>
          <div style={{ width: `${winrate}%`, height: '100%', background: 'linear-gradient(90deg, #ffdf00 0%, rgba(255,223,0,0.28) 100%)', borderRadius: '2px', animation: 'lb-bar-grow 1.2s ease both', animationDelay: `${delay + 200}ms` }} />
        </div>
      </div>

      <div className="hidden md:flex" style={{ alignItems: 'center', gap: '36px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', width: '48px' }}>
          <p style={{ fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.18em', textTransform: 'uppercase', color: '#182430' }}>Wins</p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 900, color: 'rgba(74,222,128,0.80)', fontSize: '1rem' }}>{entry.total_wins}</p>
        </div>
        <div style={{ textAlign: 'center', width: '48px' }}>
          <p style={{ fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.18em', textTransform: 'uppercase', color: '#182430' }}>Losses</p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 900, color: 'rgba(248,113,113,0.80)', fontSize: '1rem' }}>{entry.total_losses}</p>
        </div>
        <div style={{ textAlign: 'center', width: '52px' }}>
          <p style={{ fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.18em', textTransform: 'uppercase', color: '#182430' }}>Winrate</p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#2e4858', fontSize: '0.92rem' }}>{winrate.toFixed(0)}%</p>
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '68px' }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 900, color: '#ffdf00', fontSize: '1.1rem' }}>
          {entry.total_points}
          <span style={{ fontWeight: 400, color: '#182430', fontSize: '0.72rem', marginLeft: '3px' }}>pts</span>
        </p>
      </div>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <svg viewBox="0 0 200 200" fill="none" style={{ width: '90px', height: '90px', opacity: 0.07 }}>
        <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="7" />
        <path d="M10 100 H190" stroke="white" strokeWidth="7" />
        <circle cx="100" cy="100" r="22" stroke="white" strokeWidth="7" />
        <circle cx="100" cy="100" r="11" fill="white" />
      </svg>
      <p className="font-heading font-black uppercase tracking-widest" style={{ color: '#eff5fb', fontSize: '1.4rem' }}>La arena está vacía</p>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#1e3040', maxWidth: '260px', lineHeight: 1.8 }}>
        Ningún entrenador ha entrado aún.<br />El admin debe crear cuentas de jugador.
      </p>
    </div>
  )
}

// ─── Decorative divider ───────────────────────────────────────────────────────

function EnergyDivider() {
  return (
    <div
      style={{
        height: '1px',
        margin: '0 5%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,223,0,0.15) 20%, rgba(255,223,0,0.30) 50%, rgba(255,223,0,0.15) 80%, transparent 100%)',
        position: 'relative',
      }}
    >
      {/* Center diamond */}
      <div
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%) rotate(45deg)',
          width: '6px', height: '6px',
          background: 'rgba(255,223,0,0.55)',
          boxShadow: '0 0 8px rgba(255,223,0,0.40)',
        }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('leaderboard').select('*')

  const leaderboard = (data ?? []) as LeaderboardEntry[]
  const top3 = leaderboard.slice(0, 3) as (LeaderboardEntry & { rank: 1 | 2 | 3 })[]
  const rest = leaderboard.slice(3)

  return (
    /*
     * Full-bleed breakout trick:
     * position: relative + left: 50% + translateX(-50%) + width: 100vw
     * This escapes any max-width container regardless of nesting depth.
     */
    <div
      style={{
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100vw',
        marginTop: '-2rem',
        overflow: 'hidden',
        minHeight: '92vh',
      }}
    >
      <PageAtmosphere />

      {/* ══════ HERO HEADER — compact to keep podium above fold ══════ */}
      <div
        style={{
          paddingTop: '40px',
          paddingBottom: '22px',
          textAlign: 'center',
          position: 'relative',
          animation: 'lb-fade-up 0.55s ease both',
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(255,223,0,0.18)',
            background: 'rgba(255,223,0,0.05)',
            marginBottom: '14px',
          }}
        >
          <Trophy style={{ width: '11px', height: '11px', color: '#ffdf00' }} strokeWidth={2.5} />
          <span style={{ fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,223,0,0.68)' }}>
            Campeonato Nuzlocke
          </span>
        </div>

        {/* Main title — sized to not push podium off-screen */}
        <h1
          className="font-heading font-black uppercase"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', letterSpacing: '0.10em', lineHeight: 0.95, color: '#eff5fb', marginBottom: '10px' }}
        >
          Trainer
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #e0c000 0%, #ffdf00 28%, #ffe566 55%, #ffdf00 75%, #e0c000 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'lb-shimmer 5s linear infinite',
            }}
          >
            Rankings
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.28em', textTransform: 'uppercase', color: '#1e3040', marginBottom: '22px' }}>
          Rankings históricos · todas las ligas
          {leaderboard.length > 0 && <> · <span style={{ color: 'rgba(255,223,0,0.42)' }}>{leaderboard.length}</span> entrenadores</>}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 18px', borderRadius: '999px', background: 'rgba(255,223,0,0.10)', border: '1px solid rgba(255,223,0,0.25)', color: '#ffdf00', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'default' }}>
            All-time
          </span>
          <Link href="/league" className="lb-tab-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 18px', borderRadius: '999px', border: '1px solid transparent', color: '#243444', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", textDecoration: 'none', transition: 'color 0.15s, background 0.15s' }}>
            <Swords style={{ width: '11px', height: '11px' }} /> Liga Activa
          </Link>
          <Link href="/history" className="lb-tab-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 18px', borderRadius: '999px', border: '1px solid transparent', color: '#243444', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", textDecoration: 'none', transition: 'color 0.15s, background 0.15s' }}>
            <History style={{ width: '11px', height: '11px' }} /> Historial
          </Link>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ══════ PODIUM ══════ */}
          {top3.length > 0 && (
            <div style={{ position: 'relative', paddingLeft: '3%', paddingRight: '3%' }}>
              {/* Champion radial glow */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 44% 60% at 50% 45%, rgba(255,223,0,0.065) 0%, transparent 68%)', pointerEvents: 'none' }} />

              <div
                className="lb-podium"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  gap: '8px',
                  maxWidth: '1100px',
                  margin: '0 auto',
                }}
              >
                {top3.map((entry, i) => (
                  <PodiumSlot key={entry.id} entry={entry} rank={(i + 1) as 1 | 2 | 3} />
                ))}
              </div>
            </div>
          )}

          {/* ══════ ENERGY DIVIDER ══════ */}
          <div style={{ marginTop: '32px' }}>
            <EnergyDivider />
          </div>

          {/* ══════ RANKINGS TABLE ══════ */}
          {rest.length > 0 && (
            <div
              style={{
                margin: '24px 3% 0',
                background: 'rgba(6,12,20,0.88)',
                border: '1px solid #0e1c2c',
                borderRadius: '14px',
                overflow: 'hidden',
                backdropFilter: 'blur(6px)',
                animation: 'lb-fade-in 0.6s ease both',
                animationDelay: '300ms',
              }}
            >
              {/* Table header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '9px 40px', background: 'rgba(8,14,24,0.92)', borderBottom: '1px solid #0c1824' }}>
                <span style={{ width: '38px', flexShrink: 0 }} />
                <span style={{ width: '44px', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '8px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.24em', textTransform: 'uppercase', color: '#162030' }}>Entrenador</span>
                <div className="hidden md:flex" style={{ gap: '36px' }}>
                  {['Wins', 'Losses', 'Winrate'].map(h => (
                    <span key={h} style={{ width: h === 'Winrate' ? '52px' : '48px', textAlign: 'center', fontSize: '8px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.18em', textTransform: 'uppercase', color: '#162030' }}>{h}</span>
                  ))}
                </div>
                <span style={{ minWidth: '68px', textAlign: 'right', fontSize: '8px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.18em', textTransform: 'uppercase', color: '#162030' }}>Puntos</span>
              </div>

              {rest.map((entry, i) => (
                <PlayerRow key={entry.id} entry={entry} rank={i + 4} delay={i * 55} />
              ))}
            </div>
          )}

          <div style={{ height: '60px' }} />
        </>
      )}

      {error && (
        <p style={{ textAlign: 'center', color: '#f87171', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', padding: '16px' }}>
          Error: {error.message}
        </p>
      )}
    </div>
  )
}
