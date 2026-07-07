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

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

/** Generates a still image via FLUX.1 [schnell] (fast, cheap text-to-image). */
export async function generateImage(prompt: string, aspectRatio: "square" | "landscape" = "square"): Promise<GeneratedImage> {
  ensureConfigured();
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: aspectRatio === "landscape" ? "landscape_16_9" : "square_hd",
    },
  });
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
  const result = await fal.subscribe("fal-ai/kling-video/v2.1/standard/image-to-video", {
    input: {
      prompt,
      image_url: imageUrl,
      duration,
      negative_prompt: negativePrompt,
    },
  });
  const data = result.data as { video: { url: string } };
  if (!data.video?.url) throw new Error("fal.ai Kling returned no video");
  return { url: data.video.url, durationSeconds: Number(duration) };
}
