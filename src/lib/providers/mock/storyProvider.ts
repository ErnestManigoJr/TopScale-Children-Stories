// Mock StoryProvider - the "story brain" of Soup Stack.
// TODO(real-provider): swap the bodies of these functions for calls to an
// OpenAI/Anthropic chat completion (structured output) using the same
// input/output shapes, so nothing else in the pipeline has to change.

import type {
  DraftCharacter,
  DraftShot,
  DraftStory,
  DraftStyleGuide,
  SafeStoryResult,
  StoryProvider,
} from "@/lib/providers/types";
import {
  buildImagePrompt,
  buildNegativePrompt,
  buildReferencePrompts,
  buildVideoPrompt,
  DEFAULT_VISUAL_STYLE,
  delay,
  deriveHeroName,
  deriveTitle,
  isSampleInput,
  KLING_NEGATIVE_STYLE,
  makeChildSafe,
} from "@/lib/providers/mock/shared";

const SOUP_ROCKET_SCRIPT = `0:00–10 HOOK
Simmer the little soup bowl spins on a sunny windowsill, eyes wide, dreaming of the big blue sky.

0:10–30 CHARACTER SETUP
Simmer bounces around the cozy kitchen, humming a rocket-launch song, showing off a shiny spoon tucked on its back like a fin.

0:30–55 PROBLEM APPEARS
Simmer climbs onto a fluffy cushion, counts down, and jumps... but only wobbles and plops onto the rug. No rockets today.

0:55–1:25 CHARACTER TRIES TO SOLVE IT
Just then, Simmer notices Basil the teacup shivering and Pepper the cushion looking a little blue. Instead of trying to fly again, Simmer scoots close and shares warm, cozy soup and a giggly song.

1:25–1:45 RESOLUTION
Basil and Pepper warm up and giggle, glowing with happiness. Simmer realizes that spreading warmth feels even better than zooming through clouds.

1:45–2:00 HAPPY ENDING / LESSON
The three friends cuddle together under the window as the sun sets, singing softly: "You don't need wings to shine so bright, just a warm heart and a happy light!" Simmer learns that being itself is already a superpower.`;

const SOUP_ROCKET_SAFE_STORY: SafeStoryResult = {
  title: "The Little Soup Rocket",
  safeStoryIdea:
    "A small smiling soup bowl dreams of zooming into the sky. It tries to become a rocket by wearing a spoon " +
    "as a fin and jumping from a cushion. It cannot fly, but when its friends feel chilly and sad, the little soup " +
    "bowl shares warmth, kindness, and a happy song. The soup bowl learns that being itself is already a superpower.",
  ageRange: "3-6",
  lesson: "Being yourself and sharing kindness is already a superpower.",
  story: {
    title: "The Little Soup Rocket",
    logline: "A little soup bowl dreams of becoming a rocket, and discovers warmth and kindness are the real magic.",
    fullScript: SOUP_ROCKET_SCRIPT,
    narration:
      "Simmer the soup bowl wants to be a rocket, but discovers that warmth, kindness, and a happy song are the real superpowers.",
    dialogue:
      'Simmer: "Three, two, one... whoosh?" *soft plop* "Okay, maybe I\'m not a rocket. But I know what I am!"\n' +
      'Basil: "Brrr, I\'m a little chilly today."\n' +
      'Simmer: "Let\'s warm you up with a happy song!"',
    moral: "Being yourself and sharing kindness is already a superpower.",
    runtimeEstimate: "1:52",
    safetyNotes: ["Original idea was already gentle; only lightly polished for pacing and warmth."],
  },
};

const SOUP_ROCKET_CHARACTERS: DraftCharacter[] = [
  {
    name: "Simmer",
    role: "Hero - a little soup bowl who dreams big",
    personality: "Bouncy, hopeful, kind-hearted, a little silly",
    visualDescription:
      "A round, warm-orange ceramic soup bowl with big glossy eyes and a wide, friendly smile, soft clay-like texture",
    colorPalette: ["warm orange", "cream", "soft red"],
    clothing: "A tiny shiny spoon worn on its back like a rocket fin",
    faceShape: "Round and full with rosy cheeks",
    expressions: ["hopeful", "determined", "surprised", "warm and joyful"],
    movementStyle: "Bouncy hops and gentle wobbles, like jelly settling",
    voiceStyle: "High, energetic, giggly",
    catchphrase: "Whoosh, watch me glow!",
    referenceImagePrompts: { front: "", side: "", expressionSheet: "", fullBody: "", lineup: "" },
    referenceImageUrl: null,
  },
  {
    name: "Basil",
    role: "Best friend - a gentle teacup",
    personality: "Soft-spoken, a little shy, warms up quickly",
    visualDescription:
      "A pale blue teacup character with a delicate curved handle for an arm and big round eyes, soft clay-like texture",
    colorPalette: ["pale blue", "white", "silver"],
    clothing: "A little knitted cup-cozy scarf",
    faceShape: "Oval and delicate",
    expressions: ["shivering", "cozy", "happy"],
    movementStyle: "Small careful steps with a gentle wobble",
    voiceStyle: "Soft, breathy, sweet",
    catchphrase: "Ooh, that's cozy!",
    referenceImagePrompts: { front: "", side: "", expressionSheet: "", fullBody: "", lineup: "" },
    referenceImageUrl: null,
  },
  {
    name: "Pepper",
    role: "Playful friend - a round cushion",
    personality: "Cheerful, snuggly, loyal",
    visualDescription:
      "A round golden-yellow cushion character with stitched-smile seams and stubby little arms, soft clay-like texture",
    colorPalette: ["golden yellow", "cream", "soft brown stitching"],
    clothing: "A tiny button in the middle like a belly button",
    faceShape: "Round and puffy",
    expressions: ["giggling", "sleepy", "warm"],
    movementStyle: "Soft bounces and happy little rolls",
    voiceStyle: "Warm, low giggle",
    catchphrase: "Squish and snuggle!",
    referenceImagePrompts: { front: "", side: "", expressionSheet: "", fullBody: "", lineup: "" },
    referenceImageUrl: null,
  },
];


function deriveLesson(heroName: string): string {
  return `${heroName} learns that being kind, warm, and true to yourself is its own kind of superpower.`;
}

function buildGenericStory(heroName: string, title: string, safeStoryIdea: string, lesson: string): DraftStory {
  const script = `0:00–10 HOOK
${heroName} looks out at the world, eyes sparkling with a brand new dream.

0:10–30 CHARACTER SETUP
${heroName} shows off its favorite silly trick to anyone nearby, giggling and full of energy.

0:30–55 PROBLEM APPEARS
${safeStoryIdea}

0:55–1:25 CHARACTER TRIES TO SOLVE IT
${heroName} tries a few brave, silly ideas, and a good friend shows up to help along the way.

1:25–1:45 RESOLUTION
${heroName} discovers a warmer, kinder way to solve the problem than expected, and everyone feels happy.

1:45–2:00 HAPPY ENDING / LESSON
${heroName} and its friend share a happy little song together. ${lesson}`;

  return {
    title,
    logline: `${heroName} chases a big dream and discovers something even better along the way.`,
    fullScript: script,
    narration: `${heroName} wants something big, but learns the real magic was kindness all along.`,
    dialogue: `${heroName}: "Let's give it a try!"\nFriend: "You've got this, friend!"`,
    moral: lesson,
    runtimeEstimate: "1:45",
    safetyNotes: [
      "Automatically rewritten to remove any unsafe themes and keep a gentle, encouraging tone.",
      "No violence, weapons, or scary imagery included.",
    ],
  };
}

function buildGenericCharacters(heroName: string): DraftCharacter[] {
  const hero: DraftCharacter = {
    name: heroName,
    role: "Hero of the story",
    personality: "Curious, brave-hearted, a little clumsy but always trying",
    visualDescription: "A cheerful round cartoon character with a soft clay-like texture, big expressive eyes, and a warm smile",
    colorPalette: ["warm coral", "cream", "soft yellow"],
    clothing: "A simple colorful outfit that matches its cheerful personality",
    faceShape: "Round and expressive",
    expressions: ["curious", "determined", "joyful", "surprised"],
    movementStyle: "Bouncy, energetic little hops",
    voiceStyle: "Bright, friendly, a little high-pitched",
    catchphrase: "Let's give it a try!",
    referenceImagePrompts: { front: "", side: "", expressionSheet: "", fullBody: "", lineup: "" },
    referenceImageUrl: null,
  };
  const friend: DraftCharacter = {
    name: "Buddy",
    role: "Loyal best friend",
    personality: "Warm, supportive, gentle",
    visualDescription: "A soft round cartoon companion with a clay-like texture and big kind eyes",
    colorPalette: ["soft teal", "cream", "light blue"],
    clothing: "A cozy little scarf",
    faceShape: "Soft and round",
    expressions: ["caring", "happy", "encouraging"],
    movementStyle: "Gentle, steady waddle",
    voiceStyle: "Warm, calm, reassuring",
    catchphrase: "You've got this, friend!",
    referenceImagePrompts: { front: "", side: "", expressionSheet: "", fullBody: "", lineup: "" },
    referenceImageUrl: null,
  };
  return [hero, friend];
}

