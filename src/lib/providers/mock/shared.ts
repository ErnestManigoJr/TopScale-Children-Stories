// Shared constants and small helpers used across every mock provider so that
// style, safety, and consistency language stays identical no matter which
// stage of the pipeline is generating a prompt.

export const DEFAULT_VISUAL_STYLE =
  "Soft colorful 3D cartoon with clay-like texture, rounded child-friendly shapes, bright warm lighting, " +
  "expressive faces, gentle playful motion, clean backgrounds, smooth TV-cartoon movement, consistent characters, " +
  "cheerful atmosphere, no scary imagery.";

export const KLING_POSITIVE_STYLE =
  "soft colorful 3D cartoon, clay-like texture, rounded child-friendly shapes, bright warm lighting, " +
  "expressive face, gentle playful motion, clean safe kids animation style, smooth TV-cartoon motion, " +
  "consistent character design";

export const KLING_NEGATIVE_STYLE =
  "no horror, no violence, no weapons, no realistic injury, no adult themes, no scary faces, " +
  "no dark disturbing imagery, no text artifacts, no extra limbs, no distorted hands, no flicker, " +
  "no warped face, no inconsistent outfit, no character identity drift";

export const SAMPLE_STORY_INPUT =
  "A tiny soup bowl wants to fly like a rocket but learns that making friends warm and happy is already special.";

export function isSampleInput(input: string): boolean {
  return input.trim().toLowerCase() === SAMPLE_STORY_INPUT.toLowerCase();
}

/** Simulates network/render latency for mock providers. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const UNSAFE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(kill|murder|slay)\b/gi, replacement: "surprise" },
  { pattern: /\b(gun|knife|weapon|sword|blade)\b/gi, replacement: "magic wand" },
  { pattern: /\b(blood|gore|gory)\b/gi, replacement: "sparkles" },
  { pattern: /\b(scary|terrify|terrifying|horror|monster)\b/gi, replacement: "silly" },
  { pattern: /\b(hate|stupid|dumb|idiot)\b/gi, replacement: "grumpy" },
  { pattern: /\b(die|death|dead|dying)\b/gi, replacement: "sleepy" },
  { pattern: /\b(fight|attack|hurt|punch)\b/gi, replacement: "race" },
  { pattern: /\b(damn|hell|crap)\b/gi, replacement: "oh no" },
];

/** Very small heuristic child-safety rewrite for the MVP mock story brain. */
export function makeChildSafe(input: string): string {
  let safe = input;
  for (const { pattern, replacement } of UNSAFE_REPLACEMENTS) {
    safe = safe.replace(pattern, replacement);
  }
  return safe.trim();
}

const STOP_WORDS = new Set(["a", "an", "the", "tiny", "little", "small", "young", "old"]);

export function deriveHeroName(input: string): string {
  const words = input
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean);
  const candidate = words.find((w) => !STOP_WORDS.has(w.toLowerCase())) ?? "Hero";
  return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
}

const TITLE_TEMPLATES: Array<(hero: string) => string> = [
  (h) => `${h} and the Big Dream`,
  (h) => `${h}'s Big Adventure`,
  (h) => `The Day ${h} Learned to Shine`,
  (h) => `${h} and the Happy Surprise`,
];

/** Deliberately never splices raw premise text into the title - the premise
 * can contain the hero's own name or awkward phrasing, which previously
 * produced nonsense like "The Barn Who The Barn Talent Show Everyone". */
export function deriveTitle(heroName: string, safeStoryIdea: string): string {
  const index = safeStoryIdea.length % TITLE_TEMPLATES.length;
  return TITLE_TEMPLATES[index](heroName);
}

let idCounter = 0;
export function mockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function mockPlaceholderImage(seed: string, label: string): string {
  const encoded = encodeURIComponent(label);
  return `https://placehold.co/768x768/png?text=${encoded}&seed=${encodeURIComponent(seed)}`;
}

export function mockPlaceholderVideo(seed: string): string {
  // TODO(real-provider): replace with the actual rendered clip URL returned by Kling/HeyGen.
  return `/mock-media/clip-${encodeURIComponent(seed)}.mp4`;
}

import type { DraftCharacter, DraftStyleGuide } from "@/lib/providers/types";

/** Builds the "repeat every time" consistency block for one character in a shot. */
export function describeCastMember(character: DraftCharacter): string {
  const ref = character.referenceImageUrl ? `, reference image: ${character.referenceImageUrl}` : "";
  return (
    `${character.name} (${character.visualDescription}, wearing ${character.clothing}, ` +
    `color palette: ${character.colorPalette.join(", ")}, clay-like texture, ` +
    `expression: ${character.expressions[0] ?? "warm and friendly"}, movement style: ${character.movementStyle}${ref})`
  );
}

export function buildCastBlock(cast: DraftCharacter[]): string {
  return cast.map(describeCastMember).join("; ");
}

export function buildImagePrompt(action: string, cast: DraftCharacter[], styleGuide: DraftStyleGuide): string {
  return `${action}. Characters: ${buildCastBlock(cast)}. ${styleGuide.artDirection}`;
}

export function buildVideoPrompt(action: string, cast: DraftCharacter[]): string {
  return `${action}. Characters: ${buildCastBlock(cast)}. Style: ${KLING_POSITIVE_STYLE}.`;
}

export function buildNegativePrompt(): string {
  return KLING_NEGATIVE_STYLE;
}
