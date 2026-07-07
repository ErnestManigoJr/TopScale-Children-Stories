import { drawtextLabel, drawtextParagraph, runFfmpeg } from "@/lib/render/ffmpeg";

const FONT_REGULAR = "C\\:/Windows/Fonts/segoeui.ttf";
const FONT_BOLD = "C\\:/Windows/Fonts/segoeuib.ttf";

export interface CardSpec {
  width: number;
  height: number;
  backgroundHex: string;
  panelHex: string;
  title: string;
  subtitle?: string;
  body?: string;
  outPath: string;
}

/**
 * Renders a single still-frame "card" PNG: solid background, a lighter
 * rounded panel, and title/subtitle/body drawtext - used both as standalone
 * character/storyboard art and as the source frame for Ken Burns video clips.
 */
export async function renderCard(spec: CardSpec): Promise<void> {
  const { width, height, backgroundHex, panelHex, title, subtitle, body, outPath } = spec;
  const panelX = Math.round(width * 0.08);
  const panelY = Math.round(height * 0.14);
  const panelW = Math.round(width * 0.84);
  const panelH = Math.round(height * 0.72);

  const titleSize = Math.round(height * 0.075);
  const subtitleSize = Math.round(height * 0.04);
  const bodySize = Math.round(height * 0.032);

  const filters: string[] = [
    `drawbox=x=${panelX}:y=${panelY}:w=${panelW}:h=${panelH}:color=${panelHex}@0.92:t=fill`,
    `drawtext=fontfile='${FONT_BOLD}':text='${drawtextLabel(title)}':fontcolor=white:fontsize=${titleSize}:x=(w-text_w)/2:y=${panelY + Math.round(panelH * 0.16)}`,
  ];

  if (subtitle) {
    filters.push(
      `drawtext=fontfile='${FONT_REGULAR}':text='${drawtextLabel(subtitle)}':fontcolor=white@0.9:fontsize=${subtitleSize}:x=(w-text_w)/2:y=${panelY + Math.round(panelH * 0.38)}`
    );
  }

  if (body) {
    filters.push(
      `drawtext=fontfile='${FONT_REGULAR}':text='${drawtextParagraph(body, 42)}':fontcolor=white@0.85:fontsize=${bodySize}:line_spacing=10:x=(w-text_w)/2:y=${panelY + Math.round(panelH * 0.55)}`
    );
  }

  await runFfmpeg([
    "-f",
    "lavfi",
    "-i",
    `color=c=${backgroundHex}:s=${width}x${height}:d=1`,
    "-vf",
    filters.join(","),
    "-frames:v",
    "1",
    outPath,
  ]);
}
