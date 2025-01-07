# S07: Update Project Status by Name

## User Requirement
Allow users to update project status either by id or by name. When a project name is not seen before, create a new project and then update status.

## System Design

### API Changes
1. Create a new API endpoint `/api/projects/status` that accepts POST requests with:
   ```typescript
   {
     id?: string;        // optional project id
     name?: string;      // optional project name
     status: ServiceStatus;
     message?: string;
   }
   ```
   - At least one of `id` or `name` must be provided
   - If both provided, use `id` to locate project
   - If only `name` provided and project not found, create new project

### Database Changes
No schema changes needed. Will use existing tables:
- `projects` table for project info
- `status_history` table for status updates

### Implementation Plan
1. Add new database operations:
   - `findProjectByName`: Find project by name
   - `createProject`: Create new project with name
   - `updateProjectStatusByName`: Update project status using name

2. Add new API endpoint that:
   - Validates request body
   - Handles both id and name based updates
   - Creates new project if needed
   - Returns appropriate response

## Test Plan
1. Update existing project by id
2. Update existing project by name
3. Update non-existing project by name (should create new)
4. Update with both id and name provided
5. Error cases:
   - Neither id nor name provided
   - Invalid status value
   - Invalid message type

## Tasks
[X] Task 1: Add new database operations
[X] Task 2: Create new API endpoint
[X] Task 3: Add integration tests
[X] Task 4: Update API documentation