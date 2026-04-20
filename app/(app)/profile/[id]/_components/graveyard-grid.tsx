'use client'

import { useState, useEffect } from 'react'
import type { PokemonEntry } from '@/lib/types'

interface TooltipData { x: number; y: number; title: string; sub: string }

function GraveyardSlot({ entry, index, onTip }: { entry: PokemonEntry; index: number; onTip: (d: TooltipData | null) => void }) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${entry.species}`)
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
      className="tc-grave-slot"
      style={{ '--pc-index': index } as React.CSSProperties}
      onMouseEnter={e => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName })}
      onMouseMove={e => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName })}
      onMouseLeave={() => onTip(null)}
    >
      {/* Tombstone SVG background */}
      <svg className="tc-tombstone-bg" viewBox="0 0 80 100" preserveAspectRatio="none" aria-hidden>
        <path
          d="M10,100 L10,35 Q10,5 40,5 Q70,5 70,35 L70,100 Z"
          fill="url(#tombstone-grad)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="tombstone-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2e3c" />
            <stop offset="100%" stopColor="#12141e" />
          </linearGradient>
        </defs>
        {/* Cross engraving */}
        <line x1="40" y1="18" x2="40" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <line x1="32" y1="25" x2="48" y2="25" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      </svg>
      <div className="tc-grave-sprite">
        {sprite && <img src={sprite} alt={entry.species} loading="lazy" />}
      </div>
      <div className="tc-grave-label">{label}</div>
    </div>
  )
}

export function GraveyardGrid({ graveyard }: { graveyard: PokemonEntry[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header tc-graveyard-header">
        <h2>Cementerio</h2>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#ff6b6b', fontSize: 11, letterSpacing: '0.1em' }}>
          {graveyard.length} caidos
        </span>
      </div>
      <div className="tc-panel-inner">
        {graveyard.length === 0 ? (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#5d647a', textAlign: 'center', padding: '16px 0' }}>
            Sin bajas... por ahora
          </p>
        ) : (
          <div className="tc-grave-grid">
            {graveyard.map((entry, i) => (
              <GraveyardSlot key={`${entry.species}-${i}`} entry={entry} index={i} onTip={setTooltip} />
            ))}
          </div>
        )}
      </div>

      {tooltip && (
        <div className="tc-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tooltip-title" style={{ color: '#ff6b6b' }}>{tooltip.title}</div>
          <div className="tooltip-sub">{tooltip.sub}</div>
        </div>
      )}
    </div>
  )
}
