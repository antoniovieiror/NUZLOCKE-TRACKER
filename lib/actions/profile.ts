'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Auth guard helper ─────────────────────────────────────────────────────────

async function assertCanEdit(profileId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'Not authenticated' as const }

  if (user.id === profileId) return { supabase, error: null }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'admin') return { supabase: null, error: 'Unauthorized' as const }
  return { supabase, error: null }
}

// ─── Actions ───────────────────────────────────────────────────────────────────

export async function updateNuzlockeState(
  profileId: string,
  data: { badges: number; deaths: number; wipes: number; mvp: string; notes: string }
) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({
      badges: Math.max(0, Math.floor(data.badges)),
      deaths: Math.max(0, Math.floor(data.deaths)),
      wipes: Math.max(0, Math.floor(data.wipes)),
      mvp: data.mvp.trim() || null,
      notes: data.notes.trim() || null,
    })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}

export async function updateTeam(profileId: string, team: string[]) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const cleaned = team.map((n) => n.toLowerCase().trim()).filter(Boolean)
  if (cleaned.length > 6) return { error: 'Team cannot exceed 6 Pokémon' }

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ team: cleaned })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}

export async function updateBox(profileId: string, box: string[]) {
  const { supabase, error } = await assertCanEdit(profileId)
  if (error) return { error }

  const cleaned = box.map((n) => n.toLowerCase().trim()).filter(Boolean)

  const { error: dbError } = await supabase!
    .from('profiles')
    .update({ box: cleaned })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath(`/profile/${profileId}`)
  return { success: true }
}
