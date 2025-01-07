import { setTestDb } from "@/db";
import * as matchers from "@testing-library/jest-dom/matchers";
import { afterEach, beforeEach, expect } from "vitest";
import { createTestDb } from "./utils/test-db";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Set up test database
const testDb = createTestDb();
setTestDb(testDb);

// Clean up after each test
afterEach(async () => {
  // Delete status history first due to foreign key constraint
  await testDb.prepare("DELETE FROM status_history").bind().run();
  await testDb.prepare("DELETE FROM projects").bind().run();
});

// Seed test data before each test
beforeEach(async () => {
  const now = Date.now();
  await testDb
    .prepare(
      `
    INSERT INTO projects (id, name, created_at, updated_at)
    VALUES ('test-project-1', 'Test Project', ?, ?);
  `
    )
    .bind(now, now)
    .run();
});
