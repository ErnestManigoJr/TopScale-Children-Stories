// Single place the pipeline runner imports providers from. Swapping a
// provider for a real hosted integration later means changing only the
// import on the right-hand side of one of these lines.

import { mockStoryProvider } from "@/lib/providers/mock/storyProvider";
import { realImageProvider } from "@/lib/providers/real/imageProvider";
import { realVideoProvider } from "@/lib/providers/real/videoProvider";
import { realLipSyncProvider } from "@/lib/providers/real/lipSyncProvider";
import { realEditorProvider } from "@/lib/providers/real/editorProvider";
import { realTopazProvider } from "@/lib/providers/real/topazProvider";

// TODO(real-provider): storyProvider -> OpenAI/Anthropic chat completions.
// Text generation only, no rendering - the templated mock already produces
// full scripts/character bibles/shot lists, so it stays as-is.
export const storyProvider = mockStoryProvider;
// ffmpeg-rendered PNG cards (see src/lib/providers/real/imageProvider.ts).
// TODO(real-provider): swap for OpenAI image generation API.
export const imageProvider = realImageProvider;
// ffmpeg Ken-Burns clips + flite narration, standing in for Kling.
// TODO(real-provider): swap for the Kling API.
export const videoProvider = realVideoProvider;
// ffmpeg clips + flite dialogue TTS, standing in for HeyGen.
// TODO(real-provider): swap for the HeyGen API.
export const lipSyncProvider = realLipSyncProvider;
// Real ffmpeg concat assembly of the rendered shot clips.
// TODO(real-provider): swap for a hosted render queue if needed at scale.
export const editorProvider = realEditorProvider;
// Real ffmpeg cleanup/upscale pass, standing in for Topaz Video AI.
// TODO(real-provider): swap for the Topaz Video AI CLI/API.
export const topazProvider = realTopazProvider;

export * from "@/lib/providers/types";
