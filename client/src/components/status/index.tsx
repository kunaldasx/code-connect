/**
 * Server status component that displays uptime monitoring from BetterStack.
 * Features:
 * - Real-time status updates
 * - Auto-refresh every 15s
 * - Color-coded status indicators
 * - Status descriptions
 *
 * By Kunal Das (https://kunaldasx.vercel.app)
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/spinner";
import { STATUS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import type { ServerStatusResponse, ServiceStatus } from "./types";

const REFRESH_INTERVAL = 15_000;

const getServerStatus = (server: ServerStatusResponse): ServiceStatus => {
  if (!server) {
    return {
      color: "bg-muted-foreground",
      label: "Unknown Server Status",
      description: "Unable to fetch server status",
    };
  }

  if (server.status === "online") {
    return {
      color: "bg-green-600",
      label: "Server Online",
      description: `${server.users} active users`,
    };
  }

  return {
    color: "bg-red-600",
    label: "Server Offline",
    description: "Server is offline",
  };
};

const Status = () => {
  const [systemStatus, setSystemStatus] = useState<ServiceStatus>({
    color: "bg-muted-foreground",
    label: "Unknown Server Status",
    description: "Unable to fetch server status",
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/status`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch status");
      }

      const data = (await response.json()) as ServerStatusResponse;

      setSystemStatus(getServerStatus(data));
    } catch (error) {
      console.error("Error fetching server status:", error);

      setSystemStatus({
        color: "bg-red-600",
        label: "Server Offline",
        description: "Failed to reach server",
      });
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const intervalId = setInterval(() => {
      setIsRefreshing(true);
      fetchStatus();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  return (
    <a
      aria-label={`Server Status: ${systemStatus.description}`}
      className={cn(
        "flex items-center gap-x-2 text-foreground/70 text-sm underline-offset-2 transition-all hover:text-foreground/50 hover:underline",
        isInitialLoad && "cursor-wait",
      )}
      href={STATUS_URL}
      rel="noreferrer"
      target="_blank"
    >
      {isInitialLoad ? (
        <>
          <Spinner />
          <span>Checking Server Status...</span>
        </>
      ) : (
        <>
          <span
            aria-label={systemStatus.label}
            className="relative flex size-2"
            role="status"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                systemStatus.color,
                isRefreshing && "animate-pulse",
              )}
            />

            <span
              aria-hidden="true"
              className={cn(
                "relative inline-flex size-2 rounded-full",
                systemStatus.color,
              )}
            />
          </span>

          <span aria-hidden="true">{systemStatus.label}</span>
        </>
      )}
    </a>
  );
};

export { Status };
