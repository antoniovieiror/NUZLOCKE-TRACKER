-- ═══════════════════════════════════════════════════════════════════════════
--  Active Duel + Team Snapshots
--  Adds per-match team/MVP snapshots captured when a match becomes active,
--  and a DB-level invariant that leagues.active_match_id always points to a
--  live pending match (or null when no pending matches remain).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Schema additions ───────────────────────────────────────────────────────
alter table matches
  add column if not exists team_a_snapshot jsonb,
  add column if not exists team_b_snapshot jsonb,
  add column if not exists mvp_a_snapshot  text,
  add column if not exists mvp_b_snapshot  text,
  add column if not exists activated_at    timestamptz;

alter table leagues
  add column if not exists active_match_id uuid references matches(id) on delete set null;

-- 2. Helper — pick + snapshot next random pending match in a league ────────
create or replace function pick_next_active_match(p_league_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_id      uuid;
  v_player_a_id  uuid;
  v_player_b_id  uuid;
  v_team_a       jsonb;
  v_team_b       jsonb;
  v_mvp_a        text;
  v_mvp_b        text;
begin
  select id, player_a_id, player_b_id
    into v_next_id, v_player_a_id, v_player_b_id
  from matches
  where league_id = p_league_id
    and status    = 'pending'
    and activated_at is null
  order by random()
  limit 1;

  if v_next_id is null then
    update leagues set active_match_id = null where id = p_league_id;
    return null;
  end if;

  select team, mvp into v_team_a, v_mvp_a from profiles where id = v_player_a_id;
  select team, mvp into v_team_b, v_mvp_b from profiles where id = v_player_b_id;

  update matches
    set team_a_snapshot = v_team_a,
        team_b_snapshot = v_team_b,
        mvp_a_snapshot  = v_mvp_a,
        mvp_b_snapshot  = v_mvp_b,
        activated_at    = now()
    where id = v_next_id;

  update leagues set active_match_id = v_next_id where id = p_league_id;
  return v_next_id;
end;
$$;

-- 3. Helper — force-activate a specific pending match (admin override) ─────
create or replace function force_activate_match(p_match_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id   uuid;
  v_status      text;
  v_player_a_id uuid;
  v_player_b_id uuid;
  v_team_a      jsonb;
  v_team_b      jsonb;
  v_mvp_a       text;
  v_mvp_b       text;
begin
  select league_id, status, player_a_id, player_b_id
    into v_league_id, v_status, v_player_a_id, v_player_b_id
  from matches where id = p_match_id;

  if v_league_id is null then
    raise exception 'Match % not found', p_match_id;
  end if;
  if v_status <> 'pending' then
    raise exception 'Match % is not pending (status=%)', p_match_id, v_status;
  end if;

  -- Snapshot only if the match has not been snapshotted before. This
  -- preserves the "team as of activation time" invariant on re-activation.
  select team, mvp into v_team_a, v_mvp_a from profiles where id = v_player_a_id;
  select team, mvp into v_team_b, v_mvp_b from profiles where id = v_player_b_id;

  update matches
    set team_a_snapshot = coalesce(team_a_snapshot, v_team_a),
        team_b_snapshot = coalesce(team_b_snapshot, v_team_b),
        mvp_a_snapshot  = coalesce(mvp_a_snapshot,  v_mvp_a),
        mvp_b_snapshot  = coalesce(mvp_b_snapshot,  v_mvp_b),
        activated_at    = coalesce(activated_at, now())
    where id = p_match_id;

  update leagues set active_match_id = p_match_id where id = v_league_id;
  return p_match_id;
end;
$$;

-- 4. Trigger — advance when current active is terminal, or league has none ─
create or replace function auto_advance_active_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id       uuid := coalesce(new.league_id, old.league_id);
  v_current_active  uuid;
  v_current_status  text;
begin
  select active_match_id into v_current_active from leagues where id = v_league_id;

  if v_current_active is null then
    perform pick_next_active_match(v_league_id);
    return new;
  end if;

  select status into v_current_status from matches where id = v_current_active;
  if v_current_status in ('validated', 'admin_resolved', 'voided') then
    perform pick_next_active_match(v_league_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_advance_active_match on matches;
create trigger trg_auto_advance_active_match
  after insert or update of status on matches
  for each row execute function auto_advance_active_match();

-- 5. Backfill — pick an initial active match for any active league that
--    currently has none (so existing leagues get a Duelo Activo right away)
do $$
declare
  l record;
begin
  for l in
    select id from leagues where status = 'active' and active_match_id is null
  loop
    perform pick_next_active_match(l.id);
  end loop;
end $$;
