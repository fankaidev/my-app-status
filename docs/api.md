# API Documentation

## Endpoints

### List Projects

```http
GET /api/projects
```

Returns a list of all projects with their latest status.

#### Response

```typescript
{
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance" | "unknown";
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

#### Response

```typescript
{
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance" | "unknown";
  message?: string;
  created_at: number;
  updated_at: number;
  status_updated_at?: number;
}
```

### Update Project Status by ID

```http
POST /api/projects/{id}/status
```

Update status of a specific project by ID.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Project ID |

#### Request Body

```typescript
{
  status: "operational" | "degraded" | "outage" | "maintenance" | "unknown";
  message?: string;
}
```

#### Response

```typescript
{
  success: true;
}
```

### Update Project Status by ID or Name

```http
POST /api/projects/status
```

Update project status using either ID or name. If using name and project doesn't exist, a new project will be created.

#### Request Body

```typescript
{
  id?: string;        // Project ID (optional if name is provided)
  name?: string;      // Project name (optional if id is provided)
  status: "operational" | "degraded" | "outage" | "maintenance" | "unknown";
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
- `outage` - System is completely down
- `maintenance` - System is under maintenance
- `unknown` - System status is unknown