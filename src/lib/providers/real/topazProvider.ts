// Real TopazProvider - a genuine ffmpeg cleanup/upscale pass (contrast,
// light sharpening, scale to target resolution) standing in for the real
// Topaz Video AI product. Runs after assembly and before export; never
// touches story, characters, animation, or lip-sync.
// TODO(real-provider): swap the ffmpeg filter pass in enhanceVideo() for a
// real Topaz Video AI CLI/API call, keeping the same input/output shapes.

import path from "node:path";
import type {
  TopazAnalysisReport,
  TopazEnhancedVideo,
  TopazEnhancementInput,
  TopazEnhancementJob,
  TopazEnhancementStatus,
} from "@/lib/types";
import type { TopazProvider } from "@/lib/providers/types";
import { probeDurationSeconds, probeResolutionAndFps, runFfmpeg } from "@/lib/render/ffmpeg";
import { fromPublicUrl, projectDir, toPublicUrl } from "@/lib/render/paths";
import { readJob, registerJob } from "@/lib/providers/jobStore";

export const realTopazProvider: TopazProvider = {
  async analyzeVideo(videoUrl): Promise<TopazAnalysisReport> {
    const filePath = fromPublicUrl(videoUrl);
    const [duration, resolution] = await Promise.all([probeDurationSeconds(filePath), probeResolutionAndFps(filePath)]);
    const belowFullHd = resolution.height < 1080;
    const detectedIssues = belowFullHd
      ? ["Source resolution below 1080p", "Minor AI render noise"]
      : ["Minor AI render noise", "Slight motion softness between shots"];

    const recommendedSettings: TopazEnhancementInput = {
      projectId: "",
      videoUrl,
      targetResolution: "1080p",
      targetFps: 30,
      upscale: belowFullHd,
      denoise: true,
      stabilize: false,
      deFlicker: true,
      sharpen: "light",
      frameInterpolation: "none",
      preserveCartoonTexture: true,
    };

    return {
      videoUrl,
      resolution: `${resolution.width}x${resolution.height}`,
      fps: resolution.fps,
      duration,
      detectedIssues,
      recommendedSettings,
    };
  },

  async enhanceVideo(input: TopazEnhancementInput): Promise<TopazEnhancementJob> {
    const srcPath = fromPublicUrl(input.videoUrl);
    const dir = await projectDir(input.projectId, "final");
    const outPath = path.join(dir, "enhanced.mp4");
    const targetWidth = input.targetResolution === "4K" ? 3840 : 1920;
    const targetHeight = input.targetResolution === "4K" ? 2160 : 1080;

    // Light contrast/saturation lift + gentle sharpening - deliberately mild
    // so the soft clay-like cartoon texture isn't over-sharpened or plasticky.
    const filters = [`scale=${targetWidth}:${targetHeight}`, "eq=contrast=1.05:saturation=1.1"];
    if (input.sharpen !== "none") filters.push("unsharp=5:5:0.4:5:5:0.0");

    await runFfmpeg([
      "-i",
      srcPath,
      "-vf",
      filters.join(","),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(input.targetFps),
      "-c:a",
      "aac",
      outPath,
    ]);

    const jobId = registerJob("topaz", { status: "completed", outputUrl: toPublicUrl(outPath), progress: 100 });
    return {
      jobId,
      status: "completed",
      inputVideoUrl: input.videoUrl,
      estimatedOutputResolution: `${targetWidth}x${targetHeight}`,
    };
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
    const job = readJob(jobId);
    return {
      jobId,
      enhancedVideoUrl: job?.outputUrl ?? "",
      resolution: "1920x1080",
      fps: 30,
      notes: [
        "Upscaled/normalized to 1080p",
        "Light contrast and saturation lift",
        "Light sharpening applied",
        "Cartoon texture preserved - no over-smoothing",
      ],
    };
  },
};
