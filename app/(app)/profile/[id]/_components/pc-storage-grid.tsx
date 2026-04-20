'use client'

import { useState, useEffect } from 'react'
import type { PokemonEntry } from '@/lib/types'

interface TooltipData { x: number; y: number; title: string; sub: string }

function PCSlot({ entry, index, onTip }: { entry: PokemonEntry; index: number; onTip: (d: TooltipData | null) => void }) {
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
      className="tc-pc-slot"
      style={{ '--pc-index': index } as React.CSSProperties}
      onMouseEnter={e => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName })}
      onMouseMove={e => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName })}
      onMouseLeave={() => onTip(null)}
    >
      <div className="pc-sprite">
        {sprite && <img src={sprite} alt={entry.species} loading="lazy" />}
      </div>
      <div className="pc-label">{label}</div>
    </div>
  )
}

export function PCStorageGrid({ box }: { box: PokemonEntry[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>PC Storage</h2>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--tc-accent)', fontSize: 11, letterSpacing: '0.1em' }}>
          {box.length} almacenados
        </span>
      </div>
      <div className="tc-panel-inner">
        {box.length === 0 ? (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#5d647a', textAlign: 'center', padding: '16px 0' }}>
            Caja vacia
          </p>
        ) : (
          <div className="tc-pc-grid">
            {box.map((entry, i) => (
              <PCSlot key={`${entry.species}-${i}`} entry={entry} index={i} onTip={setTooltip} />
            ))}
          </div>
        )}
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
