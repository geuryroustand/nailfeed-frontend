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
import { useSearchParams } from "next/navigation";

function SearchParamsContent() {
  const searchParams = useSearchParams();
  return (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
      {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
    </pre>
  );
}

export default function DebugApiContent() {
  const [message, setMessage] = useState<string>("");

  const handleClearCache = async () => {
    try {
      await clearCache();
      setMessage("Cache cleared successfully");
    } catch (error) {
      setMessage("Failed to clear cache");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Debug Tools</CardTitle>
          <CardDescription>Tools for debugging API issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Cache Status</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                {JSON.stringify(apiCache, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">URL Parameters</h3>
              <Suspense fallback={<div>Loading URL parameters...</div>}>
                <SearchParamsContent />
              </Suspense>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleClearCache}>Clear Cache</Button>
          {message && <div className="ml-4 text-green-500">{message}</div>}
        </CardFooter>
      </Card>

      <ApiDiagnostics />
    </div>
  );
}
