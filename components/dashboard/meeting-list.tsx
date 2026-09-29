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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatFileSize } from "@/lib/format";
import {
  RECORDINGS_BUCKET,
  type Meeting,
  type MeetingStatus,
} from "@/lib/meetings";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { FileAudio, Loader2, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const statusStyles: Record<MeetingStatus, { label: string; dot: string }> = {
  uploaded: { label: "Uploaded", dot: "bg-muted-foreground" },
  transcribing: { label: "Transcribing", dot: "bg-brand animate-pulse" },
  done: { label: "Done", dot: "bg-emerald-500" },
  failed: { label: "Failed", dot: "bg-destructive" },
};

function StatusBadge({ status }: { status: MeetingStatus }) {
  const { label, dot } = statusStyles[status];

  return (
    <Badge variant="outline" className="shrink-0 gap-1.5 font-normal">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}

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
  const [meetings, setMeetings] = useState(initialMeetings);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    setMeetings((current) => current.filter((m) => m.id !== meeting.id));
    toast.success(`Deleted "${meeting.title}"`);
    router.refresh();
  };

  return (
    <Card className="shadow-none">
      <ul className="divide-y">
        {meetings.map((meeting) => (
          <li
            key={meeting.id}
            className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5"
          >
            <div className="hidden size-9 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
              <FileAudio className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{meeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(meeting.created_at)} ·{" "}
                {formatFileSize(meeting.file_size)}
              </p>
            </div>
            <StatusBadge status={meeting.status} />
            <DeleteMeetingButton
              meeting={meeting}
              isDeleting={deletingId === meeting.id}
              onDelete={() => remove(meeting)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
