import { ApiErrors } from "@/lib/api-error";
import { ProjectWithStatus, StatusHistory } from "@/types/db";

/**
 * Get all projects with their latest status
 */
export async function getProjects(db: D1Database): Promise<ProjectWithStatus[]> {
  const stmt = db.prepare(`
        SELECT
            p.*,
            sh.status,
            sh.message,
            sh.created_at as status_updated_at
        FROM projects p
        LEFT JOIN (
            SELECT
                project_id,
                status,
                message,
                created_at
            FROM status_history sh1
            WHERE created_at = (
                SELECT MAX(created_at)
                FROM status_history sh2
                WHERE sh2.project_id = sh1.project_id
            )
        ) sh ON p.id = sh.project_id
        ORDER BY p.name ASC
    `);

  const { results } = await stmt.all<ProjectWithStatus>();
  return results || [];
}

/**
 * Get a single project by ID with its latest status
 */
export async function getProject(db: D1Database, id: string): Promise<ProjectWithStatus | null> {
  const stmt = db
    .prepare(
      `
        SELECT
            p.*,
            sh.status,
            sh.message,
            sh.created_at as status_updated_at
        FROM projects p
        LEFT JOIN (
            SELECT
                project_id,
                status,
                message,
                created_at
            FROM status_history sh1
            WHERE created_at = (
                SELECT MAX(created_at)
                FROM status_history sh2
                WHERE sh2.project_id = sh1.project_id
            )
        ) sh ON p.id = sh.project_id
        WHERE p.id = ?
    `
    )
    .bind(id);

  const result = await stmt.first<ProjectWithStatus>();
  return result || null;
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  db: D1Database,
  projectId: string,
  status: StatusHistory["status"],
  message?: string
): Promise<void> {
  // First check if project exists
  const project = await getProject(db, projectId);
  if (!project) {
    throw ApiErrors.NotFound("Project");
  }

  // Insert new status record
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `
        INSERT INTO status_history (project_id, status, message, created_at)
        VALUES (?, ?, ?, ?)
    `
    )
    .bind(projectId, status, message || null, now)
    .run();

  // Update project's updated_at timestamp
  await db
    .prepare(
      `
        UPDATE projects
        SET updated_at = ?
        WHERE id = ?
    `
    )
    .bind(now, projectId)
    .run();
}

/**
 * Get status history for a project
 */
export async function getProjectStatusHistory(
  db: D1Database,
  projectId: string,
  limit: number = 10
): Promise<StatusHistory[]> {
  const stmt = db
    .prepare(
      `
        SELECT *
        FROM status_history
        WHERE project_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    `
    )
    .bind(projectId, limit);

  const { results } = await stmt.all<StatusHistory>();
  return results || [];
}
