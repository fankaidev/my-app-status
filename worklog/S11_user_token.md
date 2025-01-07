# User Token Implementation

## Requirements
- Generate token for each user
- Token should be used as bearer token for updating project status
- Token should be unique and secure
- Token should be revocable
- Token should be visible to user in admin panel

## System Design

### Database Changes
We need to add a new table `user_tokens` to store user tokens:
```sql
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

CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token);
```

### API Changes

#### New Endpoints
1. `POST /api/tokens`
   - Create a new token for current user
   - Input: token name
   - Output: token value (only shown once)

2. `GET /api/tokens`
   - List all tokens for current user
   - Output: list of tokens with id, name, created_at, last_used_at, revoked_at

3. `DELETE /api/tokens/:id`
   - Revoke a token
   - Input: token id
   - Output: success status

#### Modified Endpoints
1. `POST /api/projects/status`
   - Accept bearer token in Authorization header
   - Validate token and update last_used_at
   - Return 401 if token is invalid or revoked

### UI Changes
1. Add new section in admin panel for token management
   - List all tokens
   - Create new token
   - Revoke token
   - Show token value after creation

### Security Considerations
1. Token Format
   - Use UUID v4 for token id
   - Use secure random string for token value
   - Store hashed token in database

2. Token Validation
   - Check if token exists
   - Check if token is not revoked
   - Update last_used_at timestamp

## Tasks
[X] Create database migration for user_tokens table
[ ] Add token generation and validation utilities
[ ] Add token management API endpoints
[ ] Update status update API to support token auth
[ ] Add token management UI components
[ ] Add token management to admin panel
[ ] Add tests for token management
[ ] Update API documentation