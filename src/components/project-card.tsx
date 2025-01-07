import { ServiceStatus } from "@/types/db";

interface Project {
  id: string;
  name: string;
  status: ServiceStatus;
  message?: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = getStatusColor(project.status);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
        <div className={`w-3 h-3 rounded-full ${statusColor}`} />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600 capitalize">{project.status}</p>
        {project.message && <p className="text-sm text-gray-500">{project.message}</p>}
      </div>
    </div>
  );
}

function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case "operational":
      return "bg-green-500"; // Green for normal operation
    case "degraded":
      return "bg-yellow-500"; // Yellow for degraded performance
    case "outage":
      return "bg-red-500"; // Red for complete outage
    case "maintenance":
      return "bg-blue-500"; // Blue for planned maintenance
    case "unknown":
    default:
      return "bg-gray-500"; // Gray for unknown status
  }
}
