# Lessons

## Edge Runtime Configuration
When working with Cloudflare Pages and Next.js in edge runtime:
1. All API routes must explicitly set `export const runtime = 'edge'`
2. This includes:
   - Custom API routes (`/api/projects`, `/api/hello`, etc.)
   - Auth.js routes (`/api/auth/[...nextauth]`)
3. Use Web Crypto API instead of Node's crypto module:
   ```typescript
   // ❌ Wrong: Node's crypto module
   import { createHash, randomBytes } from "crypto";
   const hash = createHash("sha256").update(data).digest("hex");
   const random = randomBytes(32).toString("hex");

   // ✅ Correct: Web Crypto API
   const encoder = new TextEncoder();
   const data = encoder.encode(input);
   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

   const array = new Uint8Array(32);
   crypto.getRandomValues(array);
   const random = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
   ```

## Auth.js Configuration
1. Must use JWT strategy in edge runtime
2. Environment variables must start with AUTH_
3. Required variables:
   - AUTH_SECRET
   - AUTH_GITHUB_ID
   - AUTH_GITHUB_SECRET
   - AUTH_TRUST_HOST (set to true for local developement)

# Lessons Learned

## API Routes
1. Always set `export const runtime = 'edge'` at the top of API route files when using Cloudflare D1 database.
   ```typescript
   // src/app/api/[route]/route.ts
   export const runtime = 'edge';
   ```
   Without this, the database binding won't be available in the runtime context and you'll get "Database not initialized" error.

## Testing
1. When using Next.js route handlers in tests, make sure to mock auth if the route handler uses it, even indirectly.
   ```typescript
   // Mock auth at the beginning of test file
   vi.mock("@/auth", () => ({
     auth: vi.fn(),
   }));
   ```
   This is needed because route handlers might use auth internally, and the test environment doesn't have access to auth configuration.

### Database Setup in Tests
❌ Don't create tables in test files:
```typescript
// Bad practice: creating tables in tests
beforeEach(async () => {
    db = createTestDb();
    await db.batch([
        db.prepare(`CREATE TABLE projects (...)`),
        db.prepare(`CREATE TABLE status_history (...)`),
    ]);
});
```

✅ Instead, use migrations to create schema:
1. Tests should use the same schema as production
2. Schema should be managed by migrations only
3. If tests need different schema, it indicates a design issue
4. Migrations ensure schema consistency across all environments

Example:
```typescript
beforeEach(async () => {
    db = createTestDb();
    await db.exec(await readMigrations());  // Apply all migrations
});
```

### Test Database Result Format
When working with database operations in tests, be aware that D1 and the test database (better-sqlite3) return different result formats:
- D1 returns: `{ success: boolean, meta: { changes: number } }`
- Test DB returns: `{ changes: number, lastInsertRowid: number }`

For functions that need to work in both environments, handle both formats:
```typescript
// Example for checking if a row was updated
return (result.success && result.meta?.changes === 1) || (result as any).changes === 1;
```

## Dependencies
- next.js: 14.2.22
- next-auth: ^5.0.0-beta.25
- edge-runtime for tests

## D1 Database Lessons

- D1 的 `bind()` 操作是不可变的（immutable），它返回一个新的 statement 对象而不是修改原有对象。需要重新赋值：
  ```typescript
  // ❌ Wrong
  stmt.bind(...params);
  await stmt.all();

  // ✅ Correct
  stmt = stmt.bind(...params);
  await stmt.all();
  ```

- Always use wrangler command to update D1 database, even for local development:
  ```bash
  # ❌ Wrong: directly using sqlite3
  sqlite3 .wrangler/state/v3/d1/.../database.sqlite < migrations/my_migration.sql

  # ✅ Correct: using wrangler
  npx wrangler d1 execute <database-name> --local --file=migrations/my_migration.sql
  ```
  This ensures consistency between local and production environments, and helps catch potential issues early.

## Database Testing

### D1 vs Test Database Result Format
When working with database operations in tests, be aware that D1 and the test database (better-sqlite3) return different result formats:
- D1 returns: `{ success: boolean, meta: { changes: number } }`
- Test DB returns: `{ changes: number, lastInsertRowid: number }`

For functions that need to work in both environments, handle both formats:
```typescript
// Example for checking if a row was updated
return (result.success && result.meta?.changes === 1) || (result as any).changes === 1;
```