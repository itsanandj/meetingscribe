// Fake data for designing the dashboard. Replace with Supabase queries later.

export type MeetingStatus = "uploaded" | "transcribing" | "done" | "failed";

export type Meeting = {
  id: string;
  title: string;
  uploadedAt: string;
  sizeBytes: number;
  status: MeetingStatus;
};

const MB = 1024 * 1024;

export const mockMeetings: Meeting[] = [
  {
    id: "m5",
    title: "1:1 with Sarah",
    uploadedAt: "2026-09-29T02:15:00Z",
    sizeBytes: 4.3 * MB,
    status: "uploaded",
  },
  {
    id: "m1",
    title: "Weekly product sync",
    uploadedAt: "2026-09-28T09:30:00Z",
    sizeBytes: 18.4 * MB,
    status: "transcribing",
  },
  {
    id: "m2",
    title: "Customer interview: Acme Co.",
    uploadedAt: "2026-09-26T14:10:00Z",
    sizeBytes: 11.2 * MB,
    status: "done",
  },
  {
    id: "m3",
    title: "Design review: onboarding flow",
    uploadedAt: "2026-09-24T16:45:00Z",
    sizeBytes: 23.9 * MB,
    status: "done",
  },
  {
    id: "m4",
    title: "Q4 planning kickoff",
    uploadedAt: "2026-09-22T08:00:00Z",
    sizeBytes: 6.8 * MB,
    status: "failed",
  },
];
