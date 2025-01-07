# Lessons

## Edge Runtime Configuration
When working with Cloudflare Pages and Next.js in edge runtime:
1. All API routes must explicitly set `export const runtime = 'edge'`
2. This includes:
   - Custom API routes (`/api/projects`, `/api/hello`, etc.)
   - Auth.js routes (`/api/auth/[...nextauth]`)

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