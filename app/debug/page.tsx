import DebugImageUrl from "@/components/debug-image-url";

export default function DebugPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image URL Debugging</h1>
      <DebugImageUrl />
    </div>
  );
}
