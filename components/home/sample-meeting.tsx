import { StatusBadge } from "@/components/dashboard/status-badge";
import { SummarySections } from "@/components/dashboard/summary-sections";
import { formatDate } from "@/lib/format";
import type { MeetingSummary } from "@/lib/meetings";

// A made-up meeting, in exactly the shape a real summary is saved in.
const SAMPLE_TITLE = "Website redesign: kickoff with Northwind Bakery";
const SAMPLE_DATE = "2026-10-01T15:00:00Z";

const SAMPLE_SUMMARY: MeetingSummary = {
  summary:
    "Sara walked through what's wrong with the current site: it's slow on phones and the online order form confuses customers. We agreed to start with the order flow and leave the blog for later. Budget and timeline were confirmed. Sara will send photos and the current menu so design can start next week.",
  decisions: [
    "Start with the order form; the blog waits for phase two.",
    "Budget stays at $4,000 as quoted.",
    "Launch target is the end of November.",
  ],
  action_items: [
    {
      task: "Send the current menu and product photos.",
      owner: "Sara",
      due: "Friday",
    },
    {
      task: "Share two homepage design options.",
      owner: "You",
      due: "next Wednesday",
    },
    {
      task: "Check whether the payment provider can stay the same.",
      owner: "You",
      due: null,
    },
  ],
};

/** The top of the real meeting page, with the example meeting in it. */
export function SampleMeeting() {
  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-muted/40 p-4 sm:p-6">
      <header className="flex flex-col gap-3">
        <h3 className="break-words text-xl font-semibold tracking-tight">
          {SAMPLE_TITLE}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <StatusBadge status="done" />
          <span>{formatDate(SAMPLE_DATE)}</span>
        </div>
      </header>
      <SummarySections summary={SAMPLE_SUMMARY} />
    </div>
  );
}
