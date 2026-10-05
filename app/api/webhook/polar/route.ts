import { getProProductId, PRO_PLAN } from "@/lib/plans";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { webhooks } from "@polar-sh/sdk/2026-10";
import { Webhooks } from "@polar-sh/nextjs";
import type { NextRequest } from "next/server";

type SubscriptionPayload =
  | webhooks.WebhookSubscriptionCreatedPayload
  | webhooks.WebhookSubscriptionUpdatedPayload;

// Postgres error codes we expect and can't fix by trying again.
const DUPLICATE = "23505"; // a unique column already has this value
const NO_SUCH_USER = "23503"; // the user ID isn't in auth.users
const NOT_A_UUID = "22P02"; // the external ID isn't a Supabase user ID

/** Thrown errors make the route answer 500, so Polar tries again later. */
function fail(event: string, message: string, error: unknown): never {
  console.error(`❌ ${event} failed: ${message}`, error);
  throw error;
}

// A new subscription or a monthly renewal of Pro adds that month's credits.
async function handleOrderPaid({ type, data: order }: webhooks.WebhookOrderPaidPayload) {
  if (order.product_id !== getProProductId()) {
    console.warn(`⚠️ ${type} skipped: not the Pro product (order ${order.id})`);
    return;
  }
  if (
    order.billing_reason !== "subscription_create" &&
    order.billing_reason !== "subscription_cycle"
  ) {
    console.warn(
      `⚠️ ${type} skipped: billing reason "${order.billing_reason}" doesn't add credits (order ${order.id})`,
    );
    return;
  }
  const userId = order.customer.external_id;
  if (!userId) {
    console.warn(`⚠️ ${type} skipped: customer has no external ID (order ${order.id})`);
    return;
  }

  const { error } = await getSupabaseAdmin().from("credit_ledger").insert({
    user_id: userId,
    amount: PRO_PLAN.creditsPerMonth,
    reason: "Pro plan — monthly credits",
    polar_order_id: order.id,
  });

  if (error?.code === DUPLICATE) {
    console.warn(`⚠️ ${type} skipped: order ${order.id} already added credits (Polar retry)`);
    return;
  }
  if (error?.code === NO_SUCH_USER || error?.code === NOT_A_UUID) {
    console.warn(`⚠️ ${type} skipped: no user ${userId} (order ${order.id})`);
    return;
  }
  if (error) fail(type, `couldn't add credits for order ${order.id}`, error);

  console.log(
    `✅ ${type}: +${PRO_PLAN.creditsPerMonth} credits for user ${userId} (order ${order.id})`,
  );
}

// Keeps the user's row in subscriptions in step with Polar.
async function handleSubscription({ type, data: subscription }: SubscriptionPayload) {
  if (subscription.product_id !== getProProductId()) {
    console.warn(`⚠️ ${type} skipped: not the Pro product (subscription ${subscription.id})`);
    return;
  }
  const userId = subscription.customer.external_id;
  if (!userId) {
    console.warn(
      `⚠️ ${type} skipped: customer has no external ID (subscription ${subscription.id})`,
    );
    return;
  }

  const { error } = await getSupabaseAdmin().from("subscriptions").upsert(
    {
      user_id: userId,
      polar_customer_id: subscription.customer_id,
      polar_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error?.code === NO_SUCH_USER || error?.code === NOT_A_UUID) {
    console.warn(`⚠️ ${type} skipped: no user ${userId} (subscription ${subscription.id})`);
    return;
  }
  if (error) fail(type, `couldn't save subscription ${subscription.id}`, error);

  console.log(
    `✅ ${type}: user ${userId} is ${subscription.status}` +
      (subscription.cancel_at_period_end ? " (cancels at period end)" : ""),
  );
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("❌ webhook refused: POLAR_WEBHOOK_SECRET is not set.");
    return Response.json({ error: "Webhooks aren't set up." }, { status: 500 });
  }

  // The adapter checks the signature first and answers 403 if it's wrong, so
  // the handlers below only ever see real messages from Polar.
  const handle = Webhooks({
    webhookSecret,
    onOrderPaid: handleOrderPaid,
    onSubscriptionCreated: handleSubscription,
    onSubscriptionUpdated: handleSubscription,
  });
  return handle(request);
}
