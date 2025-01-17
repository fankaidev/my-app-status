-- Add latest_status column to projects table
ALTER TABLE projects
ADD COLUMN latest_status TEXT;

-- Update existing rows to set latest_status based on most recent status
UPDATE projects p
SET latest_status = (
  SELECT status
  FROM status_updates
  WHERE project_id = p.id
  ORDER BY created_at DESC
  LIMIT 1
);