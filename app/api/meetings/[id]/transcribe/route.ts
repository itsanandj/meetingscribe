import { isMeetingId, RECORDINGS_BUCKET } from "@/lib/meetings";
import { FREE_PLAN } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/transcribe";
import { NextResponse } from "next/server";

// Long recordings can take a few minutes to transcribe.
export const maxDuration = 300;

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

// What start_transcription can answer, other than "ok".
const REFUSALS: Record<string, { message: string; status: number }> = {
  no_credits: {
    message: "You're out of meetings — upgrade on the Billing page.",
    status: 402,
  },
  busy: { message: "Another meeting is still processing.", status: 409 },
  not_allowed: {
    message: "This meeting can't be transcribed right now.",
    status: 409,
  },
  too_many_attempts: {
    message: "This meeting has been tried 3 times. Please contact support.",
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
    .select("id, file_path")
    .eq("id", id)
    .maybeSingle();
  if (loadError) {
    console.error(`Loading meeting ${id} failed:`, loadError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (!meeting) return errorResponse("Meeting not found.", 404);

  // Claims the meeting and takes its credit in one step. The database
  // decides: one meeting at a time, 3 tries, and one credit per meeting.
  const { data: result, error: startError } = await supabaseAdmin.rpc(
    "start_transcription",
    {
      p_meeting_id: meeting.id,
      p_user_id: auth.claims.sub,
      p_free_credits: FREE_PLAN.credits,
    },
  );
  if (startError) {
    console.error(`Starting transcription of ${meeting.id} failed:`, startError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (result !== "ok") {
    const refusal = REFUSALS[result] ?? REFUSALS.not_allowed;
    return errorResponse(refusal.message, refusal.status, result);
  }

  try {
    // The user's client again: the user wrote file_path, so the storage
    // rules must decide whether they may read it.
    const { data: audio, error: downloadError } = await supabase.storage
      .from(RECORDINGS_BUCKET)
      .download(meeting.file_path);
    if (downloadError) throw downloadError;

    const fileName = meeting.file_path.split("/").pop()!;
    const transcript = await transcribeAudio(audio, fileName);

    const { error: saveError } = await supabaseAdmin
      .from("meetings")
      .update({ transcript, status: "transcribed" })
      .eq("id", meeting.id);
    if (saveError) throw saveError;

    // The app calls the summarize route next.
    return NextResponse.json({ status: "transcribed" });
  } catch (error) {
    console.error(`Transcription of meeting ${meeting.id} failed:`, error);
    const { error: failError } = await supabaseAdmin
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", meeting.id);
    if (failError) {
      console.error(`Marking meeting ${meeting.id} as failed failed:`, failError);
    }
    return errorResponse("Transcription failed. Please try again.", 500);
  }
}
