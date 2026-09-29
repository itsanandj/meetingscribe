import { RECORDINGS_BUCKET } from "@/lib/meetings";
import { createClient } from "@/lib/supabase/client";
import * as tus from "tus-js-client";

// Supabase's resumable upload endpoint only accepts 6 MB chunks.
const CHUNK_SIZE = 6 * 1024 * 1024;

// Some browsers leave file.type empty for .m4a, which the bucket would reject.
const FALLBACK_CONTENT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

function resumableEndpoint() {
  const projectId = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(
    ".",
  )[0];
  return `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
}

function friendlyError(error: Error) {
  const status =
    error instanceof tus.DetailedError
      ? error.originalResponse?.getStatus()
      : undefined;
  if (status === 401 || status === 403) {
    return "You don't have permission to upload. Sign in again and retry.";
  }
  if (status === 413) return "That file is too large. Files can be up to 25 MB.";
  if (status === 415) return "That file type isn't supported.";
  return "The upload failed. Check your connection and try again.";
}

/**
 * Uploads a recording to USER_ID/RANDOM_ID.EXTENSION in the recordings bucket
 * with Supabase's resumable (tus) upload, and resolves with that path.
 */
export async function uploadRecording(
  file: File,
  {
    onProgress,
    signal,
  }: { onProgress: (percent: number) => void; signal?: AbortSignal },
): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("You're signed out. Sign in again and retry.");

  const userId = session.user.id;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  let objectName = `${userId}/${crypto.randomUUID()}.${extension}`;

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: resumableEndpoint(),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: RECORDINGS_BUCKET,
        objectName,
        contentType: file.type || FALLBACK_CONTENT_TYPES[extension] || "",
        cacheControl: "3600",
      },
      chunkSize: CHUNK_SIZE,
      onError: (error) => reject(new Error(friendlyError(error))),
      onProgress: (bytesUploaded, bytesTotal) =>
        onProgress((bytesUploaded / bytesTotal) * 100),
      onSuccess: () => resolve(objectName),
    });

    signal?.addEventListener("abort", () => {
      upload.abort();
      reject(new DOMException("Upload cancelled", "AbortError"));
    });

    upload.findPreviousUploads().then((previousUploads) => {
      // Pick up an interrupted upload of this same file by this same user.
      // It keeps the path it started with, so the meeting row points at it.
      const previous = previousUploads.find(
        (p) =>
          p.metadata.bucketName === RECORDINGS_BUCKET &&
          p.metadata.objectName?.startsWith(`${userId}/`),
      );
      if (previous) {
        objectName = previous.metadata.objectName;
        upload.options.metadata = { ...upload.options.metadata, objectName };
        upload.resumeFromPreviousUpload(previous);
      }
      upload.start();
    });
  });
}
