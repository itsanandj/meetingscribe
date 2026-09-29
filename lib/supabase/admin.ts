import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Uses the secret key, so it bypasses Row Level Security. Only use it to
 * update a meeting after the user's own client has confirmed they own it.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
