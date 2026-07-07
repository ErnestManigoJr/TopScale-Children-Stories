# Soup Stack

**Paste a rough children's story. Soup Stack turns it into a finished animated cartoon short.**

Soup Stack is an automated AI cartoon-video creation platform for making 1-2 minute animated cartoon
shorts for children. The user experience is deliberately one step: paste an idea, click **Create Cartoon**,
and watch a pipeline progress tracker turn it into a complete, child-safe cartoon package - story,
character bible, visual style guide, shot list, storyboard, prompts, render jobs, and a final video.

## The automated pipeline

Every project moves through 14 stages, visible live on the generation screen:

1. Reading story idea
2. Making it child-safe
3. Expanding story
4. Creating characters
5. Locking visual style
6. Building shot list
7. Creating storyboard
8. Generating character references
9. Rendering animated scenes (**Kling**, via fal.ai)
10. Rendering speaking scenes (**HeyGen stand-in** - same Kling animation + TTS voiceover, see caveat below)
11. Assembling cartoon (real **FFmpeg** concat)
12. Cleaning and polishing final cartoon (**Topaz Video AI stand-in** - real FFmpeg contrast/sharpen/scale pass)
13. Checking consistency and glitches
14. Exporting final video

The user never picks a tool - Soup Stack always uses the same providers for the same job.

## What's real vs. what's a stand-in

Story/character/shot-list text generation is templated (no LLM call). Everything downstream of that
produces **real, playable output**:

| Stage | What actually runs |
|---|---|
| Character & scene art | **FLUX.1 [schnell]** (fal.ai) - real AI-generated cartoon images from the shot/character prompts |
| Animation | **Kling 2.1 standard** (fal.ai) image-to-video - animates the FLUX-generated frame |
| Narration/dialogue audio | ffmpeg's built-in **libflite** text-to-speech - a real spoken voice, one consistent voice per character (not true lip-sync - see caveat) |
| Assembly | Real `ffmpeg` concat of the rendered clips |
| Cleanup/upscale | Real `ffmpeg` filter pass (contrast/sharpen/scale) standing in for Topaz Video AI |

**Known limitation:** there's no real lip-sync model wired in yet, so "speaking" shots get the same Kling
animation as action shots, with the character's line played as a TTS voiceover rather than synced mouth
movement. Swapping in the real HeyGen API (see `src/lib/providers/real/lipSyncProvider.ts`) would fix
that without touching anything else in the pipeline.

**Also worth knowing:** AI video models (Kling included) don't reliably produce frame-perfect classic
animation - expect some visual inconsistency between shots (this is a model-capability limitation, not a
bug in this app).

## Requirements

- **ffmpeg** installed and on PATH (or update the hardcoded path in `src/lib/render/ffmpeg.ts` to match
  your install). On Windows: `winget install Gyan.FFmpeg`.
- A **fal.ai** API key with billing set up (pay-per-generation, no subscription) - sign up and create a key
  at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys), add credits at
  [fal.ai/dashboard/billing](https://fal.ai/dashboard/billing).

## Running the app

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db (SQLite) if it doesn't exist
cp .env.example .env     # then fill in FAL_KEY
npm run db:seed          # generates the sample project, "The Little Soup Rocket" (real API calls - costs credits)
npm run dev
```

Open http://localhost:3000.

## Creating a cartoon

1. On the home page, paste a rough story idea (or click **Try sample story**) and click **Create Cartoon**.
2. You're taken to `/projects/[id]/generating`, which polls the project every second and shows each
   pipeline stage as it moves through `pending -> processing -> completed` (or `failed` / `needs_review`).
3. When the pipeline finishes, you land on `/projects/[id]`: a real embedded `<video>` player, story
   summary, characters, and buttons to download the MP4, download the production packet, export prompts,
   regenerate, or **Fix Glitches** if the quality check flagged any shots.
4. `/projects/[id]/production` has the full production packet for review/troubleshooting: full script,
   character bible with reference prompts, style guide, shot list with Kling/HeyGen prompts, storyboard
   panels, the FFmpeg/DaVinci editing plan, Topaz cleanup notes, and the quality report.
5. `/library` lists every saved project with its status and runtime.

### Fix Glitches

If the quality-check stage flags a shot (bad consistency, missing render, etc.), the final cartoon page
shows a **Fix Glitches** button. It only requeues the flagged/failed shots with reinforced consistency
language, then re-runs assembly -> cleanup -> quality check -> export. The approved story and character
bible are left untouched.

## Provider architecture

Every external AI service sits behind a provider interface in `src/lib/providers/types.ts`
(`StoryProvider`, `ImageProvider`, `VideoProvider`, `LipSyncProvider`, `EditorProvider`, `TopazProvider`).
The pipeline runner (`src/lib/pipeline/runner.ts`) only ever calls these interfaces - never a vendor SDK
directly. `src/lib/providers/index.ts` is the single place that wires an implementation in per interface -
swap one line there for a different integration and nothing else in the pipeline needs to change.

- `src/lib/providers/mock/` - the original zero-cost, zero-dependency mock implementations (no ffmpeg or
  API key required). Still used for `storyProvider`.
- `src/lib/providers/real/` - the real implementations currently wired in: FLUX + Kling (via
  `src/lib/providers/real/falClient.ts`), ffmpeg assembly/cleanup, ffmpeg TTS narration.
- `src/lib/render/` - shared ffmpeg helpers (`ffmpeg.ts` process wrapper, `card.ts` still-image cards used
  for the thumbnail, `clip.ts` Ken-Burns/audio-muxing, `colors.ts`, `paths.ts`, `download.ts`).

### Connecting the real HeyGen API (fixing lip-sync)

Edit `src/lib/providers/real/lipSyncProvider.ts` to call the actual HeyGen API with
`character.voiceStyle`/`character.expressions` and the dialogue text, in place of the Kling+TTS stand-in,
keeping the same `RenderJobHandle` return shape.

## Data model

Prisma (SQLite) models in `prisma/schema.prisma`: `Project`, `Story`, `Character`, `StyleGuide`, `Shot`,
`StoryboardPanel`, `RenderJob`, `FinalRender`. List/object fields (arrays, prompt bundles, quality
reports) are stored as JSON-encoded strings and parsed into typed domain objects via
`src/lib/serializers.ts` / `src/lib/types.ts`.

## Child safety

Every story idea is passed through a rewrite step (`makeChildSafe` in
`src/lib/providers/mock/shared.ts`) before any generation happens, and the visual style is fixed to:

> Soft colorful 3D cartoon with clay-like texture, rounded child-friendly shapes, bright warm lighting,
> expressive faces, gentle playful motion, clean backgrounds, smooth TV-cartoon movement, consistent
> characters, cheerful atmosphere, no scary imagery.

There is no option to change the visual style from the UI.
