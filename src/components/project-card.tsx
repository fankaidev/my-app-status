import { ServiceStatus } from "@/types/db";
import { Project } from "@/types/project";
import { StatusTimeline } from "./status-timeline";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = getStatusColor(project.latest_status || "unknown");
  const lastUpdateTime = formatTime(project.status_updated_at || project.updated_at);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColor}`} />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600 capitalize">{project.latest_status}</p>
        {project.message && <p className="text-sm text-gray-500">{project.message}</p>}
        <p className="text-xs text-gray-400">Last updated {lastUpdateTime}</p>
      </div>
      <div className="mt-4">
        <StatusTimeline projectId={project.id} />
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
    case "major_outage":
      return "bg-red-500"; // Red for complete major_outage
    case "maintenance":
      return "bg-violet-400"; // Bright violet for planned maintenance
    case "unknown":
    default:
      return "bg-gray-500"; // Gray for unknown status
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}
