'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface MvpCardProps {
  species: string
  nickname: string
}

export function MvpCard({ species, nickname }: MvpCardProps) {
  const [sprite, setSprite] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSprite(null)
    fetch(`https://pokeapi.co/api/v2/pokemon/${species}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled)
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ?? null
          )
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [species])

  return (
    <div className="relative rounded-xl overflow-hidden border border-amber-300/60 dark:border-amber-600/40 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-amber-50/20 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-amber-950/10 shadow-md shadow-amber-200/60 dark:shadow-amber-900/30 p-3">
      {/* Subtle shimmer layer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
        aria-hidden
        style={{
          background:
            'linear-gradient(135deg, transparent 40%, rgba(251,191,36,0.25) 50%, transparent 60%)',
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Sprite */}
        <div className="relative shrink-0 w-16 h-16">
          {loading ? (
            <Skeleton className="w-full h-full rounded-lg" />
          ) : sprite ? (
            <img
              src={sprite}
              alt={species}
              width={64}
              height={64}
              className="object-contain w-full h-full drop-shadow-md"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-2xl">
              ?
            </div>
          )}
          {/* Crown badge on sprite */}
          <span
            className="absolute -top-2 -right-2 text-base drop-shadow select-none"
            aria-hidden
          >
            👑
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          {nickname && (
            <p className="text-sm font-bold leading-tight text-amber-900 dark:text-amber-200 truncate">
              {nickname}
            </p>
          )}
          <p className={`capitalize leading-tight truncate ${nickname ? 'text-xs text-amber-700/70 dark:text-amber-400/70' : 'text-sm font-bold text-amber-900 dark:text-amber-200'}`}>
            {species.replace(/-/g, ' ')}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-0.5">
            MVP
          </p>
        </div>
      </div>
    </div>
  )
}

export function MvpEmpty() {
  return (
    <p className="text-sm text-muted-foreground italic">
      Sin definir — selecciona un MVP desde tu equipo.
    </p>
  )
}
