import { MeetingList } from "@/components/dashboard/meeting-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { mockMeetings } from "@/lib/mock-meetings";
import { Upload } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        title="Meetings"
        description="Transcripts and summaries of your recorded meetings."
        action={
          <Button asChild>
            <Link href="/dashboard/upload">
              <Upload />
              Upload
            </Link>
          </Button>
        }
      />
      <MeetingList initialMeetings={mockMeetings} />
    </>
  );
}
