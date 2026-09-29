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
import type { Meeting, MeetingStatus } from "@/lib/mock-meetings";
import { cn } from "@/lib/utils";
import { FileAudio, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  onDelete,
}: {
  meeting: Meeting;
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
        >
          <Trash2 />
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
  // Local state only: deleting is not saved, so a reload brings them back.
  const [meetings, setMeetings] = useState(initialMeetings);

  if (meetings.length === 0) return <EmptyState />;

  const remove = (id: string) =>
    setMeetings((current) => current.filter((m) => m.id !== id));

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
                {formatDate(meeting.uploadedAt)} ·{" "}
                {formatFileSize(meeting.sizeBytes)}
              </p>
            </div>
            <StatusBadge status={meeting.status} />
            <DeleteMeetingButton
              meeting={meeting}
              onDelete={() => remove(meeting.id)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
