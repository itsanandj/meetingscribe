import { getPolarConfig } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { NextResponse, type NextRequest } from "next/server";

// Sends a subscribed user to Polar's customer portal, where they can cancel,
// change their card, and download invoices.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const billingUrl = new URL("/dashboard/billing", request.url);

  // The user's own client: Row Level Security only returns their row.
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("polar_customer_id")
    .maybeSingle();
  if (error) {
    console.error("Loading the subscription failed:", error);
    billingUrl.searchParams.set("error", "portal");
    return NextResponse.redirect(billingUrl);
  }
  if (!subscription) return NextResponse.redirect(billingUrl);

  const portal = CustomerPortal({
    ...getPolarConfig(),
    getCustomerId: async () => subscription.polar_customer_id,
    returnUrl: billingUrl.toString(),
  });
  const response = await portal(request);

  // The adapter answers with a bare error if Polar refuses; send the user
  // back to Billing with a friendly message instead.
  if (!response.headers.get("location")) {
    billingUrl.searchParams.set("error", "portal");
    return NextResponse.redirect(billingUrl);
  }
  return response;
}
