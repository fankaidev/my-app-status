# Status History Display

## Requirements
- For each project, show historical status data for the past 10 status updates
- Display status history in a timeline visualization similar to the reference image
- Each status should show:
  - Status indicator (color bar)
  - Timestamp
  - Uptime percentage

## System Design

### Database Changes
1. Need to keep historical status records in database
   - We already have status_history table with required fields
   - No schema changes needed
2. Add uptime calculation logic
   - Will be calculated on the fly based on status history
   - Consider last 90 days of data
   - Uptime = (operational_time + degraded_time * 0.5) / total_time

### API Changes
1. Add new endpoint GET /api/projects/[id]/history
   - Return last 10 status records by default
   - Support limit parameter
   - Include uptime calculation
2. Update project status API to maintain history
   - Already implemented

### UI Changes
1. Add timeline visualization component
   - Use color bars to indicate status
   - Show timestamp for each status
   - Display uptime percentage
2. Add hover effects for detailed info
   - Show status message on hover
   - Show exact timestamp

## Test Plan
1. Database tests
   - Test status history storage and retrieval
   - Test uptime calculation accuracy
2. API tests
   - Test history endpoint with different limits
   - Test uptime calculation
3. Integration tests
   - Test timeline display
   - Test hover effects

## Tasks
[X] Task 1: Verify database schema for status history
[X] Task 2: Add GET /api/projects/[id]/history endpoint
[ ] Task 3: Add uptime calculation logic
[ ] Task 4: Create timeline visualization component
[ ] Task 5: Update tests for new features

## Progress Notes

### Task 2 Completion
- Added new endpoint GET /api/projects/[id]/history
- Supports limit parameter with default value of 10
- Checks project ownership before returning data
- Returns history array and placeholder for uptime (to be implemented in Task 3)