import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

// Create a new in-memory database for testing
export function createTestDb() {
  const db = new Database(":memory:");

  // Read and execute migration files
  const migrations = [
    readFileSync(resolve(process.cwd(), "migrations/0000_initial.sql"), "utf-8"),
    readFileSync(resolve(process.cwd(), "migrations/0001_add_deleted_flag.sql"), "utf-8"),
  ];

  // Execute each migration
  for (const migration of migrations) {
    // Split migration into schema and data if it contains initial data
    if (migration.includes("-- Initial data")) {
      const [schema] = migration.split("-- Initial data");
      db.exec(schema);
    } else {
      db.exec(migration);
    }
  }

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
        all: <T>() => ({ results: stmt.all() as T[] }),
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
  const activeProject = {
    id: "1",
    name: "Active Project",
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted: 0,
    status: "operational",
    status_updated_at: Date.now(),
  };

  const deletedProject = {
    id: "2",
    name: "Deleted Project",
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted: 1,
    status: "operational",
    status_updated_at: Date.now(),
  };

  // Insert project
  db.prepare("INSERT INTO projects (id, name, created_at, updated_at, deleted) VALUES (?, ?, ?, ?, ?)")
    .bind(
      activeProject.id,
      activeProject.name,
      activeProject.created_at,
      activeProject.updated_at,
      activeProject.deleted
    )
    .run();

  db.prepare("INSERT INTO projects (id, name, created_at, updated_at, deleted) VALUES (?, ?, ?, ?, ?)")
    .bind(
      deletedProject.id,
      deletedProject.name,
      deletedProject.created_at,
      deletedProject.updated_at,
      deletedProject.deleted
    )
    .run();

  // Insert status history
  db.prepare("INSERT INTO status_history (project_id, status, created_at) VALUES (?, ?, ?)")
    .bind(activeProject.id, activeProject.status, activeProject.status_updated_at)
    .run();

  db.prepare("INSERT INTO status_history (project_id, status, created_at) VALUES (?, ?, ?)")
    .bind(deletedProject.id, deletedProject.status, deletedProject.status_updated_at)
    .run();

  return { activeProject, deletedProject };
}
