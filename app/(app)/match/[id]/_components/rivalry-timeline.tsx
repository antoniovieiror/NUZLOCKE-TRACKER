import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Match } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────

interface RivalryEntry {
  id: string
  status: Match['status']
  winnerId: string | null
  playerAId: string
  playerBId: string
  leagueTitle: string | null
  createdAt: string // ISO
}

interface RivalryTimelineProps {
  // Ordered oldest → newest
  entries: RivalryEntry[]
  currentMatchId: string
  // Canonical player A / B on the current match (for color mapping)
  playerA: { id: string; username: string }
  playerB: { id: string; username: string }
}

// ─── Component ──────────────────────────────────────────────────────────

export function RivalryTimeline({ entries, currentMatchId, playerA, playerB }: RivalryTimelineProps) {
  // Count W/L from the perspective of current playerA vs playerB,
  // accounting for the fact that historical matches may have them swapped.
  let aWins = 0
  let bWins = 0
  let voided = 0

  for (const e of entries) {
    if (e.status === 'voided') { voided++; continue }
    if (e.status !== 'validated' && e.status !== 'admin_resolved') continue
    if (e.winnerId === playerA.id) aWins++
    else if (e.winnerId === playerB.id) bWins++
  }

  const totalResolved = aWins + bWins
  const aPct = totalResolved === 0 ? 50 : (aWins / totalResolved) * 100
  const bPct = 100 - aPct

  return (
    <section className="mv-section mv-enter-2" aria-labelledby="riv-title">
      <header className="mv-section-head">
        <h2 id="riv-title" className="mv-section-title">
          <span className="mv-idx">02</span>
          Rivalry Record
        </h2>
        <span className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
          {entries.length} {entries.length === 1 ? 'choque' : 'choques'}
        </span>
      </header>

      {/* Score ratio bar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="mv-font-display text-sm font-bold uppercase tracking-wider mv-rivalry-tally-a">
            {playerA.username}
          </span>
          <span className="mv-font-mono text-sm font-bold tabular-nums text-white/85">
            <span className="text-cyan-300">{aWins}</span>
            <span className="text-white/25 mx-2">·</span>
            <span className="text-rose-300">{bWins}</span>
          </span>
          <span className="mv-font-display text-sm font-bold uppercase tracking-wider mv-rivalry-tally-b">
            {playerB.username}
          </span>
        </div>
        <div className="flex h-1 rounded-full overflow-hidden gap-[2px] bg-white/[0.04]">
          {totalResolved === 0 ? (
            <div className="flex-1 rounded-full bg-white/5" />
          ) : (
            <>
              <div
                className="rounded-l-full"
                style={{
                  width: `${aPct}%`,
                  background: 'linear-gradient(90deg, rgba(0,200,232,0.85), rgba(0,200,232,0.4))',
                }}
              />
              <div
                className="rounded-r-full"
                style={{
                  width: `${bPct}%`,
                  background: 'linear-gradient(270deg, rgba(244,63,94,0.85), rgba(244,63,94,0.4))',
                }}
              />
            </>
          )}
        </div>
        {voided > 0 && (
          <p className="mv-font-mono text-[10px] text-white/35 tracking-[0.15em] uppercase">
            {voided} {voided === 1 ? 'partida anulada' : 'partidas anuladas'} (fuera de récord)
          </p>
        )}
      </div>

      {/* Timeline dots */}
      {entries.length > 0 && (
        <div>
          <div className="mv-rivalry-track" role="list">
            {entries.map((e) => {
              const isCurrent = e.id === currentMatchId
              const resolved = e.status === 'validated' || e.status === 'admin_resolved'
              const v = e.status === 'voided'
              const cls = cn(
                'mv-rivalry-dot',
                isCurrent && 'current',
                v && 'voided',
                resolved && e.winnerId === playerA.id && 'win-a',
                resolved && e.winnerId === playerB.id && 'win-b',
                !resolved && !v && 'pending',
              )
              const d = new Date(e.createdAt)
              const label = `${e.leagueTitle ?? 'Liga'} · ${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}`
              const outcome = v ? 'Anulada'
                : resolved && e.winnerId === playerA.id ? `Ganó ${playerA.username}`
                : resolved && e.winnerId === playerB.id ? `Ganó ${playerB.username}`
                : 'Pendiente'
              return (
                <Link
                  key={e.id}
                  href={`/match/${e.id}`}
                  className={cls}
                  aria-label={`${label} — ${outcome}`}
                  title={`${label} — ${outcome}`}
                  role="listitem"
                />
              )
            })}
          </div>
          <div className="mt-1 flex items-center justify-between mv-font-mono text-[9px] tracking-[0.22em] uppercase text-white/30">
            <span>← antiguas</span>
            <span>recientes →</span>
          </div>
        </div>
      )}
    </section>
  )
}
