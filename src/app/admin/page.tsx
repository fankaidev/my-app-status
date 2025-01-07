"use client";

import { ProjectAdminList } from "@/components/project-admin-list";
import { TokenList } from "@/components/token-list";
import { fetchApi } from "@/lib/api-client";
import { UserToken } from "@/lib/token-utils";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      const { data, error } = await fetchApi<UserToken[]>("/api/tokens");
      if (data) {
        setTokens(data);
      }
      setLoading(false);
    };

    loadTokens();
  }, []);

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Project Administration</h1>

      {/* Project Management */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        <ProjectAdminList />
      </section>

      {/* Token Management */}
      <section>
        <h2 className="text-xl font-semibold mb-4">API Tokens</h2>
        <TokenList initialTokens={tokens} />
      </section>
    </main>
  );
}
