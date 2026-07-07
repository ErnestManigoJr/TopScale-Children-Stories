"use client";

import { useState } from "react";

/**
 * The MVP's Kling/HeyGen/Topaz providers are mocked, so there is no real
 * rendered MP4 to stream yet - this stands in for the "embedded video
 * player" the final page needs, and swaps to a real <video> element the
 * moment finalVideoUrl points at an actual file.
 */
export function MockVideoPlayer({ thumbnailUrl, title }: { thumbnailUrl: string | null; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {thumbnailUrl && (
        <img src={thumbnailUrl} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl backdrop-blur">
          {playing ? "⏸" : "▶"}
        </span>
        <span className="rounded-full bg-black/50 px-3 py-1 text-xs">
          {playing ? "Mock playback - connect Kling/HeyGen/Topaz for real render" : "Preview mock render"}
        </span>
      </button>
    </div>
  );
}
