import { AutoStart } from "@/components/dashboard/auto-start";
import { SummarySections } from "@/components/dashboard/summary-sections";
import { RefreshWhile } from "@/components/dashboard/refresh-while";
import { RetryTranscriptionButton } from "@/components/dashboard/retry-transcription-button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TranscriptSection } from "@/components/dashboard/transcript-section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatFileSize } from "@/lib/format";
import {
  isMeetingId,
  MAX_ATTEMPTS,
  MEETING_COLUMNS,
  type Meeting,
} from "@/lib/meetings";
import { canRetry, isInProgress, isStuck } from "@/lib/process-meeting";
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

function ContactSupport() {
  return (
    <p>
      This has been tried {MAX_ATTEMPTS} times without success. Please contact
      support and we&apos;ll sort it out.
    </p>
  );
}

/** Everything above the transcript, depending on how far the meeting got. */
function MeetingBody({
  meeting,
  otherInProgress,
}: {
  meeting: Meeting;
  otherInProgress: boolean;
}) {
  const hasTranscript = meeting.transcript != null;

  if (meeting.status === "failed" || isStuck(meeting)) {
    return (
      <MessageCard>
        <p>
          {meeting.status === "failed"
            ? hasTranscript
              ? "The transcript is ready, but the summary didn't work this time."
              : "Transcription didn't work this time."
            : "This meeting stopped making progress."}
        </p>
        {canRetry(meeting) ? (
          <RetryTranscriptionButton
            meetingId={meeting.id}
            title={meeting.title}
            hasTranscript={hasTranscript}
          />
        ) : (
          <ContactSupport />
        )}
      </MessageCard>
    );
  }

  // Uploaded but not started yet: start it here, or wait for the other one.
  if (
    isInProgress(meeting) &&
    meeting.status === "uploaded" &&
    meeting.transcribe_attempts === 0
  ) {
    return (
      <MessageCard>
        <AutoStart meetingId={meeting.id} />
        <p className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {otherInProgress
            ? "Waiting for your other meeting to finish. This one starts by itself."
            : "Starting…"}
        </p>
      </MessageCard>
    );
  }

  if (isInProgress(meeting)) {
    return (
      <MessageCard>
        <p className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {meeting.status === "transcribing"
            ? "Transcribing the recording."
            : "Summarizing the transcript."}{" "}
          This usually takes a minute or two, and this page updates by itself.
        </p>
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
    return (
      <MessageCard>
        <p>
          This meeting was processed before summaries were added, so it only
          has a transcript.
        </p>
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
    .select(`${MEETING_COLUMNS}, transcript, summary`)
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

  // Another of the user's meetings in progress means this one waits its turn.
  const { count: othersInProgress } = await supabase
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .neq("id", meeting.id)
    .in("status", ["transcribing", "transcribed", "summarizing"]);

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
      <MeetingBody meeting={meeting} otherInProgress={!!othersInProgress} />
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
