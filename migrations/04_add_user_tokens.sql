-- Create user_tokens table for storing API tokens
CREATE TABLE user_tokens (
    id TEXT PRIMARY KEY,           -- token id
    user_id TEXT NOT NULL,         -- user email
    token TEXT NOT NULL,           -- hashed token
    name TEXT NOT NULL,            -- token name
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_used_at INTEGER,          -- when the token was last used
    revoked_at INTEGER,            -- when the token was revoked
    UNIQUE(token)
);

-- Create indexes for faster lookups
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token);