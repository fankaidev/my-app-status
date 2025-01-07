-- Add deleted column to projects table
ALTER TABLE projects ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT 0;
