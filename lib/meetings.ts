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
};
