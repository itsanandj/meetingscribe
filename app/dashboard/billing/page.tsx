import { PageHeader } from "@/components/dashboard/page-header";
import { FreePlanCard, ProPlanCard } from "@/components/dashboard/plan-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

type SearchParams = Promise<{ success?: string; error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  checkout: "Checkout couldn't start. Please try again in a moment.",
  portal: "Billing couldn't be opened. Please try again in a moment.",
};

async function Notices({ searchParams }: { searchParams: SearchParams }) {
  const { success, error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <>
      {success === "1" && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>
            Thanks — your plan will appear in a moment.
          </AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

async function Plan() {
  // The user's own client: Row Level Security only returns their row.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .maybeSingle();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>
          Your plan couldn&apos;t be loaded. Refresh the page to try again.
        </AlertDescription>
      </Alert>
    );
  }

  return data ? <ProPlanCard subscription={data} /> : <FreePlanCard />;
}

function PlanSkeleton() {
  return <Skeleton className="h-40 w-full rounded-xl" />;
}

export default function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan and payment details."
      />
      <Suspense>
        <Notices searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<PlanSkeleton />}>
        <Plan />
      </Suspense>
    </>
  );
}
