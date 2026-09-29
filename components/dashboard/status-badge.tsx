import { Badge } from "@/components/ui/badge";
import type { MeetingStatus } from "@/lib/meetings";
import { cn } from "@/lib/utils";

const statusStyles: Record<MeetingStatus, { label: string; dot: string }> = {
  uploaded: { label: "Uploaded", dot: "bg-muted-foreground" },
  transcribing: { label: "Transcribing", dot: "bg-brand animate-pulse" },
  summarizing: { label: "Summarizing", dot: "bg-brand animate-pulse" },
  done: { label: "Done", dot: "bg-emerald-500" },
  failed: { label: "Failed", dot: "bg-destructive" },
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  const { label, dot } = statusStyles[status];

  return (
    <Badge variant="outline" className="shrink-0 gap-1.5 font-normal">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
