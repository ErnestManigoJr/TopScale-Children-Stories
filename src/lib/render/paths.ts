import { mkdir } from "node:fs/promises";
import path from "node:path";

// Real rendered assets are written under public/generated/{projectId}/... so
// Next.js serves them directly at /generated/{projectId}/... - no separate
// static file route needed.
const PUBLIC_ROOT = path.join(process.cwd(), "public", "generated");

export async function projectDir(projectId: string, subdir: string): Promise<string> {
  const dir = path.join(PUBLIC_ROOT, projectId, subdir);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function toPublicUrl(absolutePath: string): string {
  const relative = path.relative(path.join(process.cwd(), "public"), absolutePath).split(path.sep).join("/");
  return `/${relative}`;
}

export function fromPublicUrl(url: string): string {
  const relative = url.replace(/^\//, "");
  return path.join(process.cwd(), "public", ...relative.split("/"));
}
