import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";
import { getProfile } from "./get-profile";
import { AccountTabs } from "./tabs";

// Mark this page as dynamic
export const dynamic = "force-dynamic";

// Loading component for Suspense
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-500" />
        <p className="mt-2 text-gray-600">Loading your profile...</p>
      </div>
    </div>
  );
}

export default async function AccountSettingsPage() {
  // Fetch profile data on the server
  const { profile, user, isAuthenticated } = await getProfile();

  // Handle authentication check
  if (!isAuthenticated) {
    // This redirect will be handled properly by Next.js
    redirect("/auth");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="profile" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
            <div className="flex items-center mb-6">
              <Link href="/profile" className="mr-4 md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold">Account Settings</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Suspense fallback={<LoadingState />}>
                <AccountTabs profile={profile} user={user} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="profile" />
      </div>
    </main>
  );
}
