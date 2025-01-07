# S09: Improve Testing Approach

## User Requirement
Improve testing logic by relying on public endpoints only for verification, instead of directly querying the database.

## System Design

### Current Issues
1. Tests are tightly coupled with database implementation
2. Tests bypass API layer by directly querying database
3. Tests might pass even if API endpoints are broken
4. Not testing actual user experience flow

### Proposed Changes

#### 1. Test Structure Changes
- Remove direct database queries in test assertions
- Use only public REST API endpoints for verification
- Keep database setup for test data preparation
- Test like a real API client would

#### 2. Test Flow Example
Before:
```typescript
// Direct DB query for verification
const result = await db.prepare("SELECT status FROM status_history").bind().first();
expect(result.status).toBe("operational");
```

After:
```typescript
// Use REST API endpoint for verification
const response = await GET(new Request(`http://localhost/api/projects/${id}`));
expect(response.status).toBe(200);
const project = await response.json();
expect(project.status).toBe("operational");
```

### Test Plan

1. Project Status API Tests
- Update existing project status
  ```typescript
  // Update status
  const updateResponse = await POST(
    new Request("http://localhost/api/projects/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "test-1", status: "operational" })
    })
  );
  expect(updateResponse.status).toBe(200);

  // Verify through GET
  const getResponse = await GET(new Request(`http://localhost/api/projects/test-1`));
  const project = await getResponse.json();
  expect(project.status).toBe("operational");
  ```

2. Project Admin Tests
- Soft delete project
  ```typescript
  // Delete project
  const deleteResponse = await DELETE(
    new Request(`http://localhost/api/projects/test-1`)
  );
  expect(deleteResponse.status).toBe(200);

  // Verify through list with include_deleted
  const listResponse = await GET(
    new Request("http://localhost/api/projects?include_deleted=true")
  );
  const projects = await listResponse.json();
  const deleted = projects.find(p => p.id === "test-1");
  expect(deleted.deleted).toBe(true);
  ```

3. Project List Tests
- List active projects
  ```typescript
  const response = await GET(new Request("http://localhost/api/projects"));
  const projects = await response.json();
  expect(Array.isArray(projects)).toBe(true);
  expect(projects.every(p => !p.deleted)).toBe(true);
  ```

## Tasks
[X] ~~Create API client utilities~~ (Changed approach to direct REST API usage)
[X] Refactor project-status.test.ts
[X] Refactor project-admin.test.ts
[ ] Refactor projects.test.ts
[ ] Add new test cases for edge cases
[ ] Update test documentation

## Notes
- Keep using test database for data setup
- Only use direct DB access for test data preparation
- All verifications should use public REST API endpoints
- Test like a real API client would