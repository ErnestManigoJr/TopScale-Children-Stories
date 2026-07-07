// Real EditorProvider - actually concatenates the per-shot MP4 clips (in
// shot order) into one assembled video via ffmpeg's concat demuxer. The
// DaVinci Resolve EDL export plan is still a text plan (no DaVinci
// automation exists locally), ready to hand to a real edit later.
// TODO(real-provider): keep this as the MVP assembly layer even after
// swapping Video/LipSync providers for Kling/HeyGen - it only depends on
// shot.renderedClipUrl pointing at a real file, whatever produced it.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Shot } from "@/lib/types";
import type { AssembledTimeline, EditorProvider, FinalExportResult } from "@/lib/providers/types";
import { probeDurationSeconds, runFfmpeg } from "@/lib/render/ffmpeg";
import { fromPublicUrl, projectDir, toPublicUrl } from "@/lib/render/paths";
import { formatSecondsAsDuration, parseTimestampToSeconds } from "@/lib/time";

export const realEditorProvider: EditorProvider = {
  async assembleTimeline(projectId, shots: Shot[]): Promise<AssembledTimeline> {
    const ordered = [...shots].sort((a, b) => a.shotNumber - b.shotNumber);
    const clipOrder = ordered.map((s) => s.renderedClipUrl).filter((url): url is string => Boolean(url));

    const dir = await projectDir(projectId, "final");
    const listPath = path.join(dir, "concat-list.txt");
    // Use paths relative to `dir` (ffmpeg runs with cwd=dir) rather than
    // absolute paths - the concat demuxer's list file has its own quote
    // parsing, which breaks if the absolute path contains a literal single
    // quote (e.g. a folder named "Children's Stories").
    const listContent = clipOrder
      .map((url) => `file '${path.relative(dir, fromPublicUrl(url)).split(path.sep).join("/")}'`)
      .join("\n");
    await writeFile(listPath, listContent, "utf-8");

    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i concat-list.txt -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac assembled.mp4`;

    const edlLines = ordered.map(
      (s, i) =>
        `${(i + 1).toString().padStart(3, "0")}  AX  V  C  ${s.timestampStart} ${s.timestampEnd} ${s.timestampStart} ${s.timestampEnd}\n* FROM CLIP NAME: shot-${s.shotNumber}`
    );
    const edlPlan = `TITLE: Soup Stack Cartoon Export\nFCM: NON-DROP FRAME\n\n${edlLines.join("\n\n")}`;

    const lastShot = ordered[ordered.length - 1];
    const totalDuration = lastShot ? formatSecondsAsDuration(parseTimestampToSeconds(lastShot.timestampEnd)) : "0:00";

    return { ffmpegCommand, edlPlan, totalDuration, clipOrder };
  },

  async exportFinalVideo(projectId: string): Promise<FinalExportResult> {
    const dir = await projectDir(projectId, "final");
    const outPath = path.join(dir, "assembled.mp4");

    // Run with cwd=dir and relative filenames so ffmpeg's own argv handling
    // (fine with apostrophes) is all that's involved - the concat list's
    // *contents* are the only thing that needed relative paths.
    await runFfmpeg(
      [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "concat-list.txt",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "30",
        "-c:a",
        "aac",
        "assembled.mp4",
      ],
      { cwd: dir }
    );

    const durationSeconds = await probeDurationSeconds(outPath);

    return {
      videoUrl: toPublicUrl(outPath),
      duration: formatSecondsAsDuration(durationSeconds),
      resolution: "1920x1080",
      fps: 30,
    };
  },
};
