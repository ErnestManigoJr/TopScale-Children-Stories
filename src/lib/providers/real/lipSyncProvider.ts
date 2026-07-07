// Real LipSyncProvider - HeyGen stand-in. Kling doesn't do true lip-sync, so
// speaking shots get the same real Kling animation as action shots, with the
// character's dialogue spoken as TTS audio over it (a voiceover, not
// frame-accurate lip movement - an honest limitation given no dedicated
// lip-sync model is wired in yet).
// TODO(real-provider): swap for the actual HeyGen API for true lip-sync.

import path from "node:path";
import { randomUUID } from "node:crypto";
import type { LipSyncProvider } from "@/lib/providers/types";
import { generateImage, generateVideoFromImage } from "@/lib/providers/real/falClient";
import { muxAudioOntoVideo, voiceForCharacter } from "@/lib/render/clip";
import { downloadFile } from "@/lib/render/download";
import { projectDir, toPublicUrl } from "@/lib/render/paths";
import { parseTimestampToSeconds } from "@/lib/time";

function stripSpeakerLabel(dialogue: string, name: string): string {
  const prefix = `${name}:`;
  const withoutPrefix = dialogue.startsWith(prefix) ? dialogue.slice(prefix.length).trim() : dialogue;
  return withoutPrefix.replace(/^"|"$/g, "").replace(/"/g, "");
}

export const realLipSyncProvider: LipSyncProvider = {
  async renderSpeakingShot(projectId, shot, character, dialogue) {
    const clipsDir = await projectDir(projectId, "clips");
    const rawClipPath = path.join(clipsDir, `shot-${shot.shotNumber}-raw.mp4`);
    const clipPath = path.join(clipsDir, `shot-${shot.shotNumber}.mp4`);

    const spokenLine = stripSpeakerLabel(dialogue, character.name);
    const sceneImage = await generateImage(shot.imagePrompt, "landscape");

    const plannedDuration = parseTimestampToSeconds(shot.duration) || 6;
    const animated = await generateVideoFromImage(sceneImage.url, shot.videoPrompt, shot.negativePrompt, plannedDuration);

    await downloadFile(animated.url, rawClipPath);
    await muxAudioOntoVideo({
      videoPath: rawClipPath,
      outPath: clipPath,
      durationSeconds: animated.durationSeconds,
      speechText: spokenLine,
      voice: voiceForCharacter(character.name),
      fps: 30,
    });

    return {
      jobId: `heygen-${shot.shotNumber}-${randomUUID().slice(0, 8)}`,
      status: "completed",
      outputUrl: toPublicUrl(clipPath),
    };
  },

  async getRenderStatus(jobId) {
    return { jobId, status: "completed" };
  },
};
