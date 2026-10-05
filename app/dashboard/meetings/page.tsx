import { MeetingList } from "@/components/dashboard/meeting-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MEETING_COLUMNS, type Meeting } from "@/lib/meetings";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, Upload } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

async function Meetings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>
          Your meetings couldn&apos;t be loaded. Refresh the page to try again.
        </AlertDescription>
      </Alert>
    );
  }

  return <MeetingList initialMeetings={data as Meeting[]} />;
}

function MeetingsSkeleton() {
  return (
    <Card className="divide-y shadow-none">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        title="Meetings"
        description="Transcripts and summaries of your recorded meetings."
        action={
          <Button asChild>
            <Link href="/dashboard/upload">
              <Upload />
              Upload
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<MeetingsSkeleton />}>
        <Meetings />
      </Suspense>
    </>
  );
}
