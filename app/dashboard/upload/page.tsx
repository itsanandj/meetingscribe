import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="Upload"
        description="Add a meeting recording to transcribe and summarise."
      />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>New recording</CardTitle>
          <CardDescription>MP3, WAV or M4A, up to 25 MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="recording">Audio file</Label>
          <Input id="recording" type="file" accept=".mp3,.wav,.m4a,audio/*" />
        </CardContent>
        <CardFooter className="justify-between gap-4 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            Uploading is coming soon.
          </p>
          <Button disabled>Upload</Button>
        </CardFooter>
      </Card>
    </>
  );
}
