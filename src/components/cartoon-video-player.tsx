/** Real embedded player for the rendered cartoon MP4 (ffmpeg-produced Ken
 * Burns clips + flite narration, concatenated and cleaned up). Falls back to
 * a simple placeholder if a project somehow has no video yet. */
export function CartoonVideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
}: {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
}) {
  if (!videoUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          Video not rendered yet
        </div>
      </div>
    );
  }

  return (
    <video
      key={videoUrl}
      controls
      poster={thumbnailUrl ?? undefined}
      className="aspect-video w-full rounded-2xl bg-black"
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}
