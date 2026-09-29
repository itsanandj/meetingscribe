export const RECORDINGS_BUCKET = "recordings";

export type MeetingStatus = "uploaded" | "transcribing" | "done" | "failed";

// One row of the public.meetings table.
export type Meeting = {
  id: string;
  title: string;
  file_path: string;
  file_size: number;
  status: MeetingStatus;
  created_at: string;
  transcript?: string | null;
};

const MEETING_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Meeting IDs are UUIDs; anything else can't be a meeting. */
export function isMeetingId(value: string) {
  return MEETING_ID_PATTERN.test(value);
}
