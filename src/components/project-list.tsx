"use client";
import { ErrorMessages, fetchApi } from "@/lib/api-client";
import { Project } from "@/types/project";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ProjectCard } from "./project-card";

export function ProjectList() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only show loading when session is loading
    if (status === "loading") {
      setLoading(true);
      return;
    }

    // Show unauthorized when not authenticated
    if (!session) {
      setLoading(false);
      setError(ErrorMessages.UNAUTHORIZED);
      return;
    }

    async function loadProjects() {
      const result = await fetchApi<Project[]>("/api/projects");

      if (result.error) {
        setError(ErrorMessages.getErrorMessage(result.error));
        setLoading(false);
        return;
      }

      if (result.data) {
        setProjects(result.data);
        setLoading(false);
      }
    }

    loadProjects();
  }, [session, status]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    const isUnauthorized = error === ErrorMessages.UNAUTHORIZED;
    return (
      <div
        className={`bg-${isUnauthorized ? "yellow" : "red"}-50 border border-${isUnauthorized ? "yellow" : "red"
          }-200 rounded-lg p-8 text-center`}
      >
        <h3 className={`text-lg font-medium text-${isUnauthorized ? "yellow" : "red"}-900 mb-2`}>
          {isUnauthorized ? "Authentication Required" : "Error"}
        </h3>
        <p className={`text-${isUnauthorized ? "yellow" : "red"}-700 mb-4`}>{error}</p>
        {isUnauthorized && (
          <button
            onClick={() => signIn("github")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
          >
            Sign in with GitHub
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
