# Story: Admin Page with Project Deletion

## Requirements
- Add an admin page that is only accessible after user login
- Allow admin to soft delete projects (hide instead of hard delete)
- Deleted projects should not appear in the main project list
- Keep project data in database for potential recovery

## System Design

### Database Changes
- Add `deleted` column to `projects` table (boolean, default false)
- Update project queries to filter out deleted projects

### Components
1. Admin Page (`src/app/admin/page.tsx`)
   - Protected route that checks for user session
   - Display list of all projects with delete buttons
   - Use client-side component for delete functionality

2. Project List Component Enhancement
   - Update queries to exclude deleted projects
   - Add filter in SQL queries

### API Changes
1. New API endpoint for project deletion
   - PUT /api/projects/:id/delete
   - Updates deleted flag to true
   - Requires authentication

## Test Plan
1. Database Tests
   - Test soft delete functionality
   - Verify deleted projects are filtered out

2. API Tests
   - Test delete endpoint with authentication
   - Test unauthorized access
   - Verify project list filtering

3. UI Tests
   - Verify admin page is only accessible when logged in
   - Test delete functionality
   - Verify deleted projects don't appear in main list

## Tasks
[X] Task 1: Add deleted column to projects table
    - Created migration file 0001_add_deleted_flag.sql
    - Added deleted column with default value false
[ ] Task 2: Create admin page with protected route
    - Create src/app/admin/page.tsx
    - Add authentication check using middleware
    - Create ProjectAdminList component
[ ] Task 3: Implement delete API endpoint
[ ] Task 4: Update project list to filter deleted items
[ ] Task 5: Add tests for new functionality