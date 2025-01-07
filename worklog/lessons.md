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