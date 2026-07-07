// Mock LipSyncProvider - HeyGen abstraction for shots where a character
// speaks directly to camera and needs lip-sync.
// TODO(real-provider): call the HeyGen API with character voice/avatar
// settings + dialogue text, then poll their render status from
// getRenderStatus() instead of the in-memory job store.

import type { LipSyncProvider, RenderJobHandle } from "@/lib/providers/types";
import { delay, mockPlaceholderVideo } from "@/lib/providers/mock/shared";
import { readJob, registerJob } from "@/lib/providers/mock/jobStore";

export const mockLipSyncProvider: LipSyncProvider = {
  async renderSpeakingShot(shot, character, dialogue) {
    await delay(500);
    const outputUrl = mockPlaceholderVideo(`shot-${shot.shotNumber}-heygen-${character.name}`);
    const jobId = registerJob("heygen", { status: "completed", outputUrl, progress: 100 });
    // TODO(real-provider): dialogue, character.voiceStyle, and expressions map
    // directly onto HeyGen's script + avatar + emotion parameters.
    void dialogue;
    return { jobId, status: "completed", outputUrl };
  },

  async getRenderStatus(jobId: string): Promise<RenderJobHandle> {
    const job = readJob(jobId);
    if (!job) return { jobId, status: "failed", error: "Lip-sync job not found" };
    return { jobId, status: job.status, outputUrl: job.outputUrl, error: job.error };
  },
};
