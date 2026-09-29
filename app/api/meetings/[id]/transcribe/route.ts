import { isMeetingId, RECORDINGS_BUCKET } from "@/lib/meetings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/transcribe";
import { NextResponse } from "next/server";

// Long recordings can take a few minutes to transcribe.
export const maxDuration = 300;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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
    .select("id, file_path")
    .eq("id", id)
    .maybeSingle();
  if (loadError) {
    console.error(`Loading meeting ${id} failed:`, loadError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (!meeting) return errorResponse("Meeting not found.", 404);

  // Only claims the meeting if it isn't already being transcribed, so a
  // double click can't start two paid transcriptions.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("meetings")
    .update({ status: "transcribing" })
    .eq("id", meeting.id)
    .neq("status", "transcribing")
    .select("id");
  if (claimError) {
    console.error(`Starting transcription of ${meeting.id} failed:`, claimError);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  if (!claimed.length) {
    return errorResponse("This meeting is already being transcribed.", 409);
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
      .update({ transcript, status: "done" })
      .eq("id", meeting.id);
    if (saveError) throw saveError;

    return NextResponse.json({ status: "done" });
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
