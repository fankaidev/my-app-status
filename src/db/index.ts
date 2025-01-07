import { D1Database } from "@cloudflare/workers-types";
import { getProject, getProjects, getProjectStatusHistory, updateProjectStatus } from "./operations";

export async function getDB(): Promise<D1Database> {
  return process.env.DB as unknown as D1Database;
}

// Re-export database operations
export { getProject, getProjects, getProjectStatusHistory, updateProjectStatus };
