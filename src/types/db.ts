export interface Project {
  id: string;
  name: string;
  owner_id: string; // GitHub user ID
  created_at: number;
  updated_at: number;
  latest_status: ServiceStatus | null;
}

// Status values representing service health
export type ServiceStatus =
  | "operational" // Service is functioning normally
  | "degraded" // Service is experiencing some issues but still functioning
  | "major_outage" // Service is completely down
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
