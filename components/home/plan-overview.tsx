import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_PLAN, meetingsFor, PRO_PLAN } from "@/lib/plans";
import { Check } from "lucide-react";

function Price({ amount, per }: { amount: number; per?: string }) {
  return (
    <p className="flex items-baseline gap-1">
      <span className="text-3xl font-semibold tracking-tight">${amount}</span>
      {per && <span className="text-sm text-muted-foreground">/ {per}</span>}
    </p>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="size-4 shrink-0 text-brand" />
      {children}
    </li>
  );
}

/** Free and Pro side by side. Every number comes from lib/plans.ts. */
export function PlanOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{FREE_PLAN.name}</CardTitle>
          <CardDescription>To try it out.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Price amount={0} />
          <ul className="flex flex-col gap-2 text-sm">
            <Feature>{meetingsFor(FREE_PLAN.credits)} meetings</Feature>
            <Feature>No card needed</Feature>
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{PRO_PLAN.name}</CardTitle>
          <CardDescription>For people who meet every week.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Price amount={PRO_PLAN.price} per={PRO_PLAN.interval} />
          <ul className="flex flex-col gap-2 text-sm">
            <Feature>
              {meetingsFor(PRO_PLAN.creditsPerMonth)} meetings every{" "}
              {PRO_PLAN.interval}
            </Feature>
            <Feature>Cancel anytime</Feature>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
