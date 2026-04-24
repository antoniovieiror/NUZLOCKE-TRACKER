'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Vote } from '@/lib/types'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase: null, user: null, isAdmin: false, error: 'Not authenticated' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    user,
    isAdmin: profile?.role === 'admin',
    error: null,
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function castVote(matchId: string, vote: Vote) {
  const { supabase, user, error } = await getAuthContext()
  if (error || !supabase || !user) return { error: error ?? 'Not authenticated' }

  // Fetch match to determine which player we are
  const { data: match, error: fetchErr } = await supabase
    .from('matches')
    .select('id, league_id, player_a_id, player_b_id, status, vote_a, vote_b')
    .eq('id', matchId)
    .single()

  if (fetchErr || !match) return { error: 'Match not found' }
  if (match.status !== 'pending') return { error: 'This match is no longer open for voting' }

  const isPlayerA = match.player_a_id === user.id
  const isPlayerB = match.player_b_id === user.id
  if (!isPlayerA && !isPlayerB) return { error: 'You are not a participant in this match' }

  const updateCol = isPlayerA ? 'vote_a' : 'vote_b'
  const { error: updateErr } = await supabase
    .from('matches')
    .update({ [updateCol]: vote })
    .eq('id', matchId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath(`/match/${matchId}`)
  revalidatePath('/league')
  return { success: true }
}

export async function setReplayUrl(matchId: string, url: string) {
  const { supabase, user, error } = await getAuthContext()
  if (error || !supabase || !user) return { error: error ?? 'Not authenticated' }

  const { data: match, error: fetchErr } = await supabase
    .from('matches')
    .select('player_a_id, player_b_id')
    .eq('id', matchId)
    .single()

  if (fetchErr || !match) return { error: 'Match not found' }

  const isParticipant = match.player_a_id === user.id || match.player_b_id === user.id
  if (!isParticipant) return { error: 'Only participants can add a replay' }

  const trimmed = url.trim()
  const { error: updateErr } = await supabase
    .from('matches')
    .update({ replay_url: trimmed || null })
    .eq('id', matchId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath(`/match/${matchId}`)
  return { success: true }
}

export async function adminResolveMatch(matchId: string, winnerId: string) {
  const { supabase, isAdmin, error } = await getAuthContext()
  if (error || !supabase) return { error: error ?? 'Not authenticated' }
  if (!isAdmin) return { error: 'Admin only' }

  const { data: match, error: fetchErr } = await supabase
    .from('matches')
    .select('player_a_id, player_b_id, status')
    .eq('id', matchId)
    .single()

  if (fetchErr || !match) return { error: 'Match not found' }
  if (match.status === 'voided') return { error: 'Cannot resolve a voided match' }
  if (match.player_a_id !== winnerId && match.player_b_id !== winnerId)
    return { error: 'Winner must be a participant' }

  const { error: updateErr } = await supabase
    .from('matches')
    .update({
      status: 'admin_resolved',
      winner_id: winnerId,
    })
    .eq('id', matchId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath(`/match/${matchId}`)
  revalidatePath('/league')
  return { success: true }
}

export async function adminVoidMatch(matchId: string) {
  const { supabase, isAdmin, error } = await getAuthContext()
  if (error || !supabase) return { error: error ?? 'Not authenticated' }
  if (!isAdmin) return { error: 'Admin only' }

  const { error: updateErr } = await supabase
    .from('matches')
    .update({ status: 'voided', winner_id: null })
    .eq('id', matchId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath(`/match/${matchId}`)
  revalidatePath('/league')
  return { success: true }
}

// ─── Active duel overrides (admin only) ───────────────────────────────────────

export async function activateMatch(matchId: string) {
  const { supabase, isAdmin, error } = await getAuthContext()
  if (error || !supabase) return { error: error ?? 'Not authenticated' }
  if (!isAdmin) return { error: 'Admin only' }

  const { error: rpcErr } = await supabase.rpc('force_activate_match', {
    p_match_id: matchId,
  })
  if (rpcErr) return { error: rpcErr.message }

  revalidatePath(`/match/${matchId}`)
  revalidatePath('/league')
  return { success: true }
}

export async function rollActiveMatch(leagueId: string) {
  const { supabase, isAdmin, error } = await getAuthContext()
  if (error || !supabase) return { error: error ?? 'Not authenticated' }
  if (!isAdmin) return { error: 'Admin only' }

  const { error: rpcErr } = await supabase.rpc('pick_next_active_match', {
    p_league_id: leagueId,
  })
  if (rpcErr) return { error: rpcErr.message }

  revalidatePath('/league')
  revalidatePath('/admin')
  return { success: true }
}
