// Mock ImageProvider - character reference art + storyboard panel frames.
// TODO(real-provider): call the OpenAI (or other) image generation API using
// character.referenceImagePrompts.front / shot.imagePrompt as the prompt, and
// return the resulting hosted image URL in place of the placeholder below.

import type { DraftShot, DraftStoryboardPanel, ImageProvider } from "@/lib/providers/types";
import { delay, mockPlaceholderImage } from "@/lib/providers/mock/shared";

export const mockImageProvider: ImageProvider = {
  async generateCharacterReference(character) {
    await delay(500);
    return { referenceImageUrl: mockPlaceholderImage(character.name, `${character.name} reference`) };
  },

  async generateStoryboardPanel(shot: DraftShot, panelNumber: number, styleGuide): Promise<DraftStoryboardPanel> {
    await delay(250);
    return {
      panelNumber,
      framing: shot.cameraMovement.split(",")[0]?.trim() ?? "Medium shot",
      background: styleGuide.backgroundRules,
      characterPlacement: shot.characters.join(", ") || "Center frame",
      action: shot.action,
      expression: "Warm and expressive",
      notes: `Panel for shot ${shot.shotNumber} (${shot.timestampStart}-${shot.timestampEnd})`,
      imageUrl: mockPlaceholderImage(`panel-${shot.shotNumber}`, `Panel ${panelNumber}`),
    };
  },

  async generateThumbnail(projectTitle: string) {
    await delay(200);
    return mockPlaceholderImage(projectTitle, projectTitle);
  },
};
