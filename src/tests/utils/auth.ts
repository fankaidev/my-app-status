import { getDB } from "@/db";
import { createUserToken } from "@/lib/token-utils";

/**
 * Create a fetch function that includes authentication headers
 */
export function createAuthenticatedFetch(userId: string) {
  return async (url: string, options: RequestInit = {}) => {
    // Create a token for the test user
    const db = await getDB();
    const { token } = await createUserToken(db, userId, "test-token");

    // Add auth header to request
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    return fetch(url, { ...options, headers });
  };
}
