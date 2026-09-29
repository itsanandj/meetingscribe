import type { Meeting } from "@/lib/meetings";

type Result = { ok: true } | { ok: false; message: string };

/**
 * Asks our transcribe route to transcribe a meeting. The request only
 * finishes once the transcript is saved, which can take a few minutes.
 */
export async function requestTranscription(meetingId: string): Promise<Result> {
  try {
    const response = await fetch(`/api/meetings/${meetingId}/transcribe`, {
      method: "POST",
    });
    if (response.ok) return { ok: true };
    const body = await response.json().catch(() => null);
    return {
      ok: false,
      message: body?.error ?? "Transcription failed. Please try again.",
    };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the server. Check your connection and try again.",
    };
  }
}

// Meetings still waiting on a transcript. "Uploaded" only counts for a few
// minutes: older ones were uploaded before transcription started automatically.
export function isInProgress(meeting: Pick<Meeting, "status" | "created_at">) {
  if (meeting.status === "transcribing") return true;
  const fiveMinutes = 5 * 60 * 1000;
  return (
    meeting.status === "uploaded" &&
    Date.now() - new Date(meeting.created_at).getTime() < fiveMinutes
  );
}
