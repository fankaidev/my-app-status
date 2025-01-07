import { D1Database } from "@cloudflare/workers-types";
import { createHash, randomBytes } from "crypto";

/**
 * Token format: "ast_" + 32 bytes of random data in hex
 * Example: ast_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
 */
const TOKEN_PREFIX = "ast_"; // app status token
const TOKEN_LENGTH = 64; // 32 bytes in hex = 64 characters

export interface UserToken {
    id: string;
    user_id: string;
    name: string;
    created_at: number;
    last_used_at?: number;
    revoked_at?: number;
}

/**
 * Generate a new token value
 * @returns token value in format "ast_<random_hex>"
 */
export function generateToken(): string {
    const randomHex = randomBytes(32).toString("hex");
    return `${TOKEN_PREFIX}${randomHex}`;
}

/**
 * Hash a token value for storage
 * @param token The token value to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/**
 * Validate a token format
 * @param token The token to validate
 * @returns true if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
    return (
        typeof token === "string" &&
        token.startsWith(TOKEN_PREFIX) &&
        token.length === TOKEN_PREFIX.length + TOKEN_LENGTH
    );
}

/**
 * Extract token from Authorization header
 * @param authHeader The Authorization header value
 * @returns token value if valid, null otherwise
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    return isValidTokenFormat(token) ? token : null;
}

/**
 * Validate a token and return the associated user
 * @param db The D1 database instance
 * @param token The token to validate
 * @returns user_id if token is valid, null otherwise
 */
export async function validateToken(
    db: D1Database,
    token: string
): Promise<string | null> {
    const hashedToken = hashToken(token);

    const stmt = db.prepare(`
    SELECT user_id, revoked_at
    FROM user_tokens
    WHERE token = ?
  `).bind(hashedToken);

    const result = await stmt.first<{ user_id: string; revoked_at: number | null }>();
    if (!result || result.revoked_at) {
        return null;
    }

    // Update last_used_at
    await db
        .prepare(
            `UPDATE user_tokens SET last_used_at = unixepoch() WHERE token = ?`
        )
        .bind(hashedToken)
        .run();

    return result.user_id;
}

/**
 * Create a new token for a user
 * @param db The D1 database instance
 * @param user_id The user's email
 * @param name The token name
 * @returns The token value (only returned once) and token id
 */
export async function createUserToken(
    db: D1Database,
    user_id: string,
    name: string
): Promise<{ token: string; id: string }> {
    const id = crypto.randomUUID();
    const token = generateToken();
    const hashedToken = hashToken(token);

    await db
        .prepare(
            `INSERT INTO user_tokens (id, user_id, token, name)
       VALUES (?, ?, ?, ?)`
        )
        .bind(id, user_id, hashedToken, name)
        .run();

    return { token, id };
}

/**
 * List all tokens for a user
 * @param db The D1 database instance
 * @param user_id The user's email
 * @returns Array of user tokens (without token values)
 */
export async function listUserTokens(
    db: D1Database,
    user_id: string
): Promise<UserToken[]> {
    const stmt = db.prepare(`
    SELECT id, user_id, name, created_at, last_used_at, revoked_at
    FROM user_tokens
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(user_id);

    const result = await stmt.all<UserToken>();
    return result.results;
}

/**
 * Revoke a token
 * @param db The D1 database instance
 * @param id The token id
 * @param user_id The user's email (for verification)
 * @returns true if token was revoked, false if token not found or already revoked
 */
export async function revokeToken(
    db: D1Database,
    id: string,
    user_id: string
): Promise<boolean> {
    const result = await db
        .prepare(
            `UPDATE user_tokens
       SET revoked_at = unixepoch()
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`
        )
        .bind(id, user_id)
        .run();

    return result.success && result.meta?.changes === 1;
}