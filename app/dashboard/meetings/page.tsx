import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileAudio, Upload } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        title="Meetings"
        description="Transcripts and summaries of your recorded meetings."
      />
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
    </>
  );
}
