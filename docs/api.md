# API Documentation

## Endpoints

### List Projects

```http
GET /api/projects
```

Returns a list of all projects with their latest status.

#### Sample Request
```bash
curl https://my-app-status.pages.dev/api/projects
```

#### Response

```typescript
{
  id: string;
  name: string;
  status: "operational" | "degraded" | "major_outage" | "maintenance" | "unknown";
  message?: string;
  created_at: number;
  updated_at: number;
  status_updated_at?: number;
}[]
```

### Get Project Details

```http
GET /api/projects/{id}
```

Returns details of a specific project.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Project ID |

#### Sample Request
```bash
curl https://my-app-status.pages.dev/api/projects/project-123
```

#### Response

```typescript
{
  id: string;
  name: string;
  status: "operational" | "degraded" | "major_outage" | "maintenance" | "unknown";
  message?: string;
  created_at: number;
  updated_at: number;
  status_updated_at?: number;
}
```

### Update Project Status

```http
POST /api/projects/status
```

Update project status using either ID or name. If using name and project doesn't exist, a new project will be created.

#### Authentication
You can authenticate using either:
1. Session cookie (when logged in)
2. Bearer token in Authorization header

Example with token:
```bash
curl -X POST https://my-app-status.pages.dev/api/projects/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ast_your_token_here" \
  -d '{
    "id": "project-123",
    "status": "operational"
  }'
```

#### Sample Requests

Update by ID:
```bash
curl -X POST https://my-app-status.pages.dev/api/projects/status \
  -H "Content-Type: application/json" \
  -d '{
    "id": "project-123",
    "status": "operational",
    "message": "All systems operational"
  }'
```

Update by name (creates project if not exists):
```bash
curl -X POST https://my-app-status.pages.dev/api/projects/status \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Frontend",
    "status": "degraded",
    "message": "Experiencing high latency"
  }'
```

Update with both id and name (id takes precedence):
```bash
curl -X POST https://my-app-status.pages.dev/api/projects/status \
  -H "Content-Type: application/json" \
  -d '{
    "id": "project-123",
    "name": "Web Frontend",
    "status": "maintenance",
    "message": "Scheduled maintenance in progress"
  }'
```

#### Request Body

```typescript
{
  id?: string;        // Project ID (optional if name is provided)
  name?: string;      // Project name (optional if id is provided)
  status: "operational" | "degraded" | "major_outage" | "maintenance" | "unknown";
  message?: string;   // Optional status message
}
```

At least one of `id` or `name` must be provided. If both are provided, `id` will be used.

#### Response

For existing project:
```typescript
{
  success: true;
  projectId?: string;  // Only included when using name to update
}
```

For new project (when using name that doesn't exist):
```typescript
{
  success: true;
  projectId: string;  // ID of the newly created project
}
```

#### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input (missing id/name, invalid status, etc.) |
| 404 | Not Found - Project not found when using id |
| 500 | Internal Server Error |

Example error response:
```typescript
{
  error: {
    message: string;
  }
}
```

## Status Values

The following status values are supported:

- `operational` - System is fully operational
- `degraded` - System is experiencing minor issues
- `major_outage` - System is completely down
- `maintenance` - System is under maintenance
- `unknown` - System status is unknown

## Token Management

### Create Token

```http
POST /api/tokens
```

Create a new API token for the authenticated user.

#### Request Body
```typescript
{
  name: string;  // A descriptive name for the token
}
```

#### Response
```typescript
{
  token: string;  // The token value (only shown once)
  id: string;     // Token ID for management
}
```

### List Tokens

```http
GET /api/tokens
```

List all tokens for the authenticated user.

#### Response
```typescript
{
  id: string;
  name: string;
  created_at: number;
  last_used_at?: number;
  revoked_at?: number;
}[]
```

### Revoke Token

```http
DELETE /api/tokens/{id}
```

Revoke a token by its ID.

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Token ID |

#### Response
```typescript
{
  success: true
}
```

#### Error Responses (for all token endpoints)
| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 404 | Not Found - Token not found |
| 500 | Internal Server Error |