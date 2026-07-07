// Real ImageProvider - renders actual PNG cards via ffmpeg (color background
// + drawtext) instead of a placeholder.co URL. Not a generative AI image
// model, but a genuinely rendered, unique file per character/shot/project.
// TODO(real-provider): swap renderCard() calls for an OpenAI image
// generation request using character.referenceImagePrompts.front /
// shot.imagePrompt, keeping the same return shapes.

import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ImageProvider } from "@/lib/providers/types";
import { renderCard } from "@/lib/render/card";
import { paletteToHex } from "@/lib/render/colors";
import { projectDir, toPublicUrl } from "@/lib/render/paths";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

export const realImageProvider: ImageProvider = {
  async generateCharacterReference(projectId, character) {
    const dir = await projectDir(projectId, "characters");
    const filePath = path.join(dir, `${slugify(character.name)}-${randomUUID().slice(0, 8)}.png`);
    const { primary, secondary } = paletteToHex(character.colorPalette, character.name);

    await renderCard({
      width: 768,
      height: 768,
      backgroundHex: primary,
      panelHex: secondary,
      title: character.name,
      subtitle: character.role,
      body: character.visualDescription,
      outPath: filePath,
    });

    return { referenceImageUrl: toPublicUrl(filePath) };
  },

  async generateStoryboardPanel(projectId, shot, panelNumber, styleGuide) {
    const dir = await projectDir(projectId, "panels");
    const filePath = path.join(dir, `panel-${shot.shotNumber}-${randomUUID().slice(0, 8)}.png`);
    const { primary, secondary } = paletteToHex(styleGuide.colorPalette, `panel-${shot.shotNumber}`);

    await renderCard({
      width: 1920,
      height: 1080,
      backgroundHex: primary,
      panelHex: secondary,
      title: `Shot ${shot.shotNumber}`,
      subtitle: shot.cameraMovement,
      body: shot.action,
      outPath: filePath,
    });

    return {
      panelNumber,
      framing: shot.cameraMovement.split(",")[0]?.trim() ?? "Medium shot",
      background: styleGuide.backgroundRules,
      characterPlacement: shot.characters.join(", ") || "Center frame",
      action: shot.action,
      expression: "Warm and expressive",
      notes: `Panel for shot ${shot.shotNumber} (${shot.timestampStart}-${shot.timestampEnd})`,
      imageUrl: toPublicUrl(filePath),
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
