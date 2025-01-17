import { ApiErrors } from "@/lib/api-error";
import { Project, StatusHistory } from "@/types/db";

/**
 * Get all projects with their latest status
 */
export async function getProjects(
  db: D1Database,
  options: { includeDeleted?: boolean; owner_id?: string } = {}
): Promise<Project[]> {
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

  let stmt = db.prepare(`
        SELECT p.*
        FROM projects p
        ${whereClause}
        ORDER BY p.name ASC
    `);

  if (params.length > 0) {
    stmt = stmt.bind(...params);
  }

  const { results } = await stmt.all<Project>();
  return results || [];
}

/**
 * Get a single project by ID with its latest status
 */
export async function getProject(
  db: D1Database,
  id: string,
  options: { owner_id?: string } = {}
): Promise<Project | null> {
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
            p.latest_status as status,
            NULL as message,
            p.updated_at as status_updated_at
        FROM projects p
        WHERE ${conditions.join(" AND ")}
    `
    )
    .bind(...params);

  const result = await stmt.first<Project>();
  return result || null;
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  db: D1Database,
  projectId: string,
  status: StatusHistory["status"],
  message?: string,
  options: { owner_id?: string } = {}
): Promise<void> {
  // First check if project exists and get owner info
  const stmt = db.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId);
  const project = await stmt.first<{ id: string; owner_id: string }>();

  if (!project) {
    throw ApiErrors.NotFound("Project");
  }

  // Check ownership if owner_id is provided
  if (options.owner_id && project.owner_id !== options.owner_id) {
    console.log("owner_id does not match project owner_id");
    throw ApiErrors.Unauthorized();
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

  // Update project's updated_at and latest_status
  await db
    .prepare(
      `
        UPDATE projects
        SET updated_at = ?,
            latest_status = ?
        WHERE id = ?
    `
    )
    .bind(now, status, projectId)
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
export async function findProjectByName(
  db: D1Database,
  name: string,
  options: { owner_id: string }
): Promise<Project | null> {
  const stmt = db
    .prepare(
      `
        SELECT
            p.*,
            p.latest_status as status,
            NULL as message,
            p.updated_at as status_updated_at
        FROM projects p
        WHERE p.name = ? AND p.owner_id = ?
    `
    )
    .bind(name, options.owner_id);

  return await stmt.first<Project>();
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
        INSERT INTO projects (id, name, owner_id, created_at, updated_at, latest_status)
        VALUES (?, ?, ?, ?, ?, NULL)
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
  owner_id: string,
  name: string,
  status: StatusHistory["status"],
  message?: string
): Promise<string> {
  // First try to find project by name
  let project = await findProjectByName(db, name, { owner_id });
  let projectId: string;

  if (!project) {
    // Create new project if not found
    console.log("creating new project with name:", name);
    projectId = await createProject(db, name, owner_id);
  } else {
    projectId = project.id;
  }

  // Update status
  await updateProjectStatus(db, projectId, status, message, { owner_id });

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
