"use client";

import { Button } from "@/components/ui/button";
import type { MeetingSummary } from "@/lib/meetings";
import { formatSummaryAsText } from "@/lib/summary-text";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CopySummaryButton({ summary }: { summary: MeetingSummary }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatSummaryAsText(summary));
      setCopied(true);
      toast.success("Summary copied");
    } catch {
      toast.error("Couldn't copy. Your browser blocked access to the clipboard.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy summary"}
    </Button>
  );
}
