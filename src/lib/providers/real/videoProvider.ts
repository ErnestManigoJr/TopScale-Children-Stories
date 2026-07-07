// Real VideoProvider - Kling stand-in. Renders an actual Ken-Burns-animated
// MP4 clip per shot (still card + gentle zoom + narration TTS or silence)
// instead of returning a fake placeholder URL.
// TODO(real-provider): call the Kling API with shot.videoPrompt +
// shot.negativePrompt + characterReferenceUrls as conditioning images in
// place of renderCard()/renderClip(), keeping the same return shape.

import path from "node:path";
import { randomUUID } from "node:crypto";
import type { VideoProvider } from "@/lib/providers/types";
import { renderCard } from "@/lib/render/card";
import { renderClip } from "@/lib/render/clip";
import { paletteToHex } from "@/lib/render/colors";
import { projectDir, toPublicUrl } from "@/lib/render/paths";
import { parseTimestampToSeconds } from "@/lib/time";

export const realVideoProvider: VideoProvider = {
  async renderShot(projectId, shot, _characterReferenceUrls, styleGuide) {
    const framesDir = await projectDir(projectId, "frames");
    const clipsDir = await projectDir(projectId, "clips");
    const framePath = path.join(framesDir, `shot-${shot.shotNumber}.png`);
    const clipPath = path.join(clipsDir, `shot-${shot.shotNumber}.mp4`);

    const { primary, secondary } = paletteToHex(styleGuide.colorPalette, `shot-${shot.shotNumber}`);
    await renderCard({
      width: 1920,
      height: 1080,
      backgroundHex: primary,
      panelHex: secondary,
      title: shot.characters.join(" & ") || "Scene",
      subtitle: shot.cameraMovement,
      body: shot.action,
      outPath: framePath,
    });

    const durationSeconds = parseTimestampToSeconds(shot.duration) || 6;

    await renderClip({
      imagePath: framePath,
      outPath: clipPath,
      durationSeconds,
      speechText: shot.narration ?? undefined,
      voice: "slt",
      width: 1920,
      height: 1080,
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
