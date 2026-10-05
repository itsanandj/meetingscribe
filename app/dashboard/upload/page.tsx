import { PageHeader } from "@/components/dashboard/page-header";
import { UploadForm } from "@/components/dashboard/upload-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreditBalance } from "@/lib/credits";
import { meetingsFor } from "@/lib/plans";
import { Suspense } from "react";

async function Upload() {
  const meetingsLeft = meetingsFor(await getCreditBalance());
  return <UploadForm meetingsLeft={meetingsLeft} />;
}

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="Upload"
        description="Add a meeting recording to transcribe and summarise."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <Upload />
      </Suspense>
    </>
  );
}
