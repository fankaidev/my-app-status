/**
 * Cloudflare Access identity.
 *
 * The site sits behind a Cloudflare Access application. After the user logs in, Access adds a signed JWT in the
 * `Cf-Access-Jwt-Assertion` header of every request. We verify that JWT (signature, issuer, audience, expiry)
 * instead of trusting `Cf-Access-Authenticated-User-Email`, so requests that reach the app without going through
 * Access (e.g. preview deployments on *.pages.dev) are rejected.
 *
 * Required env vars:
 * - ACCESS_TEAM_DOMAIN: e.g. "myteam.cloudflareaccess.com"
 * - ACCESS_AUD: the Application Audience (AUD) tag of the Access application
 *
 * Optional (non-production only):
 * - ACCESS_DEV_EMAIL: pretend this user is logged in, for `next dev`
 */

export interface AccessUser {
  email: string;
}

interface Jwk extends JsonWebKey {
  kid?: string;
}

const JWT_HEADER = "Cf-Access-Jwt-Assertion";
const CERTS_TTL_MS = 10 * 60 * 1000;

let certsCache: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;

function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson<T>(input: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(input))) as T;
}

async function getKeys(teamDomain: string, forceRefresh = false): Promise<Jwk[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    certsCache &&
    certsCache.teamDomain === teamDomain &&
    now - certsCache.fetchedAt < CERTS_TTL_MS
  ) {
    return certsCache.keys;
  }

  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Access certs: ${res.status}`);
  }
  const body = (await res.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  certsCache = { teamDomain, keys, fetchedAt: now };
  return keys;
}

interface JwtPayload {
  aud?: string | string[];
  email?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
}

/**
 * Verify an Access JWT and return the user it identifies, or null if it is missing/invalid.
 */
export async function verifyAccessJwt(token: string | null | undefined): Promise<AccessUser | null> {
  return (await checkAccessJwt(token)).user;
}

export type AccessFailure =
  | "no-team-domain-env"
  | "no-aud-env"
  | "no-jwt-header"
  | "malformed-jwt"
  | "unsupported-alg"
  | "key-not-found"
  | "bad-signature"
  | "expired"
  | "not-yet-valid"
  | "bad-issuer"
  | "bad-audience"
  | "no-email"
  | "error";

/**
 * Like verifyAccessJwt, but says why verification failed. The reason is a fixed code, never token contents.
 */
export async function checkAccessJwt(
  token: string | null | undefined
): Promise<{ user: AccessUser | null; reason?: AccessFailure }> {
  const fail = (reason: AccessFailure) => ({ user: null, reason });
  const teamDomain = process.env.ACCESS_TEAM_DOMAIN;
  const expectedAud = process.env.ACCESS_AUD;
  if (!teamDomain) return fail("no-team-domain-env");
  if (!expectedAud) return fail("no-aud-env");
  if (!token) return fail("no-jwt-header");

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return fail("malformed-jwt");
    const [headerPart, payloadPart, signaturePart] = parts;

    const header = decodeJson<{ alg?: string; kid?: string }>(headerPart);
    if (header.alg !== "RS256" || !header.kid) return fail("unsupported-alg");

    let keys = await getKeys(teamDomain);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      // Keys may have rotated since we cached them.
      keys = await getKeys(teamDomain, true);
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return fail("key-not-found");

    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(signaturePart) as BufferSource,
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );
    if (!valid) return fail("bad-signature");

    const payload = decodeJson<JwtPayload>(payloadPart);
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= nowSec) return fail("expired");
    if (typeof payload.nbf === "number" && payload.nbf > nowSec) return fail("not-yet-valid");
    if (payload.iss !== `https://${teamDomain}`) return fail("bad-issuer");

    const aud = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (!aud.includes(expectedAud)) return fail("bad-audience");

    if (!payload.email) return fail("no-email");
    return { user: { email: payload.email } };
  } catch (error) {
    console.error("Access JWT verification failed:", error);
    return fail("error");
  }
}

/**
 * Resolve the logged-in user from request headers.
 */
export async function getAccessUser(headers: Headers): Promise<AccessUser | null> {
  if (process.env.NODE_ENV !== "production" && process.env.ACCESS_DEV_EMAIL) {
    return { email: process.env.ACCESS_DEV_EMAIL };
  }
  return verifyAccessJwt(headers.get(JWT_HEADER));
}
