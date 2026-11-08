-- status_history had no indexes, so every history lookup and max(created_at) scanned the whole table
-- (~550k rows), which exhausted the D1 free tier read limit.
CREATE INDEX IF NOT EXISTS idx_status_history_project_created ON status_history(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON status_history(created_at);
