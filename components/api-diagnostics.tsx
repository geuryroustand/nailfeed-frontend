"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EnvStatus = {
  tokenExists: boolean;
  apiUrl: string;
};

export default function ApiDiagnostics() {
  const [isVisible, setIsVisible] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);

  // Load API URL and "token exists" from server (no secrets leaked)
  useEffect(() => {
    const loadEnv = async () => {
      try {
        const res = await fetch("/api/env/status", { cache: "no-store" });
        const data = (await res.json()) as EnvStatus;
        setEnvStatus(data);
        setApiUrl(data.apiUrl || "");
      } catch {
        setEnvStatus({ tokenExists: false, apiUrl: "" });
      }
    };
    loadEnv();
  }, []);

  const [apiUrl, setApiUrl] = useState("");
  const [endpoint, setEndpoint] = useState("/api/posts");
  const [queryParams, setQueryParams] = useState(
    "populate=*&pagination[page]=1&pagination[pageSize]=5"
  );
  // Keep the UI input for token, but do NOT read from env; optional override path via proxy
  const [token, setToken] = useState("");

  const constructFullUrl = () => {
    let baseUrl = apiUrl;
    if (!baseUrl.endsWith("/")) baseUrl += "/";
    let path = endpoint;
    if (path.startsWith("/")) path = path.substring(1);
    const fullUrl = `${baseUrl}${path}${queryParams ? `?${queryParams}` : ""}`;
    return fullUrl;
  };

  const testApi = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    setResponseStatus(null);
    setRequestDetails(null);

    try {
      const fullPath = `${endpoint}${queryParams ? `?${queryParams}` : ""}`;

      setRequestDetails({
        url: constructFullUrl(),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "GET",
        via: "/api/auth-proxy",
      });

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: fullPath,
          method: "GET",
          // If user provided a token in the diagnostics UI, allow an override (server decides final precedence)
          authorizationOverride: token ? `Bearer ${token}` : undefined,
        }),
      });

      setResponseStatus(response.status);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${responseText}`);
      }

      try {
        const jsonData = JSON.parse(responseText);
        setApiResponse(JSON.stringify(jsonData, null, 2));
      } catch {
        setApiResponse(responseText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    setResponseStatus(null);

    try {
      const directUrl = "/api/auth-proxy";

      setRequestDetails({
        url: directUrl,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "POST",
        via: "/api/auth-proxy (server)",
      });

      const response = await fetch(directUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint:
            "/api/posts?populate=*&pagination[page]=1&pagination[pageSize]=5",
          method: "GET",
          authorizationOverride: token ? `Bearer ${token}` : undefined,
        }),
      });

      setResponseStatus(response.status);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${responseText}`);
      }

      try {
        const jsonData = JSON.parse(responseText);
        setApiResponse(JSON.stringify(jsonData, null, 2));
      } catch {
        setApiResponse(responseText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          aria-label="Open API Diagnostics"
        >
          API Diagnostics
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[600px] max-w-[95vw]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Diagnostics</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            aria-label="Close API Diagnostics"
          >
            Close
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="custom">
            <TabsList className="mb-4">
              <TabsTrigger value="custom">Custom Request</TabsTrigger>
              <TabsTrigger value="direct">Direct Fetch</TabsTrigger>
              <TabsTrigger value="env">Environment</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="api-url">API Base URL</Label>
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/posts"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="query-params">Query Parameters</Label>
                <Input
                  id="query-params"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  placeholder="populate=*&pagination[page]=1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="token">Auth Token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  type="password"
                  placeholder="Optional JWT or token"
                />
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">
                  Full URL: {constructFullUrl()}
                </p>
                <Button
                  onClick={testApi}
                  disabled={isLoading}
                  className="w-full"
                  aria-label="Test API Connection"
                >
                  {isLoading ? "Testing..." : "Test API Connection"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="direct" className="space-y-4">
              <p className="text-sm">
                This makes a request via the server proxy with a hardcoded
                endpoint.
              </p>

              <div className="grid gap-2">
                <Label htmlFor="direct-token">Auth Token</Label>
                <Input
                  id="direct-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  type="password"
                  placeholder="Optional JWT or token"
                />
              </div>

              <Button
                onClick={testDirectFetch}
                disabled={isLoading}
                className="w-full"
                aria-label="Test Direct Fetch"
              >
                {isLoading ? "Testing..." : "Test Direct Fetch"}
              </Button>
            </TabsContent>

            <TabsContent value="env" className="space-y-2">
              <div className="text-xs space-y-1">
                <p>API URL: {envStatus?.apiUrl || "Not set"}</p>
                <p>Token exists: {envStatus?.tokenExists ? "Yes" : "No"}</p>
                <p>Environment: {process.env.NODE_ENV || "Not set"}</p>
              </div>
            </TabsContent>
          </Tabs>

          {requestDetails && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-1">Request Details</h4>
              <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-auto max-h-32">
                <pre>{JSON.stringify(requestDetails, null, 2)}</pre>
              </div>
            </div>
          )}

          {responseStatus !== null && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Response Status</h4>
              <div
                className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                  responseStatus >= 200 && responseStatus < 300
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {responseStatus}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-1">Error</h4>
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800 overflow-auto max-h-40">
                {error}
              </div>
            </div>
          )}

          {apiResponse && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-1">Response</h4>
              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800 overflow-auto max-h-80">
                <pre>{apiResponse}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
