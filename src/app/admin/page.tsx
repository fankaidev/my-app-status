"use client";

import { ProjectAdminList } from "@/components/project-admin-list";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Project Administration</h1>
      <ProjectAdminList />
    </main>
  );
}
