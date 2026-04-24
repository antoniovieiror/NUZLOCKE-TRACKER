'use client'

import { useEffect, useState } from 'react'

type Species = 'kyogre' | 'groudon'

export function LegendaryAside({
  species,
  align,
}: {
  species: Species
  align: 'left' | 'right'
}) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${species}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ??
              null,
          )
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [species])

  return (
    <div className={`tc-legendary-aside ${species} ${align}`} aria-hidden>
      <span className="tc-mini-rivet tl" />
      <span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" />
      <span className="tc-mini-rivet br" />

      <div className="tc-legendary-bg" />
      <div className="tc-legendary-halo" />
      <div className="tc-legendary-rune outer" />
      <div className="tc-legendary-rune inner" />

      <div className="tc-legendary-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="tc-legendary-particle"
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="tc-legendary-shock" />

      <div className="tc-legendary-sprite-wrap">
        {sprite && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sprite}
            alt=""
            loading="lazy"
            className="tc-legendary-sprite"
          />
        )}
      </div>
    </div>
  )
}
