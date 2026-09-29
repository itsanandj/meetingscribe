import { PageHeader } from "@/components/dashboard/page-header";
import { UploadForm } from "@/components/dashboard/upload-form";

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="Upload"
        description="Add a meeting recording to transcribe and summarise."
      />
      <UploadForm />
    </>
  );
}
