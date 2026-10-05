export const RECORDINGS_BUCKET = "recordings";

export type MeetingStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "summarizing"
  | "done"
  | "failed";

// The shape of meetings.summary, fixed by the Structured Outputs schema.
export type ActionItem = {
  task: string;
  owner: string | null;
  due: string | null;
};

export type MeetingSummary = {
  summary: string;
  decisions: string[];
  action_items: ActionItem[];
};

// One row of the public.meetings table.
export type Meeting = {
  id: string;
  title: string;
  file_path: string;
  file_size: number;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
  transcribe_attempts: number;
  summary_attempts: number;
  transcript?: string | null;
  summary?: MeetingSummary | null;
};

// The columns every page loads. Transcript and summary are added where needed.
export const MEETING_COLUMNS =
  "id, title, file_path, file_size, status, created_at, updated_at, transcribe_attempts, summary_attempts";

// These match the add_processing_rules migration, which enforces them.
export const MAX_ATTEMPTS = 3;
export const STUCK_AFTER_MS = 10 * 60 * 1000;

const MEETING_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Meeting IDs are UUIDs; anything else can't be a meeting. */
export function isMeetingId(value: string) {
  return MEETING_ID_PATTERN.test(value);
}
