"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, FileAudio, Upload, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = ["mp3", "m4a", "wav"];
const MAX_BYTES = 25 * 1024 * 1024;

function validate(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `"${file.name}" isn't a supported file. Choose an MP3, M4A or WAV file.`;
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}" is ${formatFileSize(file.size)}. Files can be up to 25 MB.`;
  }
  if (file.size === 0) {
    return `"${file.name}" is empty. Choose a file with audio in it.`;
  }
  return null;
}

function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export function UploadForm() {
  const dragDepth = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const isUploading = status === "uploading";
  const finalTitle = title.trim() || (file ? stripExtension(file.name) : "");

  const selectFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const problem =
      files.length > 1 ? "Add one file at a time." : validate(files[0]);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(files[0]);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  // Fake upload: fills the progress bar over a few seconds. Nothing is sent.
  const startUpload = () => {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    let current = 0;
    setProgress(current);
    timer.current = setInterval(() => {
      current = Math.min(100, current + 4 + Math.random() * 8);
      setProgress(current);
      if (current >= 100 && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
        setStatus("done");
      }
    }, 150);
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setError(null);
    setProgress(0);
    setStatus("idle");
  };

  if (status === "done") {
    return (
      <Card className="shadow-none">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="size-5 text-brand" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-medium">&ldquo;{finalTitle}&rdquo; uploaded</h2>
            <p className="text-sm text-muted-foreground">
              Transcription will start shortly.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              Upload another
            </Button>
            <Button asChild>
              <Link href="/dashboard/meetings">View meetings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-6 pt-6">
        <label
          htmlFor="recording"
          onDragEnter={(e) => {
            e.preventDefault();
            if (isUploading) return;
            dragDepth.current += 1;
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = isUploading ? "none" : "copy";
          }}
          onDragLeave={() => {
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setIsDragging(false);
            if (!isUploading) selectFile(e.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
            isDragging
              ? "border-brand bg-brand/5"
              : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
            isUploading && "pointer-events-none opacity-50",
          )}
        >
          <input
            id="recording"
            type="file"
            accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav"
            className="sr-only"
            disabled={isUploading}
            onChange={(e) => {
              selectFile(e.target.files);
              e.target.value = "";
            }}
          />
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-full",
              isDragging ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
            )}
          >
            <Upload className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {isDragging
                ? "Drop to add your recording"
                : "Drag an audio file here, or click to choose"}
            </p>
            <p className="text-xs text-muted-foreground">
              MP3, M4A or WAV · up to 25 MB
            </p>
          </div>
        </label>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {file && (
          <div className="flex flex-col gap-3 rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              <FileAudio className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  onClick={clearFile}
                >
                  <X />
                </Button>
              )}
            </div>
            {isUploading && (
              <div className="flex items-center gap-3">
                <Progress
                  value={progress}
                  className="bg-brand/15 [&>div]:bg-brand"
                  aria-label="Upload progress"
                />
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">
            Title <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={file ? stripExtension(file.name) : "e.g. Weekly product sync"}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the file name.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-6">
        <Button onClick={startUpload} disabled={!file || isUploading}>
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </CardFooter>
    </Card>
  );
}
