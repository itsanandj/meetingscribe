import { ActionItemsChecklist } from "@/components/dashboard/action-items-checklist";
import { CopySummaryButton } from "@/components/dashboard/copy-summary-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeetingSummary } from "@/lib/meetings";

/** Summary, then Decisions, then Action items. */
export function SummarySections({ summary }: { summary: MeetingSummary }) {
  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Summary</CardTitle>
          <CopySummaryButton summary={summary} />
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7">{summary.summary}</p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.decisions.length ? (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6">
              {summary.decisions.map((decision, index) => (
                <li key={index}>{decision}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No decisions were recorded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Action items</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.action_items.length ? (
            <ActionItemsChecklist items={summary.action_items} />
          ) : (
            <p className="text-sm text-muted-foreground">No action items.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
