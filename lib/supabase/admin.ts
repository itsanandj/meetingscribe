import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

/**
 * Uses the secret key, so it bypasses Row Level Security. Only use it to
 * update a meeting after the user's own client has confirmed they own it.
 * Created on first use, not when the file loads, so `next build` works
 * without the keys.
 */
export function getSupabaseAdmin(): SupabaseClient {
  adminClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
  return adminClient;
}
