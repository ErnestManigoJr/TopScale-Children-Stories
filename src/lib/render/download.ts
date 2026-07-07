import { writeFile } from "node:fs/promises";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Downloads a remote file (e.g. a fal.ai-hosted generated image/video) to a
 * local path so ffmpeg can operate on it directly. Retries a few times on
 * transient failures (CDN 5xx, network blips) so one flaky response doesn't
 * kill an otherwise-successful multi-shot render. */
export async function downloadFile(url: string, outPath: string, retries = 3): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(outPath, buffer);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await delay(1000 * attempt);
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to download ${url} after ${retries} attempts: ${message}`);
}
