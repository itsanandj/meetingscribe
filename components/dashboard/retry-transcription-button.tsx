"use client";

import { Button } from "@/components/ui/button";
import { requestTranscription } from "@/lib/request-transcription";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function RetryTranscriptionButton({
  meetingId,
  title,
  label = "Try again",
  className,
}: {
  meetingId: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const retry = async () => {
    setIsPending(true);
    // The route marks the meeting "transcribing" right away, but only answers
    // when it's finished, so show the new status before then.
    const showProgress = setTimeout(() => router.refresh(), 1000);
    const result = await requestTranscription(meetingId);
    clearTimeout(showProgress);
    setIsPending(false);
    if (result.ok) {
      toast.success(`Transcript ready for "${title}"`);
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
