import { UserDataDebugger } from "@/components/debug/user-data-debugger"

export default function UserDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Data Debugging</h1>
      <UserDataDebugger />
    </div>
  )
}
