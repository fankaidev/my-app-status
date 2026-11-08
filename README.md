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
- Required env vars: `ACCESS_TEAM_DOMAIN` (e.g. `myteam.cloudflareaccess.com`) and `ACCESS_AUD` (the Access application's AUD tag).
- Local dev: set `ACCESS_DEV_EMAIL=you@example.com` in `.env.local` to skip Access (ignored in production builds).
