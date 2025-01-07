import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

// Create a new in-memory database for testing
export function createTestDb() {
  const db = new Database(":memory:");

  // Read and execute migration file
  const migration = readFileSync(resolve(process.cwd(), "migrations/0000_initial.sql"), "utf-8");
  // Split migration into schema and data
  const [schema] = migration.split("-- Initial data");
  // Only execute schema
  db.exec(schema);

  // Create D1-like interface
  const testDb = {
    prepare: (sql: string) => {
      const stmt = db.prepare(sql);
      return {
        bind: (...params: any[]) => {
          const boundStmt = stmt;
          return {
            first: () => boundStmt.get(...params),
            run: () => boundStmt.run(...params),
            all: () => ({ results: boundStmt.all(...params) }),
          };
        },
        all: () => ({ results: stmt.all() }),
        first: () => stmt.get(),
        run: () => stmt.run(),
      };
    },
    batch: (statements: any[]) => {
      db.transaction(() => {
        statements.forEach((stmt) => stmt.run());
      })();
    },
    exec: (sql: string) => db.exec(sql),
  };

  return testDb;
}

// Helper to clean database between tests
export function cleanDb(db: any) {
  db.exec("DELETE FROM status_history");
  db.exec("DELETE FROM projects");
}

// Helper to seed test data
export function seedTestData(db: any) {
  const project = {
    id: "test-project-1",
    name: "Test Project 1",
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  db.prepare("INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .bind(project.id, project.name, project.created_at, project.updated_at)
    .run();

  return { project };
}
