"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { API_CONFIG, constructApiUrl, getAuthHeaders } from "@/lib/config";

export default function ApiStatusIndicator() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">(
    "loading"
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const checkApiStatus = async () => {
    setStatus("loading");
    try {
      // Try to fetch the posts endpoint which should be public
      const response = await fetch(
        constructApiUrl("posts?pagination[page]=1&pagination[pageSize]=1"),
        {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      setStatus(response.ok ? "online" : "offline");
    } catch (error) {
      console.error("API status check failed:", error);
      setStatus("offline");
    }

    setLastChecked(new Date());
  };

  useEffect(() => {
    // Only run in development or preview environments
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_VERCEL_ENV?.includes("preview")
    ) {
      setIsVisible(false);
      return;
    }

    checkApiStatus();

    // Check status every 5 minutes
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white rounded-md shadow-md p-2 flex items-center space-x-2">
        {status === "loading" && (
          <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
        )}
        {status === "online" && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        {status === "offline" && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}

        <span className="text-xs font-medium">
          API:{" "}
          {status === "loading"
            ? "Checking..."
            : status === "online"
            ? "Online"
            : "Offline"}
        </span>

        <button
          onClick={checkApiStatus}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
