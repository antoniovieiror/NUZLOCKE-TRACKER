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
        if (!cancelled) {
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ??
              null,
          )
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [species])

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="relative aspect-square w-full">
        <div className="absolute inset-0 z-[1]">
          <div className="absolute left-[19%] right-[19%] top-[5%] bottom-[49%] flex items-end justify-center">
            {loading ? (
              <Skeleton className="h-16 w-16 rounded-lg" />
            ) : sprite ? (
              <img
                src={sprite}
                alt={species}
                className="h-full max-h-full w-full object-contain"
                style={{
                  filter:
                    'drop-shadow(0 0 18px rgba(0,200,232,0.55)) drop-shadow(0 4px 10px rgba(0,0,0,0.68))',
                }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-cyan-400/8 text-2xl text-white/25">
                ?
              </div>
            )}
          </div>

          <div className="absolute bottom-[5%] left-[7%] right-[7%] text-center">
            {nickname && (
              <p className="font-heading text-[20px] font-bold leading-none text-cyan-100 drop-shadow-[0_0_10px_rgba(0,200,232,0.3)]">
                {nickname}
              </p>
            )}
            <p className="mt-1 font-heading text-[14px] capitalize leading-none text-cyan-200/70">
              {species.replace(/-/g, ' ')}
            </p>
            <div className="mt-2 inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
              MVP
            </div>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ASSETS/podium.png"
          alt=""
          aria-hidden
          className="absolute inset-0 z-10 h-full w-full object-fill pointer-events-none"
        />
      </div>
    </div>
  )
}

export function MvpEmpty() {
  return (
    <p className="text-sm italic text-white/38">
      Sin definir — selecciona un MVP desde el equipo.
    </p>
  )
}