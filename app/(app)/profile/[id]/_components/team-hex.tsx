'use client'

import { useState, useEffect } from 'react'
import type { PokemonEntry } from '@/lib/types'

interface TooltipData {
  x: number
  y: number
  title: string
  sub: string
}

function spriteUrl(species: string) {
  return `https://pokeapi.co/api/v2/pokemon/${species}`
}

function TeamSlot({ entry, index, onTip }: { entry: PokemonEntry; index: number; onTip: (d: TooltipData | null) => void }) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(spriteUrl(entry.species))
      .then(r => r.json())
      .then(data => {
        if (!cancelled)
          setSprite(data.sprites?.other?.['official-artwork']?.front_default ?? data.sprites?.front_default ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [entry.species])

  const label = entry.nickname || entry.species.replace(/-/g, ' ')
  const speciesName = entry.species.replace(/-/g, ' ')

  return (
    <div
      className={`tc-team-slot s${index}`}
      onMouseEnter={e => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName })}
      onMouseMove={e => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName })}
      onMouseLeave={() => onTip(null)}
    >
      {sprite && <img src={sprite} alt={entry.species} loading="lazy" />}
      <div className="slot-label">{label.toUpperCase()}</div>
      <div className="slot-species">{speciesName}</div>
    </div>
  )
}

function EmptySlot({ index }: { index: number }) {
  return (
    <div className={`tc-team-slot s${index}`} style={{ opacity: 0.3 }}>
      <span style={{ color: '#5d647a', fontSize: 24, fontWeight: 700 }}>?</span>
    </div>
  )
}

export function TeamHex({ team, canEdit, editButton }: { team: PokemonEntry[]; canEdit: boolean; editButton?: React.ReactNode }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const slots = Array.from({ length: 6 }, (_, i) => team[i] ?? null)

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>Team Hub</h2>
        {canEdit && editButton}
      </div>
      <div className="tc-panel-inner">
        <div className="tc-team-hex">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <g stroke="rgba(0,200,232,0.2)" strokeWidth="0.4" fill="none">
              <line x1="50" y1="15" x2="50" y2="50" />
              <line x1="80" y1="30" x2="50" y2="50" />
              <line x1="80" y1="70" x2="50" y2="50" />
              <line x1="50" y1="85" x2="50" y2="50" />
              <line x1="20" y1="70" x2="50" y2="50" />
              <line x1="20" y1="30" x2="50" y2="50" />
            </g>
          </svg>
          <div className="tc-team-center" title="Pokeball" />
          {slots.map((entry, i) =>
            entry ? (
              <TeamSlot key={`${entry.species}-${i}`} entry={entry} index={i} onTip={setTooltip} />
            ) : (
              <EmptySlot key={`empty-${i}`} index={i} />
            )
          )}
        </div>
        <div className="text-center mt-6" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: 'var(--tc-accent)' }}>
          {team.length}/6 Pokemon
        </div>
      </div>

      {tooltip && (
        <div className="tc-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tooltip-title">{tooltip.title}</div>
          <div className="tooltip-sub">{tooltip.sub}</div>
        </div>
      )}
    </div>
  )
}
