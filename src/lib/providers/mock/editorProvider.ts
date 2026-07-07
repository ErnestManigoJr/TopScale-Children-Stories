// Mock EditorProvider - automated FFmpeg-based assembly for the MVP, plus a
// DaVinci Resolve XML/EDL export plan for professional finishing later.
// TODO(real-provider): shell out to an actual ffmpeg binary (or a server-side
// render queue) using the generated concat command, and write a real
// CMX3600 EDL / FCPXML instead of the pseudo-plan text below.

import type { Shot } from "@/lib/types";
import type { AssembledTimeline, EditorProvider, FinalExportResult } from "@/lib/providers/types";
import { delay, mockPlaceholderVideo } from "@/lib/providers/mock/shared";
import { formatSecondsAsDuration, parseTimestampToSeconds } from "@/lib/time";

export const mockEditorProvider: EditorProvider = {
  async assembleTimeline(_projectId: string, shots: Shot[]): Promise<AssembledTimeline> {
    await delay(500);
    const ordered = [...shots].sort((a, b) => a.shotNumber - b.shotNumber);
    const clipOrder = ordered.map((s) => s.renderedClipUrl ?? mockPlaceholderVideo(`shot-${s.shotNumber}-missing`));

    const ffmpegInputs = clipOrder.map((url) => `file '${url}'`).join("\n");
    const ffmpegCommand =
      `# concat-list.txt\n${ffmpegInputs}\n\n` +
      `ffmpeg -f concat -safe 0 -i concat-list.txt -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac final-cartoon.mp4`;

    const edlLines = ordered.map(
      (s, i) =>
        `${(i + 1).toString().padStart(3, "0")}  AX  V  C  ${s.timestampStart} ${s.timestampEnd} ${s.timestampStart} ${s.timestampEnd}\n* FROM CLIP NAME: shot-${s.shotNumber}`
    );
    const edlPlan = `TITLE: Soup Stack Cartoon Export\nFCM: NON-DROP FRAME\n\n${edlLines.join("\n\n")}`;

    const lastShot = ordered[ordered.length - 1];
    const totalDuration = lastShot ? formatSecondsAsDuration(parseTimestampToSeconds(lastShot.timestampEnd)) : "0:00";

    return { ffmpegCommand, edlPlan, totalDuration, clipOrder };
  },

  async exportFinalVideo(projectId: string, timeline: AssembledTimeline): Promise<FinalExportResult> {
    await delay(600);
    return {
      videoUrl: mockPlaceholderVideo(`project-${projectId}-assembled`),
      duration: timeline.totalDuration,
      resolution: "1920x1080",
      fps: 30,
    };
  },
};
