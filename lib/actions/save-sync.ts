'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseRxdata, RxdataParseError } from '@/lib/rxdata-parser'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncResult =
  | { success: true; party: number; box1: number; dead: number }
  | { success: false; error: string }

// ─── Auth guard (reuse same pattern as profile.ts) ────────────────────────────

async function assertCanEdit(profileId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'No autenticado' as const }

  if (user.id === profileId) return { supabase, error: null }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'admin') return { supabase: null, error: 'No autorizado' as const }
  return { supabase, error: null }
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function syncSaveFile(profileId: string, formData: FormData): Promise<SyncResult> {
  const { supabase, error: authError } = await assertCanEdit(profileId)
  if (authError) return { success: false, error: authError }

  const file = formData.get('saveFile')
  if (!(file instanceof File)) return { success: false, error: 'No se recibió ningún archivo.' }

  // Basic validation
  if (!file.name.endsWith('.rxdata')) {
    return { success: false, error: 'El archivo debe tener extensión .rxdata' }
  }
  if (file.size > 4 * 1024 * 1024) {
    return { success: false, error: 'El archivo es demasiado grande (máximo 4 MB).' }
  }
  if (file.size === 0) {
    return { success: false, error: 'El archivo está vacío.' }
  }

  const buffer = await file.arrayBuffer()

  // ── Parse ────────────────────────────────────────────────────────────────────

  let parsed
  try {
    parsed = parseRxdata(buffer)
  } catch (err) {
    const message =
      err instanceof RxdataParseError
        ? err.message
        : 'Error desconocido al leer el archivo de guardado.'

    // Persist failure state so the widget can display it
    await supabase!
      .from('profiles')
      .update({
        save_sync_status: 'failed',
        save_parse_error: message,
        save_synced_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    revalidatePath(`/profile/${profileId}`)
    return { success: false, error: message }
  }

  // ── Resolve species IDs → PokéAPI slugs ─────────────────────────────────────
  // PokéAPI accepts numeric IDs (e.g. /pokemon/700 = sylveon).
  // We fetch the canonical name so the profile displays correctly.
  // Unknown IDs (fan-game custom Pokémon) fall back to the numeric string.

  async function resolveSpecies(id: string): Promise<string> {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, {
        next: { revalidate: 86400 }, // cache for 24 h — species names never change
      })
      if (!res.ok) return id
      const data = await res.json()
      return typeof data.name === 'string' ? data.name : id
    } catch {
      return id
    }
  }

  const [teamEntries, boxEntries, graveyardEntries] = await Promise.all([
    Promise.all(
      parsed.party.slice(0, 6).map(async (p) => ({
        species: await resolveSpecies(p.speciesId),
        nickname: p.nickname,
      }))
    ),
    Promise.all(
      parsed.box1.map(async (p) => ({
        species: await resolveSpecies(p.speciesId),
        nickname: p.nickname,
      }))
    ),
    Promise.all(
      parsed.graveyard.map(async (p) => ({
        species: await resolveSpecies(p.speciesId),
        nickname: p.nickname,
      }))
    ),
  ])

  // ── Persist ──────────────────────────────────────────────────────────────────

  const team = teamEntries
  const box = boxEntries
  const graveyard = graveyardEntries

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({
      team,
      box,
      graveyard,
      deaths: graveyard.length,
      save_sync_status: 'synced',
      save_parse_error: null,
      save_synced_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (dbError) {
    return { success: false, error: `Error al guardar: ${dbError.message}` }
  }

  revalidatePath(`/profile/${profileId}`)
  return { success: true, party: team.length, box1: boxEntries.length, dead: graveyard.length }
}
