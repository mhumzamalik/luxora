/**
 * Server-only Supabase admin client.
 *
 * Uses the SERVICE_ROLE key which bypasses all Row-Level Security policies.
 * This is intentional for trusted server-side operations (e.g. payment-proof uploads).
 *
 * ⚠️  NEVER import this file from any "use client" component.
 * ⚠️  NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client initialised with the service-role key.
 * Throws a clear error if the required environment variables are not set.
 */
export function getAdminSupabaseClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin credentials are not configured. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  _adminClient = createClient(url, serviceRoleKey, {
    auth: {
      // Disable auth auto-refresh — this is a pure storage/admin client
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _adminClient;
}
