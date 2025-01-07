import { D1Database } from "@cloudflare/workers-types";
import { getProject, getProjects, getProjectStatusHistory, updateProjectStatus } from "./operations";

// Add test database support
let testDb: D1Database | null = null;

export function setTestDb(db: any) {
  testDb = db;
}

export async function getDB(): Promise<D1Database> {
  if (process.env.NODE_ENV === "test" && testDb) {
    return testDb;
  }

  if (!process.env.DB) {
    throw new Error("Database not initialized");
  }
  return process.env.DB as unknown as D1Database;
}

// Re-export database operations
export { getProject, getProjects, getProjectStatusHistory, updateProjectStatus };