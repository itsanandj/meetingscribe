import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan and payment details."
      />
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Current plan</CardTitle>
            <Badge variant="secondary">Free</Badge>
          </div>
          <CardDescription>
            You&apos;re on the Free plan.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-between gap-4 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            Paid plans are coming soon.
          </p>
          <Button variant="outline" disabled>
            Upgrade
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
