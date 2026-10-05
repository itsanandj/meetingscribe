import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreditLine } from "@/lib/credits";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Every change to the user's credits, newest first, like a bank statement. */
export function CreditHistory({ lines }: { lines: CreditLine[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Credit history</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing yet. Each meeting you process will show up here.
          </p>
        ) : (
          <ul className="-my-3 divide-y">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-4 py-3 text-sm">
                <span className="w-24 shrink-0 text-muted-foreground">
                  {formatDate(line.created_at)}
                </span>
                <span className="min-w-0 flex-1 truncate">{line.reason}</span>
                <span
                  className={cn(
                    "shrink-0 font-medium tabular-nums",
                    line.amount > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {line.amount > 0 ? `+${line.amount}` : `−${-line.amount}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
