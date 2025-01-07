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
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
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

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to restore project");
      }

      // Update local state
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, deleted: false } : p)));
      router.refresh();
    } catch (err) {
      setError("Failed to restore project");
    }
  };

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const activeProjects = projects.filter((p) => !p.deleted);
  const deletedProjects = projects.filter((p) => p.deleted);

  return (
    <div className="space-y-8">
      {/* Active Projects */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
        <div className="space-y-4">
          {activeProjects.map((project) => (
            <div key={project.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
              <div>
                <h3 className="font-medium">{project.name}</h3>
              </div>
              <div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {activeProjects.length === 0 && <p className="text-gray-500">No active projects</p>}
        </div>
      </section>

      {/* Deleted Projects */}
      {deletedProjects.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-600">Deleted Projects</h2>
          <div className="space-y-4">
            {deletedProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow">
                <div>
                  <h3 className="font-medium text-gray-600">{project.name}</h3>
                </div>
                <div>
                  <button
                    onClick={() => handleRestore(project.id)}
                    className="px-4 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
