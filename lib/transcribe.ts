import "server-only";

import type { MeetingSummary } from "@/lib/meetings";
import { SUMMARIZE_MEETING_SYSTEM_PROMPT } from "@/lib/prompts/summarize-meeting";
import OpenAI, { toFile } from "openai";
import type { Response } from "openai/resources/responses/responses";

// OpenAI's low-cost text model: "our most efficient model for focused,
// high-volume tasks", and it supports Structured Outputs.
const SUMMARY_MODEL = "gpt-6-luna";

let openaiClient: OpenAI | undefined;

// Reads OPENAI_API_KEY. Gives up after 4 minutes without retrying, so the
// API routes (300 seconds max) still have time to mark the meeting as failed.
// Created on first use, not when the file loads, so `next build` works
// without the key.
function getOpenAI(): OpenAI {
  openaiClient ??= new OpenAI({ timeout: 4 * 60 * 1000, maxRetries: 0 });
  return openaiClient;
}

/**
 * Turns an audio file into transcript text. The file name's extension
 * (.mp3, .m4a, .wav) tells OpenAI which audio format it is.
 */
export async function transcribeAudio(
  audio: Blob,
  fileName: string,
): Promise<string> {
  const transcription = await getOpenAI().audio.transcriptions.create({
    file: await toFile(audio, fileName),
    model: "gpt-transcribe",
  });
  return transcription.text;
}

// Strict Structured Outputs: every field is required, nothing extra is
// allowed, and "no owner" / "no date" come back as null.
const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    decisions: { type: "array", items: { type: "string" } },
    action_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          task: { type: "string" },
          owner: { type: ["string", "null"] },
          due: { type: ["string", "null"] },
        },
        required: ["task", "owner", "due"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "decisions", "action_items"],
  additionalProperties: false,
};

/** Why an answer can't be used, or null if it's fine. */
function findProblem(response: Response): string | null {
  if (response.status === "incomplete") {
    return `cut off (${response.incomplete_details?.reason ?? "unknown reason"})`;
  }
  for (const item of response.output) {
    if (item.type !== "message") continue;
    for (const part of item.content) {
      if (part.type === "refusal") return `refused: ${part.refusal}`;
    }
  }
  if (!response.output_text.trim()) return "empty answer";
  return null;
}

/**
 * Summarizes a transcript into a summary, decisions and action items.
 * Tries once more if the model refuses or the answer is empty or cut off.
 */
export async function summarizeTranscript(
  transcript: string,
): Promise<MeetingSummary> {
  let lastProblem = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await getOpenAI().responses.create(
      {
        model: SUMMARY_MODEL,
        reasoning: { effort: "low" },
        // Reasoning counts toward this limit too; OpenAI suggests leaving
        // 25,000 tokens so the answer is never cut off.
        max_output_tokens: 25_000,
        input: [
          { role: "system", content: SUMMARIZE_MEETING_SYSTEM_PROMPT },
          { role: "user", content: transcript },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "meeting_summary",
            strict: true,
            schema: SUMMARY_SCHEMA,
          },
        },
      },
      // Two attempts of at most 2 minutes each fit inside the route's limit.
      { timeout: 2 * 60 * 1000 },
    );

    const problem = findProblem(response);
    if (!problem) {
      try {
        return JSON.parse(response.output_text) as MeetingSummary;
      } catch {
        lastProblem = "answer was not valid JSON";
      }
    } else {
      lastProblem = problem;
    }
    console.warn(`Summary attempt ${attempt} failed: ${lastProblem}`);
  }

  throw new Error(`Couldn't summarize the transcript: ${lastProblem}`);
}
