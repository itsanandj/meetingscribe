import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function EmailField() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <Input id="email" defaultValue={data?.claims?.email ?? ""} readOnly />
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account." />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your sign-in details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Suspense fallback={<Input id="email" disabled />}>
            <EmailField />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}
