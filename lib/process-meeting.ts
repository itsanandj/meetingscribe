import type { Meeting } from "@/lib/meetings";

type Result = { ok: true } | { ok: false; message: string; code?: string };

async function callRoute(
  meetingId: string,
  step: "transcribe" | "summarize",
): Promise<Result> {
  try {
    const response = await fetch(`/api/meetings/${meetingId}/${step}`, {
      method: "POST",
    });
    if (response.ok) return { ok: true };
    const body = await response.json().catch(() => null);
    return {
      ok: false,
      message: body?.error ?? "Something went wrong. Please try again.",
      code: body?.code,
    };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the server. Check your connection and try again.",
    };
  }
}

/**
 * Transcribes a meeting, then summarizes it. Each request only answers once
 * its step is saved, which can take a few minutes.
 *
 * With `hasTranscript: true` it skips straight to the summary. When it isn't
 * known (the Meetings list doesn't load transcripts), it tries the summary
 * first and transcribes only if the server says there is no transcript yet.
 */
export async function processMeeting(
  meetingId: string,
  {
    hasTranscript,
    onTranscribed,
  }: { hasTranscript?: boolean; onTranscribed?: () => void } = {},
): Promise<Result> {
  if (hasTranscript !== false) {
    const summary = await callRoute(meetingId, "summarize");
    if (summary.ok || summary.code !== "not_transcribed") return summary;
  }

  const transcription = await callRoute(meetingId, "transcribe");
  if (!transcription.ok) return transcription;
  onTranscribed?.();

  return callRoute(meetingId, "summarize");
}

// Meetings still being worked on. "Uploaded" only counts for a few minutes:
// older ones were uploaded before processing started automatically.
export function isInProgress(meeting: Pick<Meeting, "status" | "created_at">) {
  if (meeting.status === "transcribing" || meeting.status === "summarizing") {
    return true;
  }
  const fiveMinutes = 5 * 60 * 1000;
  return (
    meeting.status === "uploaded" &&
    Date.now() - new Date(meeting.created_at).getTime() < fiveMinutes
  );
}
