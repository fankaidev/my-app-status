# S03: User-Project Relationship

## Requirements
- Each project should belong to a user
- Users can only see and manage their own projects
- Projects API should be protected and only accessible to authenticated users

## System Design

### Database Changes
1. Add `owner_id` column to `projects` table
   - Type: TEXT NOT NULL
   - Foreign key to user's github id
2. Add index on `owner_id` for faster lookup

### API Changes
1. Update Projects API
   - Add authentication check
   - Filter projects by current user's id
   - Add owner_id when creating new project
2. Update Project API response type to include owner information

### Frontend Changes
1. Update project list to only show current user's projects
2. Add owner information in project card (optional)

## Test Plan
1. Integration Tests
   - Test project creation with authenticated user
   - Test project listing only returns user's own projects
   - Test unauthorized access is properly rejected
   - Test project operations (update/delete) are restricted to owner

## Tasks
[X] Add owner_id to projects table
[ ] Update API to enforce user ownership
[ ] Add integration tests for user-project relationship
[ ] Update frontend components