export interface Project {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface StatusHistory {
  id: number;
  project_id: string;
  status: "operational" | "outage" | "running" | "failed";
  message?: string;
  created_at: number;
}

// Type for D1 database binding in Cloudflare Pages
export interface Env {
  DB: D1Database;
}

// Type for project with its latest status
export interface ProjectWithStatus extends Project {
  status: StatusHistory["status"];
  message?: string;
  status_updated_at?: number;
}
