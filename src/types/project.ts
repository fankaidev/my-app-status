import { ServiceStatus } from "@/types/db";

export interface Project {
    id: string;
    name: string;
    latest_status?: ServiceStatus;
    message?: string;
    updated_at: number;
    status_updated_at?: number;
    owner_id: string;
}