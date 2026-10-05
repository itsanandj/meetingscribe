import { isMeetingId } from "@/lib/meetings";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { summarizeTranscript } from "@/lib/transcribe";
import { NextResponse } from "next/server";

// Long transcripts, plus one retry, can take a few minutes.
export const maxDuration = 300;

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

// What start_summary can answer, other than "ok".
const REFUSALS: Record<string, { message: string; status: number }> = {
  busy: { message: "Another meeting is still processing.", status: 409 },
  not_allowed: {
    message: "This meeting can't be summarized right now.",
    status: 409,
  },
  too_many_attempts: {
    message: "The summary has been tried 3 times. Please contact support.",
    status: 409,
  },
  not_found: { message: "Meeting not found.", status: 404 },
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return errorResponse("Please sign in.", 401);

  if (!isMeetingId(id)) return errorResponse("Meeting not found.", 404);

  // The user's own client: Row Level Security only returns their meetings.
  const { data: meeting, error: loadError } = await supabase
    .from("meetings")
    .select("id, transcript")
    .eq("id", id)
    .maybeSingle();
  if (loadError) {
    console.error(`Loading meeting ${id} failed:`, loadError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (!meeting) return errorResponse("Meeting not found.", 404);
  if (meeting.transcript === null) {
    return errorResponse(
      "This meeting hasn't been transcribed yet.",
      409,
      "not_transcribed",
    );
  }

  // Claims the meeting in one step. The database decides: only after a
  // transcript is saved, one meeting at a time, and 3 tries. Never charges.
  const { data: result, error: startError } = await getSupabaseAdmin().rpc(
    "start_summary",
    { p_meeting_id: meeting.id, p_user_id: auth.claims.sub },
  );
  if (startError) {
    console.error(`Starting summary of ${meeting.id} failed:`, startError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (result !== "ok") {
    const refusal = REFUSALS[result] ?? REFUSALS.not_allowed;
    return errorResponse(refusal.message, refusal.status, result);
  }

  try {
    // No speech means nothing to summarize, so don't call OpenAI.
    const summary = meeting.transcript.trim()
      ? await summarizeTranscript(meeting.transcript)
      : null;

    const { error: saveError } = await getSupabaseAdmin()
      .from("meetings")
      .update({ summary, status: "done" })
      .eq("id", meeting.id);
    if (saveError) throw saveError;

    return NextResponse.json({ status: "done" });
  } catch (error) {
    console.error(`Summary of meeting ${meeting.id} failed:`, error);
    const { error: failError } = await getSupabaseAdmin()
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", meeting.id);
    if (failError) {
      console.error(`Marking meeting ${meeting.id} as failed failed:`, failError);
    }
    return errorResponse("The summary failed. Please try again.", 500);
  }
}
