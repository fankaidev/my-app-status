"use client";

import { StatusHistory } from "@/types/db";
import { useEffect, useState } from "react";

interface StatusTimelineProps {
  projectId: string;
}

interface HistoryResponse {
  history: StatusHistory[];
}

export function StatusTimeline({ projectId }: StatusTimelineProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/projects/${projectId}/history?limit=20`);
        if (!response.ok) {
          throw new Error("Failed to fetch status history");
        }
        const data = (await response.json()) as HistoryResponse;
        setHistory([...data.history].reverse());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [projectId]);

  if (loading) {
    return <div className="animate-pulse h-8 bg-gray-200 rounded"></div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!history.length) {
    return <div className="text-gray-500">No status history available</div>;
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-start gap-y-2 gap-x-1 justify-between">
        {history.map((status) => {
          const statusColor = {
            operational: "bg-green-500",
            degraded: "bg-yellow-500",
            major_outage: "bg-red-500",
            maintenance: "bg-violet-400",
            unknown: "bg-gray-500",
          }[status.status];

          return (
            <div
              key={status.id}
              className="group relative"
              title={`${status.status}${status.message ? `: ${status.message}` : ""}`}
            >
              <div className={`w-2 h-6 ${statusColor} rounded cursor-pointer transition-all `}></div>
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                <div>{new Date(status.created_at * 1000).toLocaleString()}</div>
                <div className="capitalize">{status.status.replace("_", " ")}</div>
                {status.message && <div>{status.message}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
