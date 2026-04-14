'use server'

/**
 * Global notification system.
 *
 * SQL (run once in Supabase SQL editor):
 *
 *   create table global_notifications (
 *     id uuid primary key default gen_random_uuid(),
 *     title text not null,
 *     subtitle text,
 *     body text not null,
 *     sent_by_id uuid not null references profiles(id) on delete cascade,
 *     sent_by_username text not null,
 *     created_at timestamptz not null default now()
 *   );
 *
 *   create table notification_reads (
 *     notification_id uuid not null references global_notifications(id) on delete cascade,
 *     user_id uuid not null references profiles(id) on delete cascade,
 *     read_at timestamptz not null default now(),
 *     primary key (notification_id, user_id)
 *   );
 *
 *   alter table global_notifications enable row level security;
 *   alter table notification_reads enable row level security;
 *
 *   -- Everyone can read notifications
 *   create policy "read notifications" on global_notifications for select using (true);
 *   -- Only admins can insert/delete
 *   create policy "admin insert notifications" on global_notifications for insert
 *     with check ((select role from profiles where id = auth.uid()) = 'admin');
 *   create policy "admin delete notifications" on global_notifications for delete
 *     using ((select role from profiles where id = auth.uid()) = 'admin');
 *
 *   -- Users manage their own reads
 *   create policy "read own reads" on notification_reads for select using (user_id = auth.uid());
 *   create policy "insert own reads" on notification_reads for insert with check (user_id = auth.uid());
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { GlobalNotification } from '@/lib/types'

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function assertAdmin(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; error: null; userId: string }
  | { supabase: null; error: string; userId?: never }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'No autenticado' }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'admin') return { supabase: null, error: 'No autorizado' }
  return { supabase, error: null, userId: user.id }
}

// ─── Admin: create notification ───────────────────────────────────────────────

export type CreateNotificationResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function createNotification(formData: FormData): Promise<CreateNotificationResult> {
  const { supabase, error: authError, userId } = await assertAdmin()
  if (authError || !supabase) return { success: false, error: authError ?? 'Error de auth' }

  const title = (formData.get('title') as string | null)?.trim()
  const subtitle = (formData.get('subtitle') as string | null)?.trim() || null
  const body = (formData.get('body') as string | null)?.trim()

  if (!title) return { success: false, error: 'El título es obligatorio.' }
  if (!body) return { success: false, error: 'El cuerpo es obligatorio.' }

  // Get sender's username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()

  const { data, error } = await supabase
    .from('global_notifications')
    .insert({ title, subtitle, body, sent_by_id: userId, sent_by_username: profile?.username ?? 'Admin' })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true, id: data.id }
}

// ─── Admin: delete notification ───────────────────────────────────────────────

export async function deleteNotification(id: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, error: authError } = await assertAdmin()
  if (authError || !supabase) return { success: false, error: authError ?? 'Error de auth' }

  const { error } = await supabase.from('global_notifications').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ─── User: get unread notifications ──────────────────────────────────────────

export async function getUnreadNotifications(): Promise<GlobalNotification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // All notifications not yet read by this user, oldest first
  const { data } = await supabase
    .from('global_notifications')
    .select(`
      id, title, subtitle, body, sent_by_id, sent_by_username, created_at,
      notification_reads!left(user_id)
    `)
    .order('created_at', { ascending: true })

  if (!data) return []

  return data
    .filter((n) => {
      const reads = n.notification_reads as { user_id: string }[] | null
      return !reads || !reads.some((r) => r.user_id === user.id)
    })
    .map(({ notification_reads: _r, ...n }) => n as GlobalNotification)
}

// ─── User: mark notification as read ─────────────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notification_reads')
    .upsert({ notification_id: notificationId, user_id: user.id })
    .select()
}

// ─── Admin: list all notifications ───────────────────────────────────────────

export async function listNotifications(): Promise<GlobalNotification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('global_notifications')
    .select('id, title, subtitle, body, sent_by_id, sent_by_username, created_at')
    .order('created_at', { ascending: false })

  return (data ?? []) as GlobalNotification[]
}
