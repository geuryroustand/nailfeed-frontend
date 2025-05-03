"use client";

import { SearchProvider } from "@/context/search-context";
import { Toaster } from "@/components/ui/toaster";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      {children}
      <Toaster />
    </SearchProvider>
  );
}
