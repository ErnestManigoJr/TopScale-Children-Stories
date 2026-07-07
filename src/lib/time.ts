export function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(timestamp.replace(/[^\d.]/g, "")) || 0;
}

export function formatSecondsAsDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
