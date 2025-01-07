export interface Project {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

// Status values representing service health
export type ServiceStatus =
  | "operational" // Service is functioning normally
  | "degraded" // Service is experiencing some issues but still functioning
  | "outage" // Service is completely down
  | "maintenance" // Planned maintenance
  | "unknown"; // Status cannot be determined

export interface StatusHistory {
  id: number;
  project_id: string;
  status: ServiceStatus;
  message?: string;
  created_at: number;
}

// Type for D1 database binding in Cloudflare Pages
export interface Env {
  DB: D1Database;
}

// Type for project with its latest status
export interface ProjectWithStatus extends Project {
  status: ServiceStatus;
  message?: string;
  status_updated_at?: number;
}
