-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Status history table
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Initial data
INSERT INTO projects (id, name) VALUES
    ('1', 'Web Frontend'),
    ('2', 'Authentication Service'),
    ('3', 'Database'),
    ('4', 'API Gateway'),
    ('5', 'Storage Service');