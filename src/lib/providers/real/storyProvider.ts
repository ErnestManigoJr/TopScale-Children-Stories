// Real StoryProvider - actual Claude-generated story, character bible, and
// shot list (via forced tool-use for reliable structured output), instead of
// filled-in templates. Style guide and prompt-restamping stay on the
// deterministic mock implementations, since the visual style is fixed by
// product spec (no variation) and restamping is pure mechanical string
// building, not creative writing.

import type Anthropic from "@anthropic-ai/sdk";
import type {
  DraftCharacter,
  DraftShot,
  DraftStory,
  SafeStoryResult,
  StoryProvider,
} from "@/lib/providers/types";
import { callWithTool } from "@/lib/providers/real/anthropicClient";
import { mockStoryProvider } from "@/lib/providers/mock/storyProvider";
import { buildImagePrompt, buildNegativePrompt, buildReferencePrompts, buildVideoPrompt } from "@/lib/providers/mock/shared";

const CHILD_SAFETY_RULES = `Every story must be automatically rewritten to be child-safe. Rules: no sexual content, no
adult romance, no realistic violence, no weapons, no horror, no disturbing faces, no gore, no dangerous
instructions, no bullying as entertainment, no hate, no profanity, no political persuasion, no medical/legal/
financial advice to children, no manipulative advertising, no fear-based messaging, no realistic self-harm, no
unsafe stunts, no dark psychological content. If the rough idea is unsafe, rewrite it into a safe, gentle,
child-friendly version while keeping the harmless core intent (e.g. a conflict becomes a friendly
misunderstanding, danger becomes a silly obstacle, fear becomes curiosity, fighting becomes teamwork).`;

const STORY_STRUCTURE = `Structure the 1-2 minute cartoon script using this exact timing:
0:00-0:10 Hook
0:10-0:30 Character setup
0:30-0:55 Problem appears
0:55-1:25 Character tries to solve it
1:25-1:45 Resolution
1:45-2:00 Happy ending, lesson, or musical button
Keep it bright, simple, visual, and easy to animate.`;

interface SafeStoryToolResult {
  title: string;
  safeStoryIdea: string;
  ageRange: string;
  lesson: string;
  logline: string;
  fullScript: string;
  narration: string;
  dialogue: string;
  moral: string;
  runtimeEstimate: string;
  safetyNotes: string[];
}

interface CharacterBibleToolResult {
  characters: Array<{
    name: string;
    role: string;
    personality: string;
    visualDescription: string;
    colorPalette: string[];
    clothing: string;
    faceShape: string;
    expressions: string[];
    movementStyle: string;
    voiceStyle: string;
    catchphrase: string;
  }>;
}

interface ShotListToolResult {
  shots: Array<{
    shotNumber: number;
    timestampStart: string;
    timestampEnd: string;
    duration: string;
    sceneDescription: string;
    characters: string[];
    action: string;
    cameraMovement: string;
    dialogue: string | null;
    narration: string | null;
    needsLipSync: boolean;
  }>;
}

const stringArraySchema = { type: "array", items: { type: "string" } } as const;

export const realStoryProvider: StoryProvider = {
  async generateSafeStory({ originalUserInput }): Promise<SafeStoryResult> {
    const result = await callWithTool<SafeStoryToolResult>({
      system:
        `You are the story brain for Soup Stack, an app that turns a rough idea into a finished 1-2 minute ` +
        `child-safe animated cartoon short. ${CHILD_SAFETY_RULES} ${STORY_STRUCTURE}`,
      prompt: `Rough story idea from the user: "${originalUserInput}"\n\nWrite the complete cartoon package.`,
      toolName: "generate_safe_story",
      toolDescription: "Generates a complete child-safe 1-2 minute cartoon story from a rough idea.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Cartoon title" },
          safeStoryIdea: { type: "string", description: "The child-safe rewritten story summary, 2-4 sentences" },
          ageRange: { type: "string", description: 'Target age range, e.g. "3-7"' },
          lesson: { type: "string", description: "The moral/lesson in one sentence" },
          logline: { type: "string", description: "One-sentence logline" },
          fullScript: { type: "string", description: "Full script using the six-beat timing structure with timestamps" },
          narration: { type: "string", description: "Short narration summary of the whole story" },
          dialogue: { type: "string", description: "Key dialogue lines, formatted as Name: \"line\" per line" },
          moral: { type: "string", description: "Same as lesson, restated" },
          runtimeEstimate: { type: "string", description: 'Estimated runtime like "1:52"' },
          safetyNotes: { ...stringArraySchema, description: "1-2 short notes on what was adjusted for child safety" },
        },
        required: [
          "title",
          "safeStoryIdea",
          "ageRange",
          "lesson",
          "logline",
          "fullScript",
          "narration",
          "dialogue",
          "moral",
          "runtimeEstimate",
          "safetyNotes",
        ],
      } satisfies Anthropic.Tool["input_schema"],
    });

    const story: DraftStory = {
      title: result.title,
      logline: result.logline,
      fullScript: result.fullScript,
      narration: result.narration,
      dialogue: result.dialogue,
      moral: result.moral,
      runtimeEstimate: result.runtimeEstimate,
      safetyNotes: result.safetyNotes,
    };

    return {
      title: result.title,
      safeStoryIdea: result.safeStoryIdea,
      ageRange: result.ageRange,
      lesson: result.lesson,
      story,
    };
  },

  async generateCharacterBible(story: DraftStory): Promise<DraftCharacter[]> {
    const result = await callWithTool<CharacterBibleToolResult>({
      system:
        `You design characters for Soup Stack cartoons. Every character must be simple enough for consistent ` +
        `AI image generation: a soft colorful 3D cartoon with clay-like texture, rounded child-friendly shapes. ` +
        `Design 2-3 characters (one hero, one or two friends) for the given story.`,
      prompt: `Story:\nTitle: ${story.title}\nLogline: ${story.logline}\nFull script:\n${story.fullScript}`,
      toolName: "generate_character_bible",
      toolDescription: "Generates the character bible (2-3 characters) for a cartoon story.",
      inputSchema: {
        type: "object",
        properties: {
          characters: {
            type: "array",
            minItems: 2,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                role: { type: "string" },
                personality: { type: "string" },
                visualDescription: { type: "string", description: "Clay-like 3D cartoon visual description" },
                colorPalette: { ...stringArraySchema, description: "2-3 color names" },
                clothing: { type: "string" },
                faceShape: { type: "string" },
                expressions: { ...stringArraySchema, description: "3-4 expression words" },
                movementStyle: { type: "string" },
                voiceStyle: { type: "string" },
                catchphrase: { type: "string" },
              },
              required: [
                "name",
                "role",
                "personality",
                "visualDescription",
                "colorPalette",
                "clothing",
                "faceShape",
                "expressions",
                "movementStyle",
                "voiceStyle",
                "catchphrase",
              ],
            },
          },
        },
        required: ["characters"],
      } satisfies Anthropic.Tool["input_schema"],
    });

    return result.characters.map((c) => ({
      ...c,
      referenceImagePrompts: buildReferencePrompts({ ...c, referenceImageUrl: null } as DraftCharacter),
      referenceImageUrl: null,
    }));
  },

  // Deliberately deterministic: the product spec fixes the visual style with
  // no user-facing variation, so there's nothing for an LLM to creatively add.
  generateStyleGuide: mockStoryProvider.generateStyleGuide,

  async generateShotList(story, characters, styleGuide): Promise<DraftShot[]> {
    const characterNames = characters.map((c) => c.name);
    const result = await callWithTool<ShotListToolResult>({
      system:
        `You break a cartoon script into a shot list for animation. Use only these characters: ` +
        `${characterNames.join(", ")}. Produce 8-14 short, simple, practical shots covering the whole script in ` +
        `order, with timestamps that don't overlap and cover 0:00 through the script's runtime. Only set ` +
        `needsLipSync=true when a character speaks a direct line to camera; use narration instead where possible ` +
        `to reduce lip-sync shots.`,
      prompt: `Story:\nTitle: ${story.title}\nFull script:\n${story.fullScript}\nDialogue:\n${story.dialogue}`,
      toolName: "generate_shot_list",
      toolDescription: "Generates the shot-by-shot breakdown for animating a cartoon script.",
      inputSchema: {
        type: "object",
        properties: {
          shots: {
            type: "array",
            minItems: 8,
            maxItems: 14,
            items: {
              type: "object",
              properties: {
                shotNumber: { type: "integer" },
                timestampStart: { type: "string", description: 'e.g. "0:00"' },
                timestampEnd: { type: "string", description: 'e.g. "0:08"' },
                duration: { type: "string", description: 'e.g. "8s"' },
                sceneDescription: { type: "string" },
                characters: { ...stringArraySchema, description: "Names of characters present in this shot" },
                action: { type: "string" },
                cameraMovement: { type: "string", description: "Framing + camera movement, e.g. \"Wide shot, slow push-in\"" },
                dialogue: { type: ["string", "null"], description: 'Format: Name: "line", or null' },
                narration: { type: ["string", "null"] },
                needsLipSync: { type: "boolean" },
              },
              required: [
                "shotNumber",
                "timestampStart",
                "timestampEnd",
                "duration",
                "sceneDescription",
                "characters",
                "action",
                "cameraMovement",
                "dialogue",
                "narration",
                "needsLipSync",
              ],
            },
          },
        },
        required: ["shots"],
      } satisfies Anthropic.Tool["input_schema"],
    });

    return result.shots.map((s): DraftShot => {
      const cast = characters.filter((c) => s.characters.includes(c.name));
      return {
        shotNumber: s.shotNumber,
        timestampStart: s.timestampStart,
        timestampEnd: s.timestampEnd,
        duration: s.duration,
        sceneDescription: s.sceneDescription,
        characters: s.characters,
        action: s.action,
        cameraMovement: s.cameraMovement,
        dialogue: s.dialogue,
        narration: s.narration,
        needsLipSync: s.needsLipSync,
        imagePrompt: buildImagePrompt(s.action, cast, styleGuide),
        videoPrompt: buildVideoPrompt(s.action, cast),
        negativePrompt: buildNegativePrompt(),
        referenceImageUrls: [],
        renderedClipUrl: null,
        renderStatus: "pending",
        qualityStatus: "pending",
        qualityNotes: [],
      };
    });
  },

  // Deliberately deterministic: pure mechanical prompt-string rebuilding once
  // reference art exists, not creative writing.
  restampShotPrompts: mockStoryProvider.restampShotPrompts,
};
