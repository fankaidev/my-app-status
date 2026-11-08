-- Add latest_status column to projects table
ALTER TABLE projects
ADD COLUMN latest_status TEXT;

-- Backfill latest_status from the most recent status history entry
UPDATE projects
SET latest_status = (
  SELECT status
  FROM status_history
  WHERE project_id = projects.id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
);
