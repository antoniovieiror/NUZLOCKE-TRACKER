'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Trash2, Search, X, Loader2, Pencil, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

import { updateTeam, updateMvp } from '@/lib/actions/profile'
import type { PokemonEntry } from '@/lib/types'

// ─── PokéAPI cache ─────────────────────────────────────────────────

interface PokeListItem { name: string; url: string }
let cachedPokemonList: PokeListItem[] | null = null
let listFetchPromise: Promise<PokeListItem[]> | null = null

async function getPokemonList(): Promise<PokeListItem[]> {
  if (cachedPokemonList) return cachedPokemonList
  if (listFetchPromise) return listFetchPromise
  listFetchPromise = fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
    .then((r) => r.json())
    .then((data) => { cachedPokemonList = data.results; return cachedPokemonList! })
  return listFetchPromise
}

function useSprite(species: string | null | undefined) {
  const [sprite, setSprite] = useState<string | null>(null)
  useEffect(() => {
    if (!species) { setSprite(null); return }
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${species}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSprite(
            data.sprites?.other?.['official-artwork']?.front_default ??
              data.sprites?.front_default ?? null
          )
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [species])
  return sprite
}

// ─── Tooltip ──────────────────────────────────────────────────────

interface TooltipData {
  x: number
  y: number
  title: string
  sub: string
}

// ─── Team slot on hex ─────────────────────────────────────────────

function TeamSlot({
  entry,
  index,
  canEdit,
  isActive,
  isMvp,
  onClick,
  onTip,
}: {
  entry: PokemonEntry | null
  index: number
  canEdit: boolean
  isActive: boolean
  isMvp: boolean
  onClick: () => void
  onTip: (d: TooltipData | null) => void
}) {
  const sprite = useSprite(entry?.species)
  const label = entry ? (entry.nickname || entry.species.replace(/-/g, ' ')) : ''
  const speciesName = entry?.species.replace(/-/g, ' ') ?? ''

  const cls = [
    'tc-team-slot',
    `s${index}`,
    canEdit && 'editable',
    isActive && 'active',
    !entry && 'empty',
    isMvp && 'mvp',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cls}
      onClick={canEdit ? onClick : undefined}
      onMouseEnter={entry ? (e) => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName }) : undefined}
      onMouseMove={entry ? (e) => onTip({ x: e.clientX, y: e.clientY, title: label, sub: speciesName }) : undefined}
      onMouseLeave={() => onTip(null)}
    >
      {entry && sprite && <img src={sprite} alt={entry.species} loading="lazy" />}
      {!entry && canEdit && <Plus className="tc-slot-plus" size={20} strokeWidth={2.4} />}
      {!entry && !canEdit && <span style={{ color: '#5d647a', fontSize: 24, fontWeight: 700 }}>?</span>}

      {entry && <div className="slot-label">{label.toUpperCase()}</div>}

      {isMvp && (
        <div className="tc-slot-crown" aria-label="MVP">
          <Crown size={12} strokeWidth={2.6} />
        </div>
      )}

      {canEdit && entry && (
        <div className="tc-slot-edit-hint">
          <Pencil size={11} strokeWidth={2.6} />
        </div>
      )}
    </div>
  )
}

// ─── Inline editor ────────────────────────────────────────────────

function SlotEditor({
  slotIndex,
  entry,
  mvp,
  team,
  isPending,
  onReplace,
  onDelete,
  onToggleMvp,
  onNicknameChange,
  onClose,
}: {
  slotIndex: number
  entry: PokemonEntry | null
  mvp: string | null
  team: PokemonEntry[]
  isPending: boolean
  onReplace: (name: string) => void
  onDelete: () => void
  onToggleMvp: () => void
  onNicknameChange: (nickname: string) => void
  onClose: () => void
}) {
  const sprite = useSprite(entry?.species)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [listReady, setListReady] = useState(!!cachedPokemonList)

  const [nickEditing, setNickEditing] = useState(false)
  const [nickValue, setNickValue] = useState(entry?.nickname ?? '')
  const nickInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cachedPokemonList) { setListReady(true); return }
    getPokemonList().then(() => setListReady(true))
  }, [])

  useEffect(() => {
    setQuery('')
    setSuggestions([])
    setNickEditing(false)
    setNickValue(entry?.nickname ?? '')
  }, [slotIndex, entry?.species, entry?.nickname])

  useEffect(() => {
    if (!listReady || query.length < 2) { setSuggestions([]); return }
    const q = query.toLowerCase()
    const taken = new Set(team.map((e) => e.species))
    setSuggestions(
      (cachedPokemonList ?? [])
        .filter((p) => p.name.startsWith(q) && !taken.has(p.name))
        .slice(0, 6)
        .map((p) => p.name)
    )
  }, [query, listReady, team])

  function selectReplacement(name: string) {
    onReplace(name)
    setQuery('')
    setSuggestions([])
  }

  function saveNickname() {
    onNicknameChange(nickValue.trim())
    setNickEditing(false)
  }

  const isMvp = !!entry && entry.species === mvp
  const displayName = entry
    ? (entry.nickname || entry.species.replace(/-/g, ' '))
    : 'Slot vacío'
  const speciesName = entry?.species.replace(/-/g, ' ') ?? ''

  return (
    <div className="tc-slot-editor" key={slotIndex}>
      <div className="tc-slot-editor-head">
        <span className="tc-slot-editor-tag">
          <span className="dot" />
          Editando · Slot {String(slotIndex + 1).padStart(2, '0')}
        </span>
        <button className="tc-slot-editor-close" onClick={onClose} aria-label="Cerrar editor">
          <X size={14} strokeWidth={2.6} />
        </button>
      </div>

      <div className="tc-slot-editor-body">
        <div className={`tc-slot-editor-preview ${isMvp ? 'mvp' : ''} ${entry ? '' : 'empty'}`}>
          {entry && sprite ? (
            <img src={sprite} alt={entry.species} />
          ) : (
            <Plus size={40} strokeWidth={2.2} className="tc-editor-plus" />
          )}
          {isMvp && (
            <span className="tc-slot-editor-crown">
              <Crown size={14} strokeWidth={2.6} />
            </span>
          )}
        </div>

        <div className="tc-slot-editor-info">
          {entry && !nickEditing && (
            <button
              className="tc-slot-editor-name"
              onClick={() => {
                setNickValue(entry.nickname ?? '')
                setNickEditing(true)
                setTimeout(() => nickInputRef.current?.focus(), 0)
              }}
              title="Editar apodo"
            >
              {displayName}
              <Pencil size={11} strokeWidth={2.5} />
            </button>
          )}
          {entry && nickEditing && (
            <div className="tc-slot-editor-nick">
              <input
                ref={nickInputRef}
                value={nickValue}
                onChange={(e) => setNickValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNickname()
                  if (e.key === 'Escape') { setNickValue(entry.nickname ?? ''); setNickEditing(false) }
                }}
                onBlur={saveNickname}
                placeholder="Apodo"
                maxLength={16}
              />
              <button onMouseDown={(e) => { e.preventDefault(); saveNickname() }} aria-label="Guardar">
                <Check size={14} strokeWidth={2.6} />
              </button>
            </div>
          )}
          {!entry && <div className="tc-slot-editor-name empty">{displayName}</div>}
          {entry && <div className="tc-slot-editor-species">{speciesName}</div>}

          {entry && (
            <div className="tc-slot-editor-actions">
              <button
                type="button"
                className={`tc-slot-editor-btn mvp ${isMvp ? 'active' : ''}`}
                onClick={onToggleMvp}
                disabled={isPending}
              >
                <Crown size={13} strokeWidth={2.6} />
                {isMvp ? 'MVP activo' : 'Marcar MVP'}
              </button>
              <button
                type="button"
                className="tc-slot-editor-btn danger"
                onClick={onDelete}
                disabled={isPending}
              >
                <Trash2 size={13} strokeWidth={2.6} />
                Quitar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tc-slot-editor-search">
        <Search size={13} className="tc-slot-editor-search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            !listReady
              ? 'Cargando Pokédex…'
              : entry
              ? 'Reemplazar con otro Pokémon…'
              : 'Añadir Pokémon al equipo…'
          }
          disabled={!listReady || isPending}
          autoComplete="off"
        />
        {(!listReady || isPending) && (
          <Loader2 size={13} className="tc-slot-editor-loader" />
        )}
        {suggestions.length > 0 && (
          <ul className="tc-slot-editor-suggestions">
            {suggestions.map((name) => (
              <li key={name}>
                <button onMouseDown={(e) => { e.preventDefault(); selectReplacement(name) }}>
                  {name.replace(/-/g, ' ')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────

export function TeamHex({
  profileId,
  initialTeam,
  initialMvp,
  canEdit,
}: {
  profileId: string
  initialTeam: PokemonEntry[]
  initialMvp: string | null
  canEdit: boolean
}) {
  const router = useRouter()
  const [team, setTeam] = useState<PokemonEntry[]>(initialTeam)
  const [mvp, setMvp] = useState<string | null>(initialMvp)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  useEffect(() => { setTeam(initialTeam) }, [initialTeam])
  useEffect(() => { setMvp(initialMvp) }, [initialMvp])

  const slots = Array.from({ length: 6 }, (_, i) => team[i] ?? null)
  const activeEntry = activeSlot !== null ? slots[activeSlot] : null

  function saveTeam(next: PokemonEntry[], clearMvpSpecies?: string) {
    const prevTeam = team
    const prevMvp = mvp
    const shouldClear = !!clearMvpSpecies && mvp === clearMvpSpecies

    setTeam(next)
    if (shouldClear) setMvp(null)

    startTransition(async () => {
      const res = await updateTeam(profileId, next)
      if (res.error) {
        toast.error('Error al actualizar el equipo', { description: String(res.error) })
        setTeam(prevTeam)
        if (shouldClear) setMvp(prevMvp)
        return
      }
      if (shouldClear) await updateMvp(profileId, null)
      router.refresh()
    })
  }

  function toggleSlot(index: number) {
    if (!canEdit) return
    const entry = team[index]
    if (!entry && index > team.length) return // only allow editing the next empty slot
    setActiveSlot((prev) => (prev === index ? null : index))
  }

  function replaceSlot(index: number, species: string) {
    if (team.some((e, i) => e.species === species && i !== index)) {
      toast.warning(`${species} ya está en tu equipo`)
      return
    }
    const existing = team[index]
    if (existing) {
      saveTeam(team.map((e, i) => (i === index ? { species, nickname: '' } : e)), existing.species)
    } else {
      if (team.length >= 6) return
      saveTeam([...team, { species, nickname: '' }])
      setActiveSlot(team.length)
    }
  }

  function deleteSlot(index: number) {
    const removed = team[index]
    if (!removed) return
    saveTeam(team.filter((_, i) => i !== index), removed.species)
    setActiveSlot(null)
  }

  function toggleMvp(species: string) {
    const next = mvp === species ? null : species
    const prev = mvp
    setMvp(next)
    startTransition(async () => {
      const res = await updateMvp(profileId, next)
      if (res.error) {
        toast.error('Error al actualizar el MVP', { description: String(res.error) })
        setMvp(prev)
        return
      }
      router.refresh()
    })
  }

  function updateNickname(index: number, nickname: string) {
    const current = team[index]
    if (!current) return
    if ((current.nickname ?? '') === nickname) return
    saveTeam(team.map((e, i) => (i === index ? { ...e, nickname } : e)))
  }

  return (
    <div className="tc-panel tc-fade-in-up">
      <span className="tc-mini-rivet tl" /><span className="tc-mini-rivet tr" />
      <span className="tc-mini-rivet bl" /><span className="tc-mini-rivet br" />
      <div className="tc-panel-header">
        <h2>Team Hub</h2>
      </div>
      <div className="tc-panel-inner">
        <div className={`tc-team-hex ${canEdit ? 'editable' : ''}`}>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
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
          {slots.map((entry, i) => {
            const isDisabledEmpty = canEdit && !entry && i > team.length
            return (
              <TeamSlot
                key={`slot-${i}-${entry?.species ?? 'empty'}`}
                entry={entry}
                index={i}
                canEdit={canEdit && !isDisabledEmpty}
                isActive={activeSlot === i}
                isMvp={!!entry && entry.species === mvp}
                onClick={() => toggleSlot(i)}
                onTip={setTooltip}
              />
            )
          })}
        </div>

        {canEdit && activeSlot !== null ? (
          <SlotEditor
            slotIndex={activeSlot}
            entry={activeEntry}
            mvp={mvp}
            team={team}
            isPending={isPending}
            onReplace={(name) => replaceSlot(activeSlot, name)}
            onDelete={() => deleteSlot(activeSlot)}
            onToggleMvp={() => activeEntry && toggleMvp(activeEntry.species)}
            onNicknameChange={(nick) => updateNickname(activeSlot, nick)}
            onClose={() => setActiveSlot(null)}
          />
        ) : (
          <div className="tc-team-footer">
            <span className="tc-team-count">{team.length}/6 Pokémon</span>
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
