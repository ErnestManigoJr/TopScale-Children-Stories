// Mock VideoProvider - Kling abstraction for animating non-speaking/action shots.
// TODO(real-provider): call the Kling image-to-video/video-generation API with
// shot.videoPrompt + shot.negativePrompt + characterReferenceUrls as
// conditioning images, then poll their job status endpoint from
// getRenderStatus() instead of the in-memory job store.

import type { RenderJobHandle, VideoProvider } from "@/lib/providers/types";
import { delay, mockPlaceholderVideo } from "@/lib/providers/mock/shared";
import { readJob, registerJob } from "@/lib/providers/mock/jobStore";

export const mockVideoProvider: VideoProvider = {
  async renderShot(shot) {
    await delay(400);
    const outputUrl = mockPlaceholderVideo(`shot-${shot.shotNumber}-kling`);
    const jobId = registerJob("kling", { status: "completed", outputUrl, progress: 100 });
    return { jobId, status: "completed", outputUrl };
  },

  async getRenderStatus(jobId: string): Promise<RenderJobHandle> {
    const job = readJob(jobId);
    if (!job) return { jobId, status: "failed", error: "Render job not found" };
    return { jobId, status: job.status, outputUrl: job.outputUrl, error: job.error };
  },
};
