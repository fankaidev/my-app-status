"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  deleted: boolean;
}

export function ProjectAdminList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load projects on component mount
  useEffect(() => {
    fetch("/api/projects?include_deleted=true")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data as Project[]);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Failed to load projects");
        setIsLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/delete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      // Update local state
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, deleted: true } : p)));
      router.refresh();
    } catch (err) {
      setError("Failed to delete project");
    }
  };

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="font-medium">
              {project.name}
              {project.deleted && <span className="ml-2 text-sm text-red-500">(Deleted)</span>}
            </h3>
          </div>
          <div>
            {!project.deleted && (
              <button
                onClick={() => handleDelete(project.id)}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
