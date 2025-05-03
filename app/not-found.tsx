import { Suspense } from "react";
import NotFoundContent from "@/components/not-found-content";

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
