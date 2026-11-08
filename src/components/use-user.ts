"use client";

import { useEffect, useState } from "react";

export type UserStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Who is logged in through Cloudflare Access (login itself is handled by Access, not by this app).
 */
export function useUser(): { email: string | null; status: UserStatus } {
  const [state, setState] = useState<{ email: string | null; status: UserStatus }>({
    email: null,
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { email: string };
        if (!cancelled) setState({ email: data.email, status: "authenticated" });
      })
      .catch(() => {
        if (!cancelled) setState({ email: null, status: "unauthenticated" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
