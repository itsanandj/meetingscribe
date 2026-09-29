import { RefreshWhile } from "@/components/dashboard/refresh-while";
import { RetryTranscriptionButton } from "@/components/dashboard/retry-transcription-button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatFileSize } from "@/lib/format";
import { isMeetingId, type Meeting } from "@/lib/meetings";
import { isInProgress } from "@/lib/request-transcription";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

function TranscriptBody({ meeting }: { meeting: Meeting }) {
  if (meeting.status === "done") {
    return meeting.transcript ? (
      <p className="whitespace-pre-wrap text-sm leading-7">
        {meeting.transcript}
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">
        No speech was found in this recording.
      </p>
    );
  }

  if (meeting.status === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Transcription didn&apos;t work this time.
        </p>
        <RetryTranscriptionButton meetingId={meeting.id} title={meeting.title} />
      </div>
    );
  }

  if (isInProgress(meeting)) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Transcribing. This usually takes a minute or two, and this page updates
        by itself.
      </p>
    );
  }

  // Uploaded a while ago and never transcribed, e.g. before transcription
  // started automatically.
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">
        This recording hasn&apos;t been transcribed yet.
      </p>
      <RetryTranscriptionButton
        meetingId={meeting.id}
        title={meeting.title}
        label="Transcribe"
      />
    </div>
  );
}

async function MeetingDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMeetingId(id)) notFound();

  // The user's own client: Row Level Security only returns their meetings.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, file_path, file_size, status, created_at, transcript")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>
          This meeting couldn&apos;t be loaded. Refresh the page to try again.
        </AlertDescription>
      </Alert>
    );
  }
  if (!data) notFound();
  const meeting = data as Meeting;

  return (
    <div className="flex flex-col gap-8">
      <RefreshWhile active={isInProgress(meeting)} />
      <header className="flex flex-col gap-3">
        <h1 className="break-words text-2xl font-semibold tracking-tight">
          {meeting.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <StatusBadge status={meeting.status} />
          <span>{formatDate(meeting.created_at)}</span>
          <span aria-hidden>·</span>
          <span>{formatFileSize(meeting.file_size)}</span>
        </div>
      </header>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <TranscriptBody meeting={meeting} />
        </CardContent>
      </Card>
    </div>
  );
}

function MeetingSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export default function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/meetings"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Meetings
      </Link>
      <Suspense fallback={<MeetingSkeleton />}>
        <MeetingDetails params={params} />
      </Suspense>
    </div>
  );
}
