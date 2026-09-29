import { isMeetingId } from "@/lib/meetings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { summarizeTranscript } from "@/lib/transcribe";
import { NextResponse } from "next/server";

// Long transcripts, plus one retry, can take a few minutes.
export const maxDuration = 300;

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

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
    .select("id, status, transcript")
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

  // Claims the meeting unless it is being transcribed again right now.
  // "summarizing" is allowed: the transcribe route hands over in that status.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("meetings")
    .update({ status: "summarizing" })
    .eq("id", meeting.id)
    .in("status", ["summarizing", "failed", "done"])
    .select("id");
  if (claimError) {
    console.error(`Starting summary of ${meeting.id} failed:`, claimError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (!claimed.length) {
    return errorResponse("This meeting is being transcribed right now.", 409);
  }

  try {
    // No speech means nothing to summarize, so don't call OpenAI.
    const summary = meeting.transcript.trim()
      ? await summarizeTranscript(meeting.transcript)
      : null;

    const { error: saveError } = await supabaseAdmin
      .from("meetings")
      .update({ summary, status: "done" })
      .eq("id", meeting.id);
    if (saveError) throw saveError;

    return NextResponse.json({ status: "done" });
  } catch (error) {
    console.error(`Summary of meeting ${meeting.id} failed:`, error);
    const { error: failError } = await supabaseAdmin
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", meeting.id);
    if (failError) {
      console.error(`Marking meeting ${meeting.id} as failed failed:`, failError);
    }
    return errorResponse("The summary failed. Please try again.", 500);
  }
}
