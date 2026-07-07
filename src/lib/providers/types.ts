// Provider abstraction layer. Every external AI service Soup Stack depends on
// (story/character brain, image gen, animation, lip-sync, editing, cleanup)
// is hidden behind one of these interfaces. The pipeline runner only ever
// talks to these interfaces, never to a concrete vendor SDK directly - so
// swapping a mock for a real provider later means writing one new file, not
// touching the pipeline.

import type {
  Character,
  RenderStatus,
  Shot,
  Story,
  StoryboardPanel,
  StyleGuide,
  TopazAnalysisReport,
  TopazEnhancedVideo,
  TopazEnhancementInput,
  TopazEnhancementJob,
  TopazEnhancementStatus,
} from "@/lib/types";

export type DraftStory = Omit<Story, "id" | "projectId">;
export type DraftCharacter = Omit<Character, "id" | "projectId">;
export type DraftStyleGuide = Omit<StyleGuide, "id" | "projectId">;
export type DraftShot = Omit<Shot, "id" | "projectId">;
export type DraftStoryboardPanel = Omit<StoryboardPanel, "id" | "projectId" | "shotId">;

export interface SafeStoryResult {
  safeStoryIdea: string;
  ageRange: string;
  lesson: string;
  title: string;
  story: DraftStory;
}

/** Story brain: turns a rough idea into a full child-safe cartoon script. */
export interface StoryProvider {
  generateSafeStory(input: { originalUserInput: string }): Promise<SafeStoryResult>;
  generateCharacterBible(story: DraftStory): Promise<DraftCharacter[]>;
  generateStyleGuide(story: DraftStory, characters: DraftCharacter[]): Promise<DraftStyleGuide>;
  generateShotList(
    story: DraftStory,
    characters: DraftCharacter[],
    styleGuide: DraftStyleGuide
  ): Promise<DraftShot[]>;
  /** Re-stamps a shot's prompts once character reference art exists, so every
   * animation prompt repeats the character's name/description/outfit/palette
   * and now also its reference image URL. */
  restampShotPrompts(
    shot: DraftShot,
    cast: DraftCharacter[],
    styleGuide: DraftStyleGuide
  ): Promise<{ imagePrompt: string; videoPrompt: string; referenceImageUrls: string[] }>;
}

/** Character reference art + storyboard frames (ChatGPT image generation abstraction). */
export interface ImageProvider {
  generateCharacterReference(
    projectId: string,
    character: DraftCharacter,
    styleGuide: DraftStyleGuide
  ): Promise<{ referenceImageUrl: string }>;
  generateStoryboardPanel(
    projectId: string,
    shot: DraftShot,
    panelNumber: number,
    styleGuide: DraftStyleGuide
  ): Promise<DraftStoryboardPanel>;
  generateThumbnail(projectId: string, projectTitle: string): Promise<string>;
}

export interface RenderJobHandle {
  jobId: string;
  status: RenderStatus;
  outputUrl?: string;
  error?: string;
}

/** Kling abstraction: animates non-speaking / action shots. */
export interface VideoProvider {
  renderShot(
    projectId: string,
    shot: DraftShot,
    characterReferenceUrls: string[],
    styleGuide: DraftStyleGuide
  ): Promise<RenderJobHandle>;
  getRenderStatus(jobId: string): Promise<RenderJobHandle>;
}

/** HeyGen abstraction: renders shots where a character speaks with lip-sync. */
export interface LipSyncProvider {
  renderSpeakingShot(
    projectId: string,
    shot: DraftShot,
    character: DraftCharacter,
    dialogue: string
  ): Promise<RenderJobHandle>;
  getRenderStatus(jobId: string): Promise<RenderJobHandle>;
}

export interface AssembledTimeline {
  ffmpegCommand: string;
  edlPlan: string;
  totalDuration: string;
  clipOrder: string[];
}

export interface FinalExportResult {
  videoUrl: string;
  duration: string;
  resolution: string;
  fps: number;
}

/** FFmpeg-based MVP assembly + DaVinci Resolve XML/EDL export for pro finishing. */
export interface EditorProvider {
  assembleTimeline(projectId: string, shots: Shot[]): Promise<AssembledTimeline>;
  exportFinalVideo(projectId: string, timeline: AssembledTimeline): Promise<FinalExportResult>;
}

/**
 * Topaz Video AI abstraction - final enhancement/cleanup stage only.
 * Runs after FFmpeg/DaVinci assembly and before final export. Upscales,
 * denoises, stabilizes and lightly sharpens the assembled cartoon without
 * touching story, characters, animation, or lip-sync.
 */
export interface TopazProvider {
  analyzeVideo(videoUrl: string): Promise<TopazAnalysisReport>;
  enhanceVideo(input: TopazEnhancementInput): Promise<TopazEnhancementJob>;
  getEnhancementStatus(jobId: string): Promise<TopazEnhancementStatus>;
  exportEnhancedVideo(jobId: string): Promise<TopazEnhancedVideo>;
}
