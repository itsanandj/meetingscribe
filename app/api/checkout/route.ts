import { getProProductId } from "@/lib/plans";
import { createPolarClient } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// Sends a logged-in user to Polar's checkout page for the Pro plan.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const billingUrl = new URL("/dashboard/billing", request.url);

  let checkoutUrl: string;
  try {
    const checkout = await createPolarClient().checkouts.create({
      products: [getProProductId()],
      // Comes from the login on our server, so the browser can't pay for
      // someone else. This is what links the Polar customer to this user.
      external_customer_id: auth.claims.sub,
      customer_email:
        typeof auth.claims.email === "string" ? auth.claims.email : undefined,
      success_url: new URL("?success=1", billingUrl).toString(),
      return_url: billingUrl.toString(),
    });
    checkoutUrl = checkout.url;
  } catch (error) {
    console.error("Creating a Polar checkout failed:", error);
    billingUrl.searchParams.set("error", "checkout");
    return NextResponse.redirect(billingUrl);
  }

  return NextResponse.redirect(checkoutUrl);
}
