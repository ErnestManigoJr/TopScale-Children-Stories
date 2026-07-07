// Real VideoProvider - actual Kling stand-in. Generates a real AI cartoon
// scene image (FLUX.1 schnell) and animates it with Kling 2.1
// (image-to-video), then muxes narration/dialogue TTS on top locally.
// Requires FAL_KEY with billing set up - see src/lib/providers/real/falClient.ts.

import path from "node:path";
import { randomUUID } from "node:crypto";
import type { VideoProvider } from "@/lib/providers/types";
import { generateImage, generateVideoFromImage } from "@/lib/providers/real/falClient";
import { muxAudioOntoVideo } from "@/lib/render/clip";
import { downloadFile } from "@/lib/render/download";
import { projectDir, toPublicUrl } from "@/lib/render/paths";
import { parseTimestampToSeconds } from "@/lib/time";

export const realVideoProvider: VideoProvider = {
  async renderShot(projectId, shot) {
    const clipsDir = await projectDir(projectId, "clips");
    const rawClipPath = path.join(clipsDir, `shot-${shot.shotNumber}-raw.mp4`);
    const clipPath = path.join(clipsDir, `shot-${shot.shotNumber}.mp4`);

    const sceneImage = await generateImage(shot.imagePrompt, "landscape");

    const plannedDuration = parseTimestampToSeconds(shot.duration) || 6;
    const animated = await generateVideoFromImage(sceneImage.url, shot.videoPrompt, shot.negativePrompt, plannedDuration);

    await downloadFile(animated.url, rawClipPath);
    await muxAudioOntoVideo({
      videoPath: rawClipPath,
      outPath: clipPath,
      durationSeconds: animated.durationSeconds,
      speechText: shot.narration ?? undefined,
      voice: "slt",
      fps: 30,
    });

    return {
      jobId: `kling-${shot.shotNumber}-${randomUUID().slice(0, 8)}`,
      status: "completed",
      outputUrl: toPublicUrl(clipPath),
    };
  },

  async getRenderStatus(jobId) {
    return { jobId, status: "completed" };
  },
};
