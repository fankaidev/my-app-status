# My App Status

A modern status page application built with Next.js 14 and deployed on Cloudflare Pages. This application allows you to monitor and display the status of various projects in real-time.

## Features

- 🔒 Login via Cloudflare Access
- 📊 Real-time Project Status Display
- ⚡ Edge Runtime Performance
- 🔄 Public API for Status Updates
- 📅 Last Update Time Tracking
- 📈 Historical Status Timeline

## Tech Stack

- **Framework**: Next.js 14
- **Authentication**: Cloudflare Access (JWT verified in `src/lib/access.ts`); API tokens for status reporting
- **Database**: Cloudflare D1 (SQLite at edge)
- **Deployment**: Cloudflare Pages
- **Testing**: Integration tests with local SQLite

## API Endpoints

The following API endpoints are available:

- `GET /api/projects` - List all projects with their latest status
- `GET /api/projects/[id]` - Get specific project details
- `POST /api/projects/status` - Update project status by id or name (will create new project if name doesn't exist)

For detailed API documentation including request/response formats, parameters, and error handling, see [API Documentation](docs/api.md).

## Changelog

1. Create project skeleton with basic status display
2. Implement GitHub authentication with Auth.js
3. Add public API for status updates
4. Setup D1 database for project status
5. Setup test framework and write integration tests
6. Display last update time for projects
7. Support updating project status by name
8. Add admin page with project deletion
9. Improve testing by using public API endpoints
10. Add user-project relationship and access control
11. Add user token for updating project status
12. Enhance project security with owner-based access
13. Add status history timeline display
14. Improve history UI with item limit and wrapping

## Authentication

Login is handled by Cloudflare Access in front of the site; the app has no login UI of its own.

- Access adds a signed JWT in the `Cf-Access-Jwt-Assertion` header. `src/lib/access.ts` verifies it (signature, issuer, audience, expiry) and `auth()` returns `{ user: { email } }`. Requests without a valid JWT are treated as unauthenticated.
- `POST /api/projects/status` also accepts `Authorization: Bearer <token>`, so the Access application must bypass that path for reporters that can't log in.
- Required vars: `ACCESS_TEAM_DOMAIN` (e.g. `myteam.cloudflareaccess.com`) and `ACCESS_AUD` (the Access application's AUD tag). They are set in `[vars]` in `wrangler.toml`: when that file exists, Pages ignores variables configured in the dashboard. They are identifiers, not secrets.
- The UI has no signed-out state: Access guards the whole site, and `GET /api/me` only supplies the email shown in the header.
- Local dev: set `ACCESS_DEV_EMAIL=you@example.com` in `.env.local` to skip Access (ignored in production builds).

## Development and build

This project uses **pnpm** for everything (the version is pinned by `packageManager` in `package.json`, Node 22 via `.node-version`). Do not use npm or yarn, and do not commit `package-lock.json` or `yarn.lock`.

```bash
pnpm install        # install dependencies (commit pnpm-lock.yaml)
pnpm dev            # local dev server on :3200
pnpm test           # integration tests (real SQLite, no mocks of the DB)
pnpm pages:build    # build for Cloudflare Pages
```

- `pnpm-workspace.yaml` lists which dependencies may run build scripts (`allowBuilds`).
- Cloudflare Pages builds with `pnpm install` and `npx @cloudflare/next-on-pages@1`. The Pages project must use build system v3 so it ships a pnpm and Node new enough to read `pnpm-lock.yaml`.
- Pushing to `main` deploys to production.

### Version limits

Some dependencies are intentionally not on their latest major:

- `next` is pinned to 15.5.2 and `vercel` to 47.0.4: `@cloudflare/next-on-pages` (deprecated upstream in favour of OpenNext) only supports `next <= 15.5.2` and `vercel <= 47.0.4`. Going beyond that means migrating to the OpenNext Cloudflare adapter.
- `@cloudflare/workers-types` stays on 4.x for the same reason (peer range).
- `eslint` stays on 9 because `eslint-config-next` 15 does not support 10 yet.
- `tailwindcss` stays on 3.x; v4 needs a config migration.
- `typescript` stays on 5.x; Next 15 does not support TypeScript 7.
- `@types/node` follows the Node version in `.node-version` (22).
