import "server-only";
import { FREE_PLAN } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type CreditLine = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

/**
 * The user's credits for showing on a page: the free credits plus every line
 * in their credit_ledger. Reads with the user's own client, so Row Level
 * Security only returns their lines. The real check happens in the database
 * when a meeting starts.
 */
export async function getCreditBalance(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("credit_ledger").select("amount");
  if (error) throw error;
  return FREE_PLAN.credits + data.reduce((sum, line) => sum + line.amount, 0);
}

/** Every change to the user's credits, newest first. */
export async function getCreditHistory(): Promise<CreditLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id, amount, reason, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
