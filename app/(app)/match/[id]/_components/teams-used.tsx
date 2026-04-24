import { Crown } from 'lucide-react'

import { TeamSlot } from '@/components/pokemon/team-slot'
import type { PokemonEntry } from '@/lib/types'

interface TeamsUsedProps {
  playerA: { username: string }
  playerB: { username: string }
  teamA: PokemonEntry[] | null
  teamB: PokemonEntry[] | null
  mvpA: string | null
  mvpB: string | null
}

const SLOT_COUNT = 6

function padTeam(team: PokemonEntry[] | null): (PokemonEntry | null)[] {
  const base: (PokemonEntry | null)[] = team ? [...team] : []
  while (base.length < SLOT_COUNT) base.push(null)
  return base.slice(0, SLOT_COUNT)
}

function formatSpecies(species: string | null) {
  if (!species) return null
  return species
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

function TeamColumn({
  side,
  username,
  team,
  mvp,
}: {
  side: 'a' | 'b'
  username: string
  team: PokemonEntry[] | null
  mvp: string | null
}) {
  const slots = padTeam(team)
  const mvpLabel = formatSpecies(mvp)

  return (
    <div className={`mv-team-col side-${side}`}>
      <div className="mv-team-head">
        <span className="mv-team-trainer">{username}</span>
        {mvpLabel && (
          <span className="mv-team-mvp-caption">
            <Crown className="h-2.5 w-2.5 mv-mvp-key" strokeWidth={2.6} />
            MVP · {mvpLabel}
          </span>
        )}
      </div>
      <div className="mv-team-slots">
        {slots.map((entry, i) => {
          const isMvp = !!(entry && mvp && entry.species === mvp)
          return <TeamSlot key={i} entry={entry} isMvp={isMvp} />
        })}
      </div>
    </div>
  )
}

export function TeamsUsed({ playerA, playerB, teamA, teamB, mvpA, mvpB }: TeamsUsedProps) {
  const hasAny = (teamA && teamA.length > 0) || (teamB && teamB.length > 0)

  return (
    <section className="mv-section mv-enter-1" aria-labelledby="teams-used-title">
      <header className="mv-section-head">
        <h2 id="teams-used-title" className="mv-section-title">
          <span className="mv-idx">01</span>
          Equipos Usados
        </h2>
        <span className="mv-font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
          Snapshot del combate
        </span>
      </header>

      {hasAny ? (
        <div className="mv-teams-grid">
          <TeamColumn side="a" username={playerA.username} team={teamA} mvp={mvpA} />
          <TeamColumn side="b" username={playerB.username} team={teamB} mvp={mvpB} />
        </div>
      ) : (
        <div className="mv-teams-placeholder">
          <p>Historial de equipos no disponible para esta partida</p>
        </div>
      )}
    </section>
  )
}
