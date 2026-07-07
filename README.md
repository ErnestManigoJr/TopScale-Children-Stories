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
9. Rendering animated scenes (**Kling**)
10. Rendering speaking scenes (**HeyGen**)
11. Assembling cartoon (**FFmpeg**-style automated assembly)
12. Cleaning and polishing final cartoon (**Topaz Video AI**)
13. Checking consistency and glitches
14. Exporting final video

The user never picks a tool - Soup Stack always uses Kling for animation, HeyGen only for shots where a
character speaks directly to camera, an FFmpeg-based MVP assembly (with a DaVinci Resolve XML/EDL export
plan for pro finishing), and Topaz Video AI as the final cleanup/upscale pass before export.

## Running the app

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db (SQLite) if it doesn't exist
npm run db:seed          # generates the sample project, "The Little Soup Rocket"
npm run dev
```

Open http://localhost:3000.

## Creating a cartoon

1. On the home page, paste a rough story idea (or click **Try sample story**) and click **Create Cartoon**.
2. You're taken to `/projects/[id]/generating`, which polls the project every second and shows each
   pipeline stage as it moves through `pending -> processing -> completed` (or `failed` / `needs_review`).
3. When the pipeline finishes, you land on `/projects/[id]`: an embedded (mock) video player, story
   summary, characters, and buttons to download the MP4, download the production packet, export prompts,
   regenerate, or **Fix Glitches** if the quality check flagged any shots.
4. `/projects/[id]/production` has the full production packet for review/troubleshooting: full script,
   character bible with reference prompts, style guide, shot list with Kling/HeyGen prompts, storyboard
   panels, the FFmpeg/DaVinci editing plan, Topaz cleanup notes, and the quality report.
5. `/library` lists every saved project with its status and runtime.

### Fix Glitches

If the quality-check stage flags a shot (bad consistency, missing render, etc.), the final cartoon page
shows a **Fix Glitches** button. It only requeues the flagged/failed shots with reinforced consistency
language, then re-runs assembly -> Topaz cleanup -> quality check -> export. The approved story and
character bible are left untouched.

## Where the mock providers live

Every external AI service sits behind a provider interface in `src/lib/providers/types.ts`
(`StoryProvider`, `ImageProvider`, `VideoProvider`, `LipSyncProvider`, `EditorProvider`, `TopazProvider`).
The pipeline runner (`src/lib/pipeline/runner.ts`) only ever calls these interfaces - never a vendor SDK
directly.

The MVP implementations are mocks in `src/lib/providers/mock/`:

- `storyProvider.ts` - templated story/character/style-guide/shot-list generation (with a hand-written
  exact match for the "Little Soup Rocket" sample)
- `imageProvider.ts` - placeholder character reference and storyboard panel images
- `videoProvider.ts` - simulated Kling render jobs
- `lipSyncProvider.ts` - simulated HeyGen speaking-shot render jobs
- `editorProvider.ts` - builds a real FFmpeg concat command and a DaVinci Resolve EDL plan from the shot
  list, plus a placeholder "assembled" video URL
- `topazProvider.ts` - implements the exact `TopazProvider` interface (analyze / enhance / status / export)
  with sensible default settings (1080p, light sharpen, preserve cartoon texture)

`src/lib/providers/index.ts` is the single place that wires mock providers in - swap any one line there
for a real integration and nothing else in the pipeline needs to change.

## Connecting real providers later

| Stage | Mock today | Real provider later |
|---|---|---|
| Story/character/shots | Template logic in `mock/storyProvider.ts` | OpenAI/Anthropic chat completion with structured output, same input/output shapes |
| Character & storyboard images | `mock/imageProvider.ts` placeholder URLs | OpenAI image generation API |
| Animation | `mock/videoProvider.ts` | Kling image-to-video/video-generation API, polling `getRenderStatus` |
| Lip-sync | `mock/lipSyncProvider.ts` | HeyGen API with character voice/avatar + dialogue |
| Assembly | `mock/editorProvider.ts` | Real `ffmpeg` binary or render queue running the generated concat command; the EDL plan is ready for DaVinci Resolve import |
| Cleanup/upscale | `mock/topazProvider.ts` | Topaz Video AI CLI/API using the same `TopazEnhancementInput` |

Every mock file has `TODO(real-provider)` comments marking exactly what to swap.

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
