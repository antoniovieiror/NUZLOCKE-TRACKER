export type Role = 'admin' | 'player'
export type UserStatus = 'active' | 'inactive'
export type LeagueStatus = 'active' | 'closed'
export type MatchStatus = 'pending' | 'validated' | 'disputed' | 'voided' | 'admin_resolved'
export type Vote = 'win_a' | 'win_b'
export type SaveSyncStatus = 'synced' | 'failed' | 'never'

export interface PokemonEntry {
  species: string   // lowercase PokéAPI name, e.g. "charizard"
  nickname: string  // player-set nickname, e.g. "Blaze"
}

export interface Profile {
  id: string
  username: string
  role: Role
  status: UserStatus
  badges: number
  deaths: number
  wipes: number
  team: PokemonEntry[]
  box: PokemonEntry[]
  mvp: string | null
  notes: string | null
  avatar_url: string | null
  save_synced_at: string | null
  save_sync_status: SaveSyncStatus
  save_parse_error: string | null
  created_at: string
  updated_at: string
}

export interface League {
  id: string
  title: string
  status: LeagueStatus
  created_at: string
  closed_at: string | null
}

export interface Match {
  id: string
  league_id: string
  player_a_id: string
  player_b_id: string
  vote_a: Vote | null
  vote_b: Vote | null
  status: MatchStatus
  winner_id: string | null
  replay_url: string | null
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  id: string
  username: string
  avatar_url: string | null
  status: UserStatus
  total_points: number
  total_wins: number
  total_losses: number
  winrate: number
}

export interface GlobalNotification {
  id: string
  title: string
  subtitle: string | null
  body: string
  sent_by_id: string
  sent_by_username: string
  created_at: string
}

// Match with joined profile data (for display)
export interface MatchWithProfiles extends Match {
  player_a: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  player_b: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  winner: Pick<Profile, 'id' | 'username'> | null
}
