"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiCache } from "@/lib/api-cache";
import { clearCache } from "@/lib/api-client";
import ApiDiagnostics from "@/components/api-diagnostics";
import DebugApiContent from "@/components/debug/debug-api-content";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>("");
  const handleClearAllCache = () => {
    // Clear the API client cache
    clearCache();

    // Clear the API cache
    apiCache.clear();

    setMessage("All API caches cleared successfully!");

    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">API Debugging Tools</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache Management</CardTitle>
            <CardDescription>
              Clear API caches to fetch fresh data from the server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {message && <div className="text-green-500 mb-4">{message}</div>}
              <Button onClick={handleClearAllCache}>Clear All Caches</Button>
            </p>
          </CardContent>
        </Card>

        <ApiDiagnostics />
        <DebugApiContent />
      </div>
    </div>
  );
}

export default function DebugApiPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
