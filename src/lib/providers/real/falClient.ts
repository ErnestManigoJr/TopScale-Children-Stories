// Thin wrapper around the fal.ai client for real AI-generated character art
// (FLUX.1 schnell) and real AI-animated video (Kling 2.1 standard,
// image-to-video). Requires FAL_KEY in the environment - see .env.example.
// Sign up / get a key at https://fal.ai/dashboard/keys, and add credits at
// https://fal.ai/dashboard/billing (the API is pay-per-generation, no
// subscription).

import { fal } from "@fal-ai/client";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const credentials = process.env.FAL_KEY;
  if (!credentials) {
    throw new Error("FAL_KEY is not set - add it to .env (see .env.example). Get a key at https://fal.ai/dashboard/keys");
  }
  fal.config({ credentials });
  configured = true;
}

// Our shot/character prompts repeat every cast member's full visual
// description for consistency (good for a human-readable production
// packet), which can run to several thousand characters for multi-character
// shots - far past what image/video generation APIs accept as a prompt
// (observed as a bare "Unprocessable Entity" 422 from Kling with no useful
// detail). Truncate defensively at a word boundary before sending anything
// to a real model; the full untruncated text still lives in the DB/export.
const MAX_PROMPT_LENGTH = 800;

export function truncatePrompt(text: string, maxLength = MAX_PROMPT_LENGTH): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeFalError(error: unknown): string {
  const body = (error as { body?: unknown })?.body;
  const detail = body && typeof body === "object" && "detail" in body ? (body as { detail: unknown }).detail : body;
  const message = error instanceof Error ? error.message : String(error);
  return detail ? `${message}: ${JSON.stringify(detail)}` : message;
}

// fal's client throws with just the HTTP status text (e.g. "Unprocessable
// Entity") in .message - the actually useful detail lives in .body, and
// transient infra hiccups (observed: fal's Kling backend occasionally
// failing to fetch a just-generated Flux image, or a one-off 500) are common
// enough to be worth a few retries rather than failing the whole pipeline
// run over a blip. Genuinely permanent errors (bad prompt, exhausted
// balance) just fail fast after burning a couple of retries - the detailed
// message still explains why.
async function callFal<T>(call: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await call();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await delay(1500 * attempt);
    }
  }
  throw new Error(describeFalError(lastError));
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

/** Generates a still image via FLUX.1 [schnell] (fast, cheap text-to-image). */
export async function generateImage(prompt: string, aspectRatio: "square" | "landscape" = "square"): Promise<GeneratedImage> {
  ensureConfigured();
  const result = await callFal(() =>
    fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: truncatePrompt(prompt),
        image_size: aspectRatio === "landscape" ? "landscape_16_9" : "square_hd",
      },
    })
  );
  const data = result.data as { images: GeneratedImage[] };
  const image = data.images[0];
  if (!image?.url) throw new Error("fal.ai flux/schnell returned no image");
  return image;
}

/** Duration Kling image-to-video actually supports - round to the nearer option. */
export function nearestKlingDuration(seconds: number): "5" | "10" {
  return seconds <= 7.5 ? "5" : "10";
}

export interface GeneratedVideo {
  url: string;
  durationSeconds: number;
}

/** Animates a still image via Kling 2.1 (standard) image-to-video. */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  negativePrompt: string,
  targetDurationSeconds: number
): Promise<GeneratedVideo> {
  ensureConfigured();
  const duration = nearestKlingDuration(targetDurationSeconds);
  const result = await callFal(() =>
    fal.subscribe("fal-ai/kling-video/v2.1/standard/image-to-video", {
      input: {
        prompt: truncatePrompt(prompt),
        image_url: imageUrl,
        duration,
        negative_prompt: truncatePrompt(negativePrompt, 400),
      },
    })
  );
  const data = result.data as { video: { url: string } };
  if (!data.video?.url) throw new Error("fal.ai Kling returned no video");
  return { url: data.video.url, durationSeconds: Number(duration) };
}
