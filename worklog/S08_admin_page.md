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
[X] Task 2: Create admin page with protected route
    - Created src/app/admin/page.tsx with authentication check
    - Created src/components/project-admin-list.tsx for project management
    - Updated middleware to protect admin routes
[X] Task 3: Implement delete API endpoint
    - Created PUT /api/projects/[id]/delete endpoint
    - Added authentication check
    - Implemented soft delete functionality
[X] Task 4: Update project list to filter deleted items
    - Updated getProjects function to filter out deleted projects by default
    - Added includeDeleted option to getProjects
    - Updated /api/projects endpoint to support include_deleted parameter
    - Admin page shows all projects while main page shows only active ones
[ ] Task 5: Add tests for new functionality

Would you like me to proceed with Task 5: Add tests for new functionality?