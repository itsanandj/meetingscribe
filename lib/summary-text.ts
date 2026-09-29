import type { ActionItem, MeetingSummary } from "@/lib/meetings";

/** "Priya, due next Wednesday", "Priya", "due tomorrow", or "" if neither. */
export function describeActionItem({ owner, due }: ActionItem) {
  return [owner, due && `due ${due}`].filter(Boolean).join(", ");
}

/** The summary as plain text, ready to paste into an email or chat. */
export function formatSummaryAsText(summary: MeetingSummary) {
  const decisions = summary.decisions.length
    ? summary.decisions.map((decision) => `- ${decision}`).join("\n")
    : "None";

  const actionItems = summary.action_items.length
    ? summary.action_items
        .map((item) => {
          const details = describeActionItem(item);
          return `- ${item.task}${details ? ` (${details})` : ""}`;
        })
        .join("\n")
    : "None";

  return [
    "Summary",
    summary.summary,
    "",
    "Decisions",
    decisions,
    "",
    "Action items",
    actionItems,
  ].join("\n");
}
