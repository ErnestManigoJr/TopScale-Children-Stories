import { escapeFilterValue, runFfmpeg } from "@/lib/render/ffmpeg";

export interface ClipSpec {
  imagePath: string;
  outPath: string;
  durationSeconds: number;
  /** Line to speak via flite TTS. Omit for a silent (action-only) shot. */
  speechText?: string;
  /** flite voice name: kal, kal16, awb, rms, or slt. */
  voice?: string;
  width: number;
  height: number;
  fps: number;
}

/** Renders one shot's video clip: a still card image animated with a gentle
 * Ken Burns zoom, muxed with either TTS narration/dialogue (via ffmpeg's
 * built-in libflite) or silence, matching the shot's planned duration. */
export async function renderClip(spec: ClipSpec): Promise<void> {
  const { imagePath, outPath, durationSeconds, speechText, voice = "kal", width, height, fps } = spec;
  const clampedDuration = Math.max(1, durationSeconds);
  const frames = Math.max(2, Math.round(clampedDuration * fps));
  const videoFilter = `scale=${width}:${height},zoompan=z='min(zoom+0.0015,1.15)':d=${frames}:s=${width}x${height}:fps=${fps}`;

  const audioInput = speechText
    ? ["-f", "lavfi", "-i", `flite=text='${escapeFilterValue(speechText)}':voice=${voice}`]
    : ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"];

  await runFfmpeg([
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    imagePath,
    ...audioInput,
    "-filter_complex",
    `[0:v]${videoFilter}[v];[1:a]apad[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-t",
    String(clampedDuration),
    "-r",
    String(fps),
    "-fps_mode",
    "cfr",
    outPath,
  ]);
}

const VOICES = ["kal", "kal16", "awb", "rms", "slt"];

/** Deterministically picks a consistent flite voice per character name, so
 * the same character always sounds the same across shots. */
export function voiceForCharacter(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return VOICES[hash % VOICES.length];
}