type ShotBeat = {
  start: string;
  end: string;
  duration: string;
  framing: string;
  movement: string;
  action: (hero: string, friend: string) => string;
  dialogueLine?: (hero: string, friend: string) => string;
  narrationLine?: (hero: string, friend: string) => string;
  needsLipSync: boolean;
  castIndexes: number[];
};

const SHOT_BEATS: ShotBeat[] = [
  {
    start: "0:00",
    end: "0:08",
    duration: "8s",
    framing: "Wide establishing shot",
    movement: "Slow gentle push-in",
    action: (h) => `${h} gazes out at the world, eyes sparkling with a big new dream.`,
    narrationLine: (h) => `${h} had the biggest dream in the whole cozy kitchen.`,
    needsLipSync: false,
    castIndexes: [0],
  },
  {
    start: "0:08",
    end: "0:18",
    duration: "10s",
    framing: "Medium shot",
    movement: "Handheld-free pan following the character",
    action: (h) => `${h} bounces around happily, showing off a favorite silly trick.`,
    narrationLine: (h) => `${h} loved showing off its favorite silly trick.`,
    needsLipSync: false,
    castIndexes: [0],
  },
  {
    start: "0:18",
    end: "0:30",
    duration: "12s",
    framing: "Medium-close shot",
    movement: "Static with subtle bounce",
    action: (h) => `${h} sets up for a big attempt, taking a deep breath and counting down.`,
    dialogueLine: (h) => `${h}: "Three... two... one!"`,
    needsLipSync: true,
    castIndexes: [0],
  },
  {
    start: "0:30",
    end: "0:42",
    duration: "12s",
    framing: "Wide shot",
    movement: "Quick playful whip-pan",
    action: (h) => `${h} tries the big attempt, but it doesn't quite work out as planned - a gentle, funny stumble.`,
    narrationLine: (h) => `But it didn't quite go the way ${h} hoped.`,
    needsLipSync: false,
    castIndexes: [0],
  },
  {
    start: "0:42",
    end: "0:55",
    duration: "13s",
    framing: "Close-up",
    movement: "Slow push-in on face",
    action: (h) => `${h} sits for a moment, a little disappointed, but curious rather than sad.`,
    needsLipSync: false,
    castIndexes: [0],
  },
  {
    start: "0:55",
    end: "1:08",
    duration: "13s",
    framing: "Two-shot",
    movement: "Gentle side pan introducing the friend",
    action: (h, f) => `${h} notices ${f} nearby and has a warm new idea.`,
    narrationLine: (h, f) => `That's when ${h} noticed ${f} needed a little help.`,
    needsLipSync: false,
    castIndexes: [0, 1],
  },
  {
    start: "1:08",
    end: "1:20",
    duration: "12s",
    framing: "Medium two-shot",
    movement: "Static, warm and cozy framing",
    action: (h, f) => `${h} shares something warm and kind with ${f}, and they both start to smile.`,
    dialogueLine: (h) => `${h}: "Let's give it a try!"`,
    needsLipSync: true,
    castIndexes: [0, 1],
  },
  {
    start: "1:20",
    end: "1:32",
    duration: "12s",
    framing: "Medium shot",
    movement: "Gentle bounce follow",
    action: (h, f) => `${f} warms up, giggling and glowing with happiness alongside ${h}.`,
    dialogueLine: (_h, f) => `${f}: "You've got this, friend!"`,
    needsLipSync: true,
    castIndexes: [1],
  },
  {
    start: "1:32",
    end: "1:42",
    duration: "10s",
    framing: "Wide shot",
    movement: "Slow pull-back",
    action: (h, f) => `${h} realizes that sharing kindness with ${f} feels even better than the original big dream.`,
    needsLipSync: false,
    castIndexes: [0, 1],
  },
  {
    start: "1:42",
    end: "1:55",
    duration: "13s",
    framing: "Wide happy ending shot",
    movement: "Slow celebratory pull-back with soft glow",
    action: (h, f) => `${h} and ${f} cuddle together under a warm glow, singing a happy little song.`,
    dialogueLine: (h) => `${h}: "Being me is already a superpower!"`,
    needsLipSync: true,
    castIndexes: [0, 1],
  },
];

