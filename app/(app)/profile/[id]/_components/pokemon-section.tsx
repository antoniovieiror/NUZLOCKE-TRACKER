'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { Plus, X, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { updateTeam, updateBox } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ─── PokéAPI types & module-level cache ────────────────────────────────────────

interface PokeListItem {
  name: string
  url: string
}

// Fetched once per browser session, shared across all instances of this component
let cachedPokemonList: PokeListItem[] | null = null
let listFetchPromise: Promise<PokeListItem[]> | null = null

async function getPokemonList(): Promise<PokeListItem[]> {
  if (cachedPokemonList) return cachedPokemonList
  if (listFetchPromise) return listFetchPromise

  listFetchPromise = fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
    .then((r) => r.json())
    .then((data) => {
      cachedPokemonList = data.results as PokeListItem[]
      return cachedPokemonList
    })

  return listFetchPromise
}

// ─── Individual Pokémon card ───────────────────────────────────────────────────

interface PokemonCardProps {
  name: string
  editMode: boolean
  onRemove: () => void
}

function PokemonCard({ name, editMode, onRemove }: PokemonCardProps) {
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled)
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ??
              null
          )
      })
      .catch(() => {/* silently ignore bad names */})
    return () => { cancelled = true }
  }, [name])

  return (
    <div className="relative group flex flex-col items-center gap-1">
      {/* Sprite */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        {sprite ? (
          <img
            src={sprite}
            alt={name}
            width={80}
            height={80}
            className="object-contain w-full h-full drop-shadow-sm"
          />
        ) : (
          <Skeleton className="w-full h-full rounded-lg" />
        )}

        {/* Remove button — visible in edit mode */}
        {editMode && (
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
            aria-label={`Remove ${name}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Name */}
      <span className="text-[11px] text-muted-foreground capitalize text-center leading-tight max-w-[80px] truncate">
        {name.replace(/-/g, ' ')}
      </span>
    </div>
  )
}

// ─── Empty slot ────────────────────────────────────────────────────────────────

function EmptySlot() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-muted-foreground/40 text-2xl select-none">?</span>
      </div>
      <span className="text-[11px] text-muted-foreground/40">—</span>
    </div>
  )
}

// ─── Autocomplete search ───────────────────────────────────────────────────────

interface PokemonSearchProps {
  onAdd: (name: string) => void
  disabled?: boolean
  disabledReason?: string
}

function PokemonSearch({ onAdd, disabled, disabledReason }: PokemonSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [listReady, setListReady] = useState(!!cachedPokemonList)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load full Pokémon list as soon as search becomes relevant
  useEffect(() => {
    if (cachedPokemonList) { setListReady(true); return }
    setLoading(true)
    getPokemonList().then(() => { setListReady(true); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!listReady || query.length < 2) {
      setSuggestions([])
      return
    }
    const q = query.toLowerCase()
    setSuggestions(
      (cachedPokemonList ?? [])
        .filter((p) => p.name.startsWith(q))
        .slice(0, 8)
        .map((p) => p.name)
    )
  }, [query, listReady])

  function select(name: string) {
    onAdd(name)
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative mt-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            disabled
              ? disabledReason ?? 'Disabled'
              : listReady
              ? 'Search Pokémon…'
              : 'Loading Pokédex…'
          }
          disabled={disabled || !listReady}
          className="pl-8 text-sm"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-popover border rounded-lg shadow-md overflow-hidden">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                className="w-full text-left px-3 py-1.5 text-sm capitalize hover:bg-accent transition-colors"
                onMouseDown={(e) => { e.preventDefault(); select(name) }}
              >
                {name.replace(/-/g, ' ')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Pokemon grid section ──────────────────────────────────────────────────────

interface PokemonGridProps {
  title: string
  pokemon: string[]
  editMode: boolean
  onRemove: (index: number) => void
  onAdd: (name: string) => void
  slots?: number          // fixed slots (team = 6); undefined = flexible (box)
  addDisabled?: boolean
  addDisabledReason?: string
  emptyMessage?: string
}

function PokemonGrid({
  title,
  pokemon,
  editMode,
  onRemove,
  onAdd,
  slots,
  addDisabled,
  addDisabledReason,
  emptyMessage = 'Nothing here yet.',
}: PokemonGridProps) {
  // For team: always render `slots` cells (filled or empty)
  const cells = slots
    ? Array.from({ length: slots }, (_, i) => pokemon[i] ?? null)
    : pokemon

  return (
    <div>
      {cells.length === 0 && !slots ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyMessage}</p>
      ) : (
        <div
          className={cn(
            'grid gap-3',
            slots === 6
              ? 'grid-cols-3 sm:grid-cols-6'   // team: 3 cols on mobile, 6 on sm+
              : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'  // box: denser grid
          )}
        >
          {cells.map((name, i) =>
            name ? (
              <PokemonCard
                key={`${name}-${i}`}
                name={name}
                editMode={editMode}
                onRemove={() => onRemove(i)}
              />
            ) : slots ? (
              <EmptySlot key={`empty-${i}`} />
            ) : null
          )}
        </div>
      )}

      {editMode && (
        <PokemonSearch
          onAdd={onAdd}
          disabled={addDisabled}
          disabledReason={addDisabledReason}
        />
      )}
    </div>
  )
}

// ─── Main exported component ───────────────────────────────────────────────────

interface PokemonSectionProps {
  profileId: string
  initialTeam: string[]
  initialBox: string[]
  canEdit: boolean
}

export function PokemonSection({
  profileId,
  initialTeam,
  initialBox,
  canEdit,
}: PokemonSectionProps) {
  const [team, setTeam] = useState<string[]>(initialTeam)
  const [box, setBox] = useState<string[]>(initialBox)
  const [teamEditMode, setTeamEditMode] = useState(false)
  const [boxEditMode, setBoxEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Team handlers ──

  function addToTeam(name: string) {
    if (team.length >= 6) return
    if (team.includes(name)) { toast.warning(`${name} is already in your team`); return }
    const next = [...team, name]
    setTeam(next)
    startTransition(async () => {
      const result = await updateTeam(profileId, next)
      if (result.error) {
        toast.error('Failed to update team', { description: String(result.error) })
        setTeam(team) // revert
      }
    })
  }

  function removeFromTeam(index: number) {
    const next = team.filter((_, i) => i !== index)
    setTeam(next)
    startTransition(async () => {
      const result = await updateTeam(profileId, next)
      if (result.error) {
        toast.error('Failed to update team', { description: String(result.error) })
        setTeam(team) // revert
      }
    })
  }

  // ── Box handlers ──

  function addToBox(name: string) {
    if (box.includes(name)) { toast.warning(`${name} is already in your box`); return }
    const next = [...box, name]
    setBox(next)
    startTransition(async () => {
      const result = await updateBox(profileId, next)
      if (result.error) {
        toast.error('Failed to update box', { description: String(result.error) })
        setBox(box) // revert
      }
    })
  }

  function removeFromBox(index: number) {
    const next = box.filter((_, i) => i !== index)
    setBox(next)
    startTransition(async () => {
      const result = await updateBox(profileId, next)
      if (result.error) {
        toast.error('Failed to update box', { description: String(result.error) })
        setBox(box) // revert
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* ── Team ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Active Team</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {team.length}/6 Pokémon
            </p>
          </div>
          {canEdit && (
            <Button
              variant={teamEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTeamEditMode((v) => !v)}
              disabled={isPending}
              className="gap-1.5 shrink-0"
            >
              {teamEditMode ? (
                'Done'
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Edit
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <PokemonGrid
            title="team"
            pokemon={team}
            editMode={teamEditMode}
            onRemove={removeFromTeam}
            onAdd={addToTeam}
            slots={6}
            addDisabled={team.length >= 6}
            addDisabledReason="Team is full (6/6)"
          />
        </CardContent>
      </Card>

      {/* ── Box ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">PC Box</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {box.length} Pokémon stored
            </p>
          </div>
          {canEdit && (
            <Button
              variant={boxEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBoxEditMode((v) => !v)}
              disabled={isPending}
              className="gap-1.5 shrink-0"
            >
              {boxEditMode ? (
                'Done'
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Edit
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <PokemonGrid
            title="box"
            pokemon={box}
            editMode={boxEditMode}
            onRemove={removeFromBox}
            onAdd={addToBox}
            emptyMessage="Box is empty. Add Pokémon that are part of your run but not on your active team."
          />
        </CardContent>
      </Card>
    </div>
  )
}
