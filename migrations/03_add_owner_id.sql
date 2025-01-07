-- Add owner_id column to projects table
ALTER TABLE projects ADD COLUMN owner_id TEXT NOT NULL DEFAULT 'system';

-- Add index for faster lookup
CREATE INDEX idx_projects_owner_id ON projects(owner_id);

-- Update existing projects to have a default owner
-- We use 'system' as the default owner for existing projects
-- This ensures backward compatibility while enforcing NOT NULL constraint
UPDATE projects SET owner_id = 'system' WHERE owner_id = 'system';