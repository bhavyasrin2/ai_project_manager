const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");


// ── helper ────────────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Plan ──────────────────────────────────────────────────────────────────────

/** Generate an AI plan and immediately save project + tasks to DB.
 *  Returns { project_id, total_days, estimated_weeks, phases, tasks_saved, plan } */
export const generatePlan = (payload) =>
  request("/api/plan", { method: "POST", body: JSON.stringify(payload) });

// ── Projects ──────────────────────────────────────────────────────────────────

/** List all projects with summary stats.
 *  Returns { projects: ProjectSummary[], total: number } */
export const getProjects = () => request("/api/projects");

/** Full detail for a single project.
 *  Returns ProjectDetailResponse */
export const getProject = (id) => request(`/api/projects/${id}`);

/** Full ordered task list for a project.
 *  Returns ProjectPlanResponse */
export const getProjectPlan = (id) => request(`/api/projects/${id}/plan`);

/** Sync all project tasks to Google Calendar (project_id only, no body).
 *  Returns { message, project_id, synced_tasks, total_tasks, events } */
export const syncCalendar = (id) =>
  request(`/api/projects/${id}/sync-calendar`, { method: "POST" });

// ── Tasks ─────────────────────────────────────────────────────────────────────

/** Toggle a task between done and pending.
 *  Returns { message, task_id, new_status } */
export const completeTask = (taskId) =>
  request(`/api/tasks/${taskId}/complete`, { method: "POST" });

/** Delete a project and all its tasks + email logs.
 *  Returns { message, project_id } */
export const deleteProject = (id) =>
  request(`/api/projects/${id}`, { method: "DELETE" });

