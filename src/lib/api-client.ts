import type { Project } from "@/lib/types";

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? "Request failed");
  return body;
}

export async function createProjectRequest(originalUserInput: string): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalUserInput }),
  });
  const { project } = await parseOrThrow<{ project: Project }>(res);
  return project;
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
  const { project } = await parseOrThrow<{ project: Project }>(res);
  return project;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects", { cache: "no-store" });
  const { projects } = await parseOrThrow<{ projects: Project[] }>(res);
  return projects;
}

export async function fixGlitchesRequest(id: string): Promise<{ started: boolean; fixedShotCount?: number }> {
  const res = await fetch(`/api/projects/${id}/fix-glitches`, { method: "POST" });
  return parseOrThrow(res);
}

export async function regenerateRequest(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}/regenerate`, { method: "POST" });
  const { project } = await parseOrThrow<{ project: Project }>(res);
  return project;
}
