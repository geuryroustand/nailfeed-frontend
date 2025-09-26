"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Account settings error:", error);

    // Check if it's an authentication error
    if (
      error.message.includes("Authentication") ||
      error.message.includes("unauthorized") ||
      error.message.includes("403")
    ) {
      // Redirect to login after a short delay
      const timeout = setTimeout(() => {
        router.push("/auth");
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [error, router]);

  // If it's a redirect error, don't show the error UI
  if (error.message === "NEXT_REDIRECT") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            variant="outline"
            className="border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            Try again
          </Button>
          <Button
            onClick={() => router.push("/me")}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
