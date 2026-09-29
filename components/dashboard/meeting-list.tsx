"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatFileSize } from "@/lib/format";
import { RECORDINGS_BUCKET, type Meeting } from "@/lib/meetings";
import { isInProgress } from "@/lib/request-transcription";
import { createClient } from "@/lib/supabase/client";
import { FileAudio, Loader2, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshWhile } from "./refresh-while";
import { RetryTranscriptionButton } from "./retry-transcription-button";
import { StatusBadge } from "./status-badge";

function DeleteMeetingButton({
  meeting,
  isDeleting,
  onDelete,
}: {
  meeting: Meeting;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${meeting.title}`}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{meeting.title}&rdquo; and its transcript will be removed.
            This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className={buttonVariants({ variant: "destructive" })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyState() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted">
          <FileAudio className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">No meetings yet</h2>
          <p className="text-sm text-muted-foreground">
            Upload a recording to get a transcript and summary.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/upload">
            <Upload />
            Upload a recording
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function MeetingList({
  initialMeetings,
}: {
  initialMeetings: Meeting[];
}) {
  const router = useRouter();
  // The list comes from the server and refreshes as statuses change; only
  // hide the meetings deleted here until the next refresh catches up.
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const meetings = initialMeetings.filter((m) => !deletedIds.includes(m.id));

  if (meetings.length === 0) return <EmptyState />;

  // Remove the recording first, then the row, so a row never points to a
  // file that was kept by mistake.
  const remove = async (meeting: Meeting) => {
    setDeletingId(meeting.id);
    const supabase = createClient();

    const { error: storageError } = await supabase.storage
      .from(RECORDINGS_BUCKET)
      .remove([meeting.file_path]);
    if (storageError) {
      setDeletingId(null);
      toast.error(`Couldn't delete "${meeting.title}". Please try again.`);
      return;
    }

    const { data: deleted, error: rowError } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meeting.id)
      .select("id");
    setDeletingId(null);
    if (rowError || !deleted?.length) {
      toast.error(`Couldn't delete "${meeting.title}". Please try again.`);
      return;
    }

    setDeletedIds((current) => [...current, meeting.id]);
    toast.success(`Deleted "${meeting.title}"`);
    router.refresh();
  };

  return (
    <Card className="overflow-hidden shadow-none">
      <RefreshWhile active={meetings.some(isInProgress)} />
      <ul className="divide-y">
        {meetings.map((meeting) => (
          <li
            key={meeting.id}
            className="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-5"
          >
            <div className="hidden size-9 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
              <FileAudio className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              {/* The link covers the whole row; the buttons sit above it. */}
              <Link
                href={`/dashboard/meetings/${meeting.id}`}
                className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {meeting.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDate(meeting.created_at)} ·{" "}
                {formatFileSize(meeting.file_size)}
              </p>
            </div>
            {meeting.status === "failed" && (
              <RetryTranscriptionButton
                meetingId={meeting.id}
                title={meeting.title}
                className="relative hidden sm:inline-flex"
              />
            )}
            <StatusBadge status={meeting.status} />
            <div className="relative">
              <DeleteMeetingButton
                meeting={meeting}
                isDeleting={deletingId === meeting.id}
                onDelete={() => remove(meeting)}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
