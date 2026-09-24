import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only admin client using the service role key. This bypasses Row
 * Level Security and the GoTrue email pipeline, so it must NEVER be imported
 * from client components. Used to create pre-confirmed users at sign-up so
 * registration doesn't depend on the (rate-limited) dev email provider.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
