import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { FREE_PLAN, meetingsFor, PRO_PLAN } from "@/lib/plans";
import { Check } from "lucide-react";

export type Subscription = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

// Polar's subscription statuses, in plain words.
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  canceled: "Canceled",
};

export function FreePlanCard() {
  // Counted properly in Lesson 13; for now everyone has the full allowance.
  const meetingsLeft = meetingsFor(FREE_PLAN.credits);
  const totalMeetings = meetingsFor(FREE_PLAN.credits);
  const proMeetings = meetingsFor(PRO_PLAN.creditsPerMonth);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Current plan</CardTitle>
            <Badge variant="secondary">{FREE_PLAN.name}</Badge>
          </div>
          <CardDescription>
            {meetingsLeft} of {totalMeetings} free meetings left.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{PRO_PLAN.name}</CardTitle>
          <CardDescription>For people who meet every week.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight">
              ${PRO_PLAN.price}
            </span>
            <span className="text-sm text-muted-foreground">
              / {PRO_PLAN.interval}
            </span>
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-brand" />
              {proMeetings} meetings per {PRO_PLAN.interval}
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-brand" />
              Cancel anytime
            </li>
          </ul>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button asChild>
            {/* A plain link: the route needs a full page visit to redirect. */}
            <a href="/api/checkout">Subscribe</a>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

function renewalText({
  status,
  current_period_end: periodEnd,
  cancel_at_period_end: cancelsAtEnd,
}: Subscription) {
  if (!periodEnd) return null;
  const date = formatDate(periodEnd);
  if (status === "canceled") return `Ended on ${date}`;
  if (cancelsAtEnd) return `Cancels on ${date}`;
  return `Renews on ${date}`;
}

export function ProPlanCard({ subscription }: { subscription: Subscription }) {
  const proMeetings = meetingsFor(PRO_PLAN.creditsPerMonth);
  const renewal = renewalText(subscription);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{PRO_PLAN.name}</CardTitle>
          <Badge variant="secondary">
            {STATUS_LABELS[subscription.status] ?? subscription.status}
          </Badge>
        </div>
        <CardDescription>
          {proMeetings} meetings per {PRO_PLAN.interval} · ${PRO_PLAN.price}/
          {PRO_PLAN.interval}
        </CardDescription>
      </CardHeader>
      {renewal && (
        <CardContent>
          <p className="text-sm">{renewal}</p>
        </CardContent>
      )}
      <CardFooter className="justify-between gap-4 border-t pt-6">
        <p className="text-xs text-muted-foreground">
          Change your card, cancel, or download invoices.
        </p>
        <Button variant="outline" asChild>
          <a href="/api/portal">Manage billing</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
