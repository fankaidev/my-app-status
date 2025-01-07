# Display Last Update Time for Projects

## Requirements
- Display the last update time for each project in the project card ✅
- Time should be displayed in a human-readable format (e.g. "2 hours ago") ✅
- Time updates when project status changes ✅

## Design
### Data Flow
1. Backend already stores `updated_at` timestamp in both `projects` and `status_history` tables ✅
2. API endpoint `/api/projects` includes the last update time in response ✅
3. Frontend uses built-in time formatter to display relative time ✅

### UI Design
- Add last update time below the status message in project card ✅
- Use subtle gray color (text-gray-400) to not distract from status ✅
- Time is displayed in human-readable format ✅

## Tasks
[X] Task 1: Update API response to include last update time
[X] Task 2: Update ProjectCard component to display formatted time

## Implementation Notes
- Uses built-in time formatter showing:
  - "just now" for < 1 minute
  - "X minutes ago" for < 1 hour
  - "X hours ago" for < 1 day
  - "X days ago" for older times
- Uses `status_updated_at` from latest status history if available, falls back to `updated_at` from project
- Time display is in text-xs size and text-gray-400 color for subtle appearance