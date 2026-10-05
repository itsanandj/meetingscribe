"use client";

import { Button } from "@/components/ui/button";
import { processMeeting } from "@/lib/process-meeting";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Picks up where a meeting stopped: transcribes it if there's no transcript
 * yet, then summarizes it.
 */
export function RetryTranscriptionButton({
  meetingId,
  title,
  hasTranscript,
  label = "Try again",
  className,
}: {
  meetingId: string;
  title: string;
  hasTranscript?: boolean;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const retry = async () => {
    setIsPending(true);
    // Each route updates the status right away but only answers when it's
    // finished, so show the new status before then.
    const showProgress = setTimeout(() => router.refresh(), 1000);
    const result = await processMeeting(meetingId, {
      hasTranscript,
      onWaiting: () =>
        toast(`"${title}" is waiting for your other meeting to finish.`),
      onTranscribed: () => router.refresh(),
    });
    clearTimeout(showProgress);
    setIsPending(false);
    if (result.ok) {
      toast.success(`Summary ready for "${title}"`);
    } else {
      toast.error(result.message);
    }
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={retry}
      disabled={isPending}
      className={className}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
      {label}
    </Button>
  );
}