function buildShots(characters: DraftCharacter[], styleGuide: DraftStyleGuide): DraftShot[] {
  const heroName = characters[0]?.name ?? "Hero";
  const friendName = characters[1]?.name ?? characters[0]?.name ?? "Friend";

  return SHOT_BEATS.map((beat, index) => {
    const cast = beat.castIndexes.map((i) => characters[i]).filter(Boolean) as DraftCharacter[];
    const action = beat.action(heroName, friendName);
    const dialogue = beat.dialogueLine?.(heroName, friendName) ?? null;
    const narration = beat.narrationLine?.(heroName, friendName) ?? null;

    return {
      shotNumber: index + 1,
      timestampStart: beat.start,
      timestampEnd: beat.end,
      duration: beat.duration,
      sceneDescription: action,
      characters: cast.map((c) => c.name),
      action,
      cameraMovement: `${beat.framing}, ${beat.movement}`,
      dialogue,
      narration,
      needsLipSync: beat.needsLipSync,
      imagePrompt: buildImagePrompt(action, cast, styleGuide),
      videoPrompt: buildVideoPrompt(action, cast),
      negativePrompt: buildNegativePrompt(),
      referenceImageUrls: [],
      renderedClipUrl: null,
      renderStatus: "pending",
      qualityStatus: "pending",
      qualityNotes: [],
    } satisfies DraftShot;
  });
}

export const mockStoryProvider: StoryProvider = {
  async generateSafeStory({ originalUserInput }) {
    await delay(500);
    if (isSampleInput(originalUserInput)) {
      return SOUP_ROCKET_SAFE_STORY;
    }
    const safeStoryIdea = makeChildSafe(originalUserInput);
    const heroName = deriveHeroName(originalUserInput);
    const title = deriveTitle(heroName, safeStoryIdea);
    const lesson = deriveLesson(heroName);
    return {
      title,
      safeStoryIdea,
      ageRange: "3-7",
      lesson,
      story: buildGenericStory(heroName, title, safeStoryIdea, lesson),
    };
  },

  async generateCharacterBible(story) {
    await delay(600);
    if (story.title === SOUP_ROCKET_SAFE_STORY.title) {
      return SOUP_ROCKET_CHARACTERS.map((c) => ({ ...c, referenceImagePrompts: buildReferencePrompts(c) }));
    }
    const match = story.title.match(/^The (\w+)/);
    const heroName = match?.[1] ?? "Hero";
    return buildGenericCharacters(heroName).map((c) => ({ ...c, referenceImagePrompts: buildReferencePrompts(c) }));
  },

  async generateStyleGuide(_story, characters) {
    await delay(400);
    const palette = Array.from(new Set(characters.flatMap((c) => c.colorPalette))).slice(0, 6);
    return {
      artDirection: DEFAULT_VISUAL_STYLE,
      colorPalette: palette.length ? palette : ["warm orange", "cream", "sky blue", "soft yellow"],
      lighting: "Bright, warm, soft-shadow lighting that feels like a sunny afternoon indoors.",
      cameraStyle: "Gentle push-ins, smooth pans, and simple TV-cartoon framing - no shaky or handheld camera movement.",
      texture: "Soft clay-like 3D texture on every character and prop, rounded edges, no sharp corners.",
      backgroundRules: "Clean, simple backgrounds that support the story without visual clutter.",
      characterRules: "Every character keeps the same proportions, colors, outfit, and clay-like texture in every single shot.",
      consistencyRules:
        "Repeat each character's full name, visual description, outfit, color palette, and clay-like texture in every generated prompt.",
      negativeStyleRules: KLING_NEGATIVE_STYLE,
    };
  },

  async generateShotList(_story, characters, styleGuide) {
    await delay(700);
    return buildShots(characters, styleGuide);
  },

  async restampShotPrompts(shot, cast, styleGuide) {
    await delay(50);
    return {
      imagePrompt: buildImagePrompt(shot.action, cast, styleGuide),
      videoPrompt: buildVideoPrompt(shot.action, cast),
      referenceImageUrls: cast.map((c) => c.referenceImageUrl).filter((url): url is string => Boolean(url)),
    };
  },
};
