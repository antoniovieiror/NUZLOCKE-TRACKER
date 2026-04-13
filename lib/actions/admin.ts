'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserStatus } from '@/lib/types'

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'Not authenticated' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { supabase: null, error: 'Admin only' as const }
  return { supabase, error: null }
}

// ─── User management ──────────────────────────────────────────────────────────

export async function createPlayer(data: {
  username: string
  email: string
  password: string
}) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username.trim() },
    })
    if (error) return { error: error.message }
  } catch (e) {
    return { error: String(e) }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function toggleUserStatus(profileId: string, newStatus: UserStatus) {
  const { supabase, error: authError } = await assertAdmin()
  if (authError || !supabase) return { error: authError ?? 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', profileId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function setUserPassword(userId: string, newPassword: string) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })
    if (error) return { error: error.message }
  } catch (e) {
    return { error: String(e) }
  }

  return { success: true }
}

export async function deletePlayer(userId: string) {
  const { supabase, error: authError } = await assertAdmin()
  if (authError || !supabase) return { error: authError ?? 'Not authenticated' }

  // Prevent self-deletion
  const { data: { user: me } } = await supabase.auth.getUser()
  if (me?.id === userId) return { error: 'No puedes eliminarte a ti mismo' }

  // Prevent deleting another admin
  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (target?.role === 'admin') return { error: 'No se puede eliminar una cuenta de admin' }

  try {
    const adminClient = createAdminClient()
    // Deleting from auth.users cascades to profiles via FK
    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return { error: error.message }
  } catch (e) {
    return { error: String(e) }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

// ─── League management ────────────────────────────────────────────────────────

export async function createLeague(title: string) {
  const { supabase, error: authError } = await assertAdmin()
  if (authError || !supabase) return { error: authError ?? 'Not authenticated' }

  // Only active players participate
  const { data: players, error: playersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('status', 'active')

  if (playersError) return { error: playersError.message }
  if (!players || players.length < 2)
    return { error: `Need at least 2 active players (found ${players?.length ?? 0})` }

  // Create league record
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({ title: title.trim(), status: 'active' })
    .select()
    .single()

  if (leagueError || !league) {
    // Unique partial index violation = another league is already active
    if (leagueError?.code === '23505')
      return { error: 'A league is already active. Close it first.' }
    return { error: leagueError?.message ?? 'Failed to create league' }
  }

  // Generate round-robin fixture (every pair plays once)
  const ids = players.map((p) => p.id)
  const matches: {
    league_id: string
    player_a_id: string
    player_b_id: string
    status: string
  }[] = []

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      matches.push({
        league_id: league.id,
        player_a_id: ids[i],
        player_b_id: ids[j],
        status: 'pending',
      })
    }
  }

  const { error: matchesError } = await supabase.from('matches').insert(matches)

  if (matchesError) {
    // Best-effort rollback
    await supabase.from('leagues').delete().eq('id', league.id)
    return { error: matchesError.message }
  }

  revalidatePath('/league')
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, matchCount: matches.length }
}

export async function closeLeague(leagueId: string) {
  const { supabase, error: authError } = await assertAdmin()
  if (authError || !supabase) return { error: authError ?? 'Not authenticated' }

  const { error } = await supabase
    .from('leagues')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', leagueId)

  if (error) return { error: error.message }

  revalidatePath('/league')
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}
