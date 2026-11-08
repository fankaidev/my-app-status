"use client";

import { useEffect, useState } from "react";

/**
 * The user Cloudflare Access let in. Access guards the whole site, so there is no signed-out state to handle here;
 * the email is only used for display.
 */
export function useUser(): { email: string | null } {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { email: string };
        if (!cancelled) setEmail(data.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { email };
}
