import { createClient } from '@supabase/supabase-js'

/**
 * Admin client — uses the service role key to bypass RLS.
 * Only import this in Server Actions / server-only code.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Add it to .env.local (Supabase → Settings → API → service_role).'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
