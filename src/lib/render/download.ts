import { writeFile } from "node:fs/promises";

/** Downloads a remote file (e.g. a fal.ai-hosted generated image/video) to a
 * local path so ffmpeg can operate on it directly. */
export async function downloadFile(url: string, outPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
}
