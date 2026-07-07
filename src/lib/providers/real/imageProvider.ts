// Real ImageProvider - generates actual AI cartoon character/scene art via
// FLUX.1 [schnell] (fal.ai), so Kling has a real illustrated frame to
// animate instead of a text card. Thumbnail stays on the free local ffmpeg
// card renderer since it's cosmetic, not part of the cartoon itself.
// Requires FAL_KEY - see src/lib/providers/real/falClient.ts.

import path from "node:path";
import type { ImageProvider } from "@/lib/providers/types";
import { generateImage } from "@/lib/providers/real/falClient";
import { renderCard } from "@/lib/render/card";
import { paletteToHex } from "@/lib/render/colors";
import { projectDir, toPublicUrl } from "@/lib/render/paths";

export const realImageProvider: ImageProvider = {
  async generateCharacterReference(_projectId, character) {
    const prompt =
      `${character.referenceImagePrompts.front || character.visualDescription}, ` +
      `soft colorful 3D cartoon, clay-like texture, rounded child-friendly shapes, bright warm lighting, ` +
      `expressive face, simple clean background, full body character turnaround`;
    const image = await generateImage(prompt, "square");
    return { referenceImageUrl: image.url };
  },

  async generateStoryboardPanel(projectId, shot, panelNumber, styleGuide) {
    const image = await generateImage(shot.imagePrompt, "landscape");
    return {
      panelNumber,
      framing: shot.cameraMovement.split(",")[0]?.trim() ?? "Medium shot",
      background: styleGuide.backgroundRules,
      characterPlacement: shot.characters.join(", ") || "Center frame",
      action: shot.action,
      expression: "Warm and expressive",
      notes: `Panel for shot ${shot.shotNumber} (${shot.timestampStart}-${shot.timestampEnd})`,
      imageUrl: image.url,
    };
  },

  async generateThumbnail(projectId, projectTitle) {
    const dir = await projectDir(projectId, "thumbnail");
    const filePath = path.join(dir, "thumbnail.png");
    const { primary, secondary } = paletteToHex([], projectTitle);
    await renderCard({
      width: 1280,
      height: 720,
      backgroundHex: primary,
      panelHex: secondary,
      title: projectTitle,
      outPath: filePath,
    });
    return toPublicUrl(filePath);
  },
};
