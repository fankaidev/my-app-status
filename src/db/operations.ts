import { ApiErrors } from "@/lib/api-error";
import { ProjectWithStatus, StatusHistory } from "@/types/db";

/**
 * Get all projects with their latest status
 */
export async function getProjects(
  db: D1Database,
  options: { includeDeleted?: boolean; owner_id?: string } = {}
): Promise<ProjectWithStatus[]> {
  const conditions = [];
  const params = [];

  if (!options.includeDeleted) {
    conditions.push("(p.deleted = 0 OR p.deleted IS NULL)");
  }

  if (options.owner_id) {
    conditions.push("p.owner_id = ?");
    params.push(options.owner_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
        ${whereClause}
        ORDER BY p.name ASC
    `);

  if (params.length > 0) {
    stmt.bind(...params);
  }

  const { results } = await stmt.all<ProjectWithStatus>();
  return results || [];
}

/**
 * Get a single project by ID with its latest status
 */
export async function getProject(
  db: D1Database,
  id: string,
  options: { owner_id?: string } = {}
): Promise<ProjectWithStatus | null> {
  const conditions = ["p.id = ?"];
  const params = [id];

  if (options.owner_id) {
    conditions.push("p.owner_id = ?");
    params.push(options.owner_id);
  }

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
        WHERE ${conditions.join(" AND ")}
    `
    )
    .bind(...params);

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

/**
 * Find a project by name
 */
export async function findProjectByName(db: D1Database, name: string): Promise<ProjectWithStatus | null> {
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
        WHERE p.name = ?
    `
    )
    .bind(name);

  const result = await stmt.first<ProjectWithStatus>();
  return result || null;
}

/**
 * Create a new project
 */
export async function createProject(db: D1Database, name: string, owner_id: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `
        INSERT INTO projects (id, name, owner_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    `
    )
    .bind(id, name, owner_id, now, now)
    .run();

  return id;
}

/**
 * Update project status by name
 * If project doesn't exist, create it first
 */
export async function updateProjectStatusByName(
  db: D1Database,
  name: string,
  status: StatusHistory["status"],
  message?: string,
  owner_id: string = 'system'
): Promise<string> {
  // First try to find project by name
  let project = await findProjectByName(db, name);
  let projectId: string;

  if (!project) {
    // Create new project if not found
    projectId = await createProject(db, name, owner_id);
  } else {
    projectId = project.id;
  }

  // Update status
  await updateProjectStatus(db, projectId, status, message);

  return projectId;
}

/**
 * Soft delete a project
 */
export async function deleteProject(db: D1Database, id: string): Promise<void> {
  // Check if project exists
  const project = await db.prepare("SELECT id FROM projects WHERE id = ?").bind(id).first();
  if (!project) {
    throw ApiErrors.NotFound("Project");
  }

  // Soft delete the project
  await db.prepare("UPDATE projects SET deleted = 1 WHERE id = ?").bind(id).run();
}

/**
 * Restore a deleted project
 */
export async function restoreProject(db: D1Database, id: string): Promise<void> {
  // Check if project exists and is deleted
  const project = await db
    .prepare("SELECT id, deleted FROM projects WHERE id = ?")
    .bind(id)
    .first<{ id: string; deleted: number }>();

  if (!project) {
    throw ApiErrors.NotFound("Project");
  }

  if (!project.deleted) {
    throw ApiErrors.BadRequest("Project is not deleted");
  }

  // Restore the project
  await db.prepare("UPDATE projects SET deleted = 0 WHERE id = ?").bind(id).run();
}
