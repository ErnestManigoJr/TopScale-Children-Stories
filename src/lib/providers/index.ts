// Single place the pipeline runner imports providers from. Swapping a
// provider for a real hosted integration later means changing only the
// import on the right-hand side of one of these lines.

import { realStoryProvider } from "@/lib/providers/real/storyProvider";
import { realImageProvider } from "@/lib/providers/real/imageProvider";
import { realVideoProvider } from "@/lib/providers/real/videoProvider";
import { realLipSyncProvider } from "@/lib/providers/real/lipSyncProvider";
import { realEditorProvider } from "@/lib/providers/real/editorProvider";
import { realTopazProvider } from "@/lib/providers/real/topazProvider";

// Real Claude-generated story/character bible/shot list (requires ANTHROPIC_API_KEY).
export const storyProvider = realStoryProvider;
// Real FLUX.1 [schnell] generated character/scene art (requires FAL_KEY).
export const imageProvider = realImageProvider;
// Real Kling 2.1 image-to-video animation + flite narration (requires FAL_KEY).
export const videoProvider = realVideoProvider;
// Kling animation + flite dialogue TTS, standing in for HeyGen (no real lip-sync yet).
// TODO(real-provider): swap for the HeyGen API for true lip-sync.
export const lipSyncProvider = realLipSyncProvider;
// Real ffmpeg concat assembly of the rendered shot clips.
export const editorProvider = realEditorProvider;
// Real ffmpeg cleanup/upscale pass, standing in for Topaz Video AI.
// TODO(real-provider): swap for the Topaz Video AI CLI/API.
export const topazProvider = realTopazProvider;

export * from "@/lib/providers/types";
