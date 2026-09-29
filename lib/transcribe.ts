import "server-only";

import OpenAI, { toFile } from "openai";

// Reads OPENAI_API_KEY. Gives up after 4 minutes without retrying, so the
// API route (300 seconds max) still has time to mark the meeting as failed.
const openai = new OpenAI({ timeout: 4 * 60 * 1000, maxRetries: 0 });

/**
 * Turns an audio file into transcript text. The file name's extension
 * (.mp3, .m4a, .wav) tells OpenAI which audio format it is.
 */
export async function transcribeAudio(
  audio: Blob,
  fileName: string,
): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: await toFile(audio, fileName),
    model: "gpt-transcribe",
  });
  return transcription.text;
}
