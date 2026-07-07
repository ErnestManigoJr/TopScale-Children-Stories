import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Installed locally via `winget install Gyan.FFmpeg`. Falls back to plain
// "ffmpeg"/"ffprobe" (relying on PATH) if this machine-specific path doesn't
// exist - e.g. on a different machine or after a version bump.
const KNOWN_FFMPEG_BIN =
  "C:\\Users\\ernes\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin";

function resolveBin(name: "ffmpeg" | "ffprobe"): string {
  const exe = path.join(KNOWN_FFMPEG_BIN, `${name}.exe`);
  return existsSync(exe) ? exe : name;
}

export const FFMPEG_PATH = resolveBin("ffmpeg");
export const FFPROBE_PATH = resolveBin("ffprobe");

export async function runFfmpeg(args: string[], options?: { cwd?: string }): Promise<void> {
  try {
    await execFileAsync(FFMPEG_PATH, ["-y", "-hide_banner", "-loglevel", "error", ...args], {
      maxBuffer: 1024 * 1024 * 64,
      cwd: options?.cwd,
    });
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr;
    throw new Error(`ffmpeg failed: ${stderr ?? (error instanceof Error ? error.message : String(error))}`);
  }
}

export async function probeDurationSeconds(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync(FFPROBE_PATH, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const seconds = parseFloat(stdout.trim());
  return Number.isFinite(seconds) ? seconds : 0;
}

export async function probeResolutionAndFps(filePath: string): Promise<{ width: number; height: number; fps: number }> {
  const { stdout } = await execFileAsync(FFPROBE_PATH, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate",
    "-of",
    "csv=p=0",
    filePath,
  ]);
  const [width, height, frameRate] = stdout.trim().split(",");
  const [num, den] = (frameRate ?? "30/1").split("/").map(Number);
  return {
    width: parseInt(width, 10) || 1920,
    height: parseInt(height, 10) || 1080,
    fps: den ? Math.round(num / den) : 30,
  };
}

/** Escapes a single line of text for safe use inside an ffmpeg filtergraph
 * option value quoted with single quotes (drawtext text=, flite text=, ...). */
export function escapeFilterValue(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’")
    .replace(/%/g, "\\%");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Wraps text to maxCharsPerLine and escapes it into a single drawtext-ready
 * string, using drawtext's own literal "\n" line-break escape sequence. */
export function drawtextParagraph(text: string, maxCharsPerLine: number): string {
  return wrapText(text, maxCharsPerLine).map(escapeFilterValue).join("\\n");
}

/** Escapes a single-line label (no wrapping/newlines) for a drawtext argument. */
export function drawtextLabel(text: string): string {
  return escapeFilterValue(text.replace(/\s+/g, " ").trim());
}
