// Real LipSyncProvider - HeyGen stand-in. Renders an actual MP4 clip with
// spoken dialogue (via ffmpeg's built-in libflite TTS) instead of a fake
// placeholder URL. Each character gets a consistent voice across shots.
// TODO(real-provider): call the HeyGen API with character voice/avatar
// settings + dialogue text in place of renderCard()/renderClip(), keeping
// the same return shape.

import path from "node:path";
import { randomUUID } from "node:crypto";
import type { LipSyncProvider } from "@/lib/providers/types";
import { renderCard } from "@/lib/render/card";
import { renderClip, voiceForCharacter } from "@/lib/render/clip";
import { paletteToHex } from "@/lib/render/colors";
import { projectDir, toPublicUrl } from "@/lib/render/paths";
import { parseTimestampToSeconds } from "@/lib/time";

// Dialogue lines are authored as `Name: "text"` - strip the label/quotes so
// only the spoken words reach the TTS engine.
function stripSpeakerLabel(dialogue: string, name: string): string {
  const prefix = `${name}:`;
  const withoutPrefix = dialogue.startsWith(prefix) ? dialogue.slice(prefix.length).trim() : dialogue;
  return withoutPrefix.replace(/^"|"$/g, "").replace(/"/g, "");
}

export const realLipSyncProvider: LipSyncProvider = {
  async renderSpeakingShot(projectId, shot, character, dialogue) {
    const framesDir = await projectDir(projectId, "frames");
    const clipsDir = await projectDir(projectId, "clips");
    const framePath = path.join(framesDir, `shot-${shot.shotNumber}.png`);
    const clipPath = path.join(clipsDir, `shot-${shot.shotNumber}.mp4`);

    const spokenLine = stripSpeakerLabel(dialogue, character.name);
    const { primary, secondary } = paletteToHex(character.colorPalette, character.name);

    await renderCard({
      width: 1920,
      height: 1080,
      backgroundHex: primary,
      panelHex: secondary,
      title: character.name,
      subtitle: shot.cameraMovement,
      body: spokenLine,
      outPath: framePath,
    });

    const durationSeconds = parseTimestampToSeconds(shot.duration) || 6;

    await renderClip({
      imagePath: framePath,
      outPath: clipPath,
      durationSeconds,
      speechText: spokenLine,
      voice: voiceForCharacter(character.name),
      width: 1920,
      height: 1080,
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
