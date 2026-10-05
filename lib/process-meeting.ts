import { MAX_ATTEMPTS, STUCK_AFTER_MS, type Meeting } from "@/lib/meetings";

type Result = { ok: true } | { ok: false; message: string; code?: string };

// While another meeting is processing, check again this often, for at most
// as long as a meeting can run before it counts as stuck.
const WAIT_INTERVAL_MS = 5000;
const MAX_WAIT_MS = STUCK_AFTER_MS + 60 * 1000;

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

/** Calls a step, and if another meeting is processing, waits its turn. */
async function callWhenFree(
  meetingId: string,
  step: "transcribe" | "summarize",
  onWaiting?: () => void,
): Promise<Result> {
  const giveUpAt = Date.now() + MAX_WAIT_MS;
  let result = await callRoute(meetingId, step);
  if (result.ok || result.code !== "busy") return result;

  onWaiting?.();
  while (Date.now() < giveUpAt) {
    await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
    result = await callRoute(meetingId, step);
    if (result.ok || result.code !== "busy") return result;
  }
  return result;
}

/**
 * Transcribes a meeting, then summarizes it. Each request only answers once
 * its step is saved, which can take a few minutes. If another meeting is
 * processing, it calls `onWaiting` and starts by itself when that one is done.
 *
 * With `hasTranscript: true` it skips straight to the summary. When it isn't
 * known (the Meetings list doesn't load transcripts), it tries the summary
 * first and transcribes only if the server says there is no transcript yet.
 */
export async function processMeeting(
  meetingId: string,
  {
    hasTranscript,
    onWaiting,
    onTranscribed,
  }: {
    hasTranscript?: boolean;
    onWaiting?: () => void;
    onTranscribed?: () => void;
  } = {},
): Promise<Result> {
  if (hasTranscript !== false) {
    const summary = await callWhenFree(meetingId, "summarize", onWaiting);
    if (summary.ok || summary.code !== "not_transcribed") return summary;
  }

  const transcription = await callWhenFree(meetingId, "transcribe", onWaiting);
  if (!transcription.ok) return transcription;
  onTranscribed?.();

  return callWhenFree(meetingId, "summarize", onWaiting);
}

type MeetingTimes = Pick<Meeting, "status" | "created_at" | "updated_at">;

const IN_PROGRESS = ["transcribing", "transcribed", "summarizing"];

/**
 * Started but unchanged for 10 minutes: the work died (a closed tab or a
 * timeout). The database marks it failed the next time anything starts.
 */
export function isStuck(meeting: MeetingTimes) {
  return (
    IN_PROGRESS.includes(meeting.status) &&
    Date.now() - new Date(meeting.updated_at).getTime() > STUCK_AFTER_MS
  );
}

// Meetings still being worked on. "Uploaded" counts for as long as a meeting
// may wait for another one to finish; older uploads never started.
export function isInProgress(meeting: MeetingTimes) {
  if (IN_PROGRESS.includes(meeting.status)) return !isStuck(meeting);
  return (
    meeting.status === "uploaded" &&
    Date.now() - new Date(meeting.created_at).getTime() < MAX_WAIT_MS
  );
}

type MeetingAttempts = Pick<
  Meeting,
  "transcribe_attempts" | "summary_attempts" | "transcript"
>;

/**
 * Whether the step that failed has tries left. The summary only ever starts
 * after a transcript is saved, so summary attempts mean there is one. Pass
 * `transcript` when it's loaded; without it, that's how we tell.
 */
export function hasAttemptsLeft(meeting: MeetingAttempts) {
  const transcribed =
    meeting.transcript !== undefined
      ? meeting.transcript !== null
      : meeting.summary_attempts > 0;
  return transcribed
    ? meeting.summary_attempts < MAX_ATTEMPTS
    : meeting.transcribe_attempts < MAX_ATTEMPTS;
}

/** Failed, or stuck, with tries left: show "Try again". */
export function canRetry(meeting: MeetingTimes & MeetingAttempts) {
  return (meeting.status === "failed" || isStuck(meeting)) && hasAttemptsLeft(meeting);
}
