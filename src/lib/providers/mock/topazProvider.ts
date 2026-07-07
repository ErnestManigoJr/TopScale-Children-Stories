// Mock TopazProvider - final enhancement/cleanup stage only. Runs after the
// FFmpeg/DaVinci assembly and before final export. Never touches story,
// characters, animation, or lip-sync - only resolution, noise, stability,
// flicker, sharpness, and (optionally) frame interpolation.
//
// TODO(real-provider): call the real Topaz Video AI CLI/API with `input`,
// then poll its job status from getEnhancementStatus() instead of the
// in-memory job store.

import type {
  TopazAnalysisReport,
  TopazEnhancedVideo,
  TopazEnhancementInput,
  TopazEnhancementJob,
  TopazEnhancementStatus,
} from "@/lib/types";
import type { TopazProvider } from "@/lib/providers/types";
import { delay, mockPlaceholderVideo } from "@/lib/providers/mock/shared";
import { readJob, registerJob } from "@/lib/providers/jobStore";

const SOURCE_RESOLUTION = "1280x720";
const SOURCE_FPS = 24;

export const mockTopazProvider: TopazProvider = {
  async analyzeVideo(videoUrl: string): Promise<TopazAnalysisReport> {
    await delay(400);
    const belowFullHd = true; // MVP mock clips are always sub-1080p placeholders.
    const detectedIssues = ["Minor AI render noise", "Slight motion flicker between shots"];

    const recommendedSettings: TopazEnhancementInput = {
      projectId: "",
      videoUrl,
      targetResolution: "1080p",
      targetFps: 30,
      upscale: belowFullHd,
      denoise: true,
      stabilize: detectedIssues.some((i) => i.toLowerCase().includes("jitter") || i.toLowerCase().includes("motion")),
      deFlicker: true,
      sharpen: "light",
      frameInterpolation: "light",
      preserveCartoonTexture: true,
    };

    return {
      videoUrl,
      resolution: SOURCE_RESOLUTION,
      fps: SOURCE_FPS,
      duration: 112,
      detectedIssues,
      recommendedSettings,
    };
  },

  async enhanceVideo(input: TopazEnhancementInput): Promise<TopazEnhancementJob> {
    await delay(500);
    const estimatedOutputResolution = input.targetResolution === "4K" ? "3840x2160" : "1920x1080";
    const jobId = registerJob("topaz", {
      status: "completed",
      outputUrl: mockPlaceholderVideo(`${input.projectId}-topaz-enhanced`),
      progress: 100,
    });
    return { jobId, status: "completed", inputVideoUrl: input.videoUrl, estimatedOutputResolution };
  },

  async getEnhancementStatus(jobId: string): Promise<TopazEnhancementStatus> {
    const job = readJob(jobId);
    if (!job) return { jobId, status: "failed", progress: 0, message: "Enhancement job not found" };
    return {
      jobId,
      status: job.status === "completed" ? "completed" : "processing",
      progress: job.progress,
      message:
        job.status === "completed"
          ? "Cleaning and polishing final cartoon... done."
          : "Cleaning and polishing final cartoon...",
    };
  },

  async exportEnhancedVideo(jobId: string): Promise<TopazEnhancedVideo> {
    await delay(300);
    const job = readJob(jobId);
    return {
      jobId,
      enhancedVideoUrl: job?.outputUrl ?? mockPlaceholderVideo(`${jobId}-topaz-enhanced`),
      resolution: "1920x1080",
      fps: 30,
      notes: [
        "Upscaled to 1080p",
        "Denoised and lightly sharpened",
        "De-flickered between shot transitions",
        "Cartoon clay-like texture preserved - no plastic over-smoothing applied",
      ],
    };
  },
};
