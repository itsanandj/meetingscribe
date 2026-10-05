import { Button } from "@/components/ui/button";
import { FREE_PLAN, meetingsFor } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { cache, Suspense } from "react";

// Asked up to three times per page (top bar and two buttons), checked once.
const isLoggedIn = cache(async () => {
  if (!hasEnvVars) return false;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return !!data?.claims;
});

function SignUpButton() {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-start">
      <Button asChild size="lg" className="h-12 text-base">
        <Link href="/auth/sign-up">Sign up free</Link>
      </Button>
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        {meetingsFor(FREE_PLAN.credits)} meetings free, no card needed.
      </p>
    </div>
  );
}

async function MainButton() {
  if (!(await isLoggedIn())) return <SignUpButton />;
  return (
    <div className="flex flex-col items-stretch sm:items-start">
      <Button asChild size="lg" className="h-12 text-base">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}

/**
 * "Sign up free", or "Go to dashboard" for people who are logged in. Most
 * visitors aren't, so the sign-up button shows while we check.
 */
export function MainCta() {
  return (
    <Suspense fallback={<SignUpButton />}>
      <MainButton />
    </Suspense>
  );
}

function LogInLink() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/auth/login">Log in</Link>
    </Button>
  );
}

async function NavButton() {
  if (!(await isLoggedIn())) return <LogInLink />;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/dashboard">Go to dashboard</Link>
    </Button>
  );
}

/** The top bar's link: "Log in", or "Go to dashboard" when logged in. */
export function NavCta() {
  return (
    <Suspense fallback={<LogInLink />}>
      <NavButton />
    </Suspense>
  );
}
