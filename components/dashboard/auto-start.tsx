"use client";

import { processMeeting } from "@/lib/process-meeting";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Starts a freshly uploaded meeting that nothing has started yet, e.g. when
 * the upload tab was closed, or waits its turn behind another meeting. If
 * the upload tab starts it first, the database refuses this one quietly.
 */
export function AutoStart({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void processMeeting(meetingId, {
      hasTranscript: false,
      onTranscribed: () => router.refresh(),
    }).then(() => router.refresh());
  }, [meetingId, router]);

  return null;
}
