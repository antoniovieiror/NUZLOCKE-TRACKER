'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PokemonEntry } from '@/lib/types'

// ─── Auth guard helper ─────────────────────────────────────────────────────────

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

// ─── Nuzlocke state ────────────────────────────────────────────────────────────

export async function updateNuzlockeState(
  profileId: string,
  data: { badges: number; wipes: number; notes: string }
) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({
      badges: Math.max(0, Math.floor(data.badges)),
      wipes: Math.max(0, Math.floor(data.wipes)),
      notes: data.notes.trim() || null,
    })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}

// ─── Team ──────────────────────────────────────────────────────────────────────

export async function updateTeam(profileId: string, team: PokemonEntry[]) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const cleaned = team
    .map((e) => ({
      species: e.species.toLowerCase().trim(),
      nickname: e.nickname.trim(),
    }))
    .filter((e) => e.species)

  if (cleaned.length > 6) return { error: 'El equipo no puede superar 6 Pokémon' }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ team: cleaned })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}

// ─── Box ───────────────────────────────────────────────────────────────────────

export async function updateBox(profileId: string, box: PokemonEntry[]) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const cleaned = box
    .map((e) => ({
      species: e.species.toLowerCase().trim(),
      nickname: e.nickname.trim(),
    }))
    .filter((e) => e.species)

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ box: cleaned })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}

// ─── MVP ──────────────────────────────────────────────────────────────────────

export async function updateMvp(profileId: string, species: string | null) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ mvp: species })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}

// ─── Avatar URL (updated after client-side Storage upload) ────────────────────

export async function updateAvatar(profileId: string, avatarUrl: string) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  // Revalidate profile page + the layout (navbar avatar)
  revalidatePath(`/profile/${profileId}`)
  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── Username ─────────────────────────────────────────────────────────────────

export async function updateUsername(profileId: string, username: string) {
  const trimmed = username.trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 30) {
    return { error: 'El nombre debe tener entre 2 y 30 caracteres' }
  }
  // Only letters, numbers, underscores and spaces
  if (!/^[\w\s]+$/.test(trimmed)) {
    return { error: 'Solo se permiten letras, números, guiones bajos y espacios' }
  }

  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  // Uniqueness check
  const { data: existing } = await supabase!
    .from('profiles')
    .select('id')
    .eq('username', trimmed)
    .neq('id', profileId)
    .maybeSingle()

  if (existing) return { error: 'Ese nombre ya está en uso' }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ username: trimmed })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  revalidatePath('/', 'layout') // refresh navbar username
  return { success: true }
}
