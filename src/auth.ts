import { getAccessUser } from "@/lib/access";
import { headers } from "next/headers";

export interface Session {
  user: { email: string };
  expires?: string;
}

/**
 * Returns the user logged in through Cloudflare Access, or null.
 * Keeps the `{ user: { email } }` shape so route handlers can use `session?.user?.email`.
 */
export async function auth(): Promise<Session | null | undefined> {
  const user = await getAccessUser(headers());
  return user ? { user } : null;
}
