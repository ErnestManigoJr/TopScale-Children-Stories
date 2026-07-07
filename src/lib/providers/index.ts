// Single place the pipeline runner imports providers from. Swapping a mock
// for a real integration later means changing only the import on the right
// -hand side of one of these lines.

import { mockStoryProvider } from "@/lib/providers/mock/storyProvider";
import { mockImageProvider } from "@/lib/providers/mock/imageProvider";
import { mockVideoProvider } from "@/lib/providers/mock/videoProvider";
import { mockLipSyncProvider } from "@/lib/providers/mock/lipSyncProvider";
import { mockEditorProvider } from "@/lib/providers/mock/editorProvider";
import { mockTopazProvider } from "@/lib/providers/mock/topazProvider";

// TODO(real-provider): storyProvider -> OpenAI/Anthropic chat completions
export const storyProvider = mockStoryProvider;
// TODO(real-provider): imageProvider -> OpenAI image generation API
export const imageProvider = mockImageProvider;
// TODO(real-provider): videoProvider -> Kling API
export const videoProvider = mockVideoProvider;
// TODO(real-provider): lipSyncProvider -> HeyGen API
export const lipSyncProvider = mockLipSyncProvider;
// TODO(real-provider): editorProvider -> server-side ffmpeg / DaVinci Resolve export
export const editorProvider = mockEditorProvider;
// TODO(real-provider): topazProvider -> Topaz Video AI CLI/API
export const topazProvider = mockTopazProvider;

export * from "@/lib/providers/types";
