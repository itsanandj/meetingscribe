import { SummarySections } from "@/components/dashboard/summary-sections";
import { RefreshWhile } from "@/components/dashboard/refresh-while";
import { RetryTranscriptionButton } from "@/components/dashboard/retry-transcription-button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TranscriptSection } from "@/components/dashboard/transcript-section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatFileSize } from "@/lib/format";
import { isMeetingId, type Meeting } from "@/lib/meetings";
import { isInProgress } from "@/lib/process-meeting";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

function MessageCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col items-start gap-3 pt-6 text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

/** Everything above the transcript, depending on how far the meeting got. */
function MeetingBody({ meeting }: { meeting: Meeting }) {
  const hasTranscript = meeting.transcript != null;

  if (isInProgress(meeting)) {
    return (
      <MessageCard>
        <p className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {meeting.status === "summarizing"
            ? "Summarizing the transcript."
            : "Transcribing the recording."}{" "}
          This usually takes a minute or two, and this page updates by itself.
        </p>
      </MessageCard>
    );
  }

  if (meeting.status === "failed") {
    return (
      <MessageCard>
        <p>
          {hasTranscript
            ? "The transcript is ready, but the summary didn't work this time."
            : "Transcription didn't work this time."}
        </p>
        <RetryTranscriptionButton
          meetingId={meeting.id}
          title={meeting.title}
          hasTranscript={hasTranscript}
        />
      </MessageCard>
    );
  }

  if (meeting.status === "done") {
    if (meeting.summary) return <SummarySections summary={meeting.summary} />;
    if (!meeting.transcript?.trim()) {
      return (
        <MessageCard>
          <p>No speech was found in this recording.</p>
        </MessageCard>
      );
    }
    // Transcribed before summaries existed.
    return (
      <MessageCard>
        <p>This meeting doesn&apos;t have a summary yet.</p>
        <RetryTranscriptionButton
          meetingId={meeting.id}
          title={meeting.title}
          hasTranscript
          label="Summarize"
        />
      </MessageCard>
    );
  }

  // Uploaded a while ago and never processed, e.g. before it started
  // automatically.
  return (
    <MessageCard>
      <p>This recording hasn&apos;t been transcribed yet.</p>
      <RetryTranscriptionButton
        meetingId={meeting.id}
        title={meeting.title}
        hasTranscript={false}
        label="Transcribe"
      />
    </MessageCard>
  );
}

async function MeetingDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMeetingId(id)) notFound();

  // The user's own client: Row Level Security only returns their meetings.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(
      "id, title, file_path, file_size, status, created_at, transcript, summary",
    )
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
    <div className="flex flex-col gap-6">
      <RefreshWhile active={isInProgress(meeting)} />
      <header className="mb-2 flex flex-col gap-3">
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
      <MeetingBody meeting={meeting} />
      {meeting.transcript?.trim() && (
        <TranscriptSection transcript={meeting.transcript} />
      )}
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
