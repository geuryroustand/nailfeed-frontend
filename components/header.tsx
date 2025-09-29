"use client";

import { Bell, MessageCircle, BookOpen, Bookmark, FolderHeart, ChevronRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/image-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { logoutAction } from "@/app/actions/auth-actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, isAuthenticated, isLoading, clearUserState, checkAuthStatus } =
    useAuth();
  const userProfileImageUrl = user?.profileImage?.url
    ? normalizeImageUrl(user.profileImage.url)
    : undefined;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lookBookExpanded, setLookBookExpanded] = useState(false);

  // Set mounted state to true after component mounts
  useEffect(() => {
    setMounted(true);
    // Check auth status when component mounts
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Debug effect to log auth state in header
  useEffect(() => {
    if (mounted) {
      console.log("[SERVER]\nHeader auth state:", { isAuthenticated, user });
    }
  }, [isAuthenticated, user, mounted]);

  // ✅ SECURITY: Use server action for logout
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    try {
      const result = await logoutAction();
      if (result.success) {
        clearUserState(); // Clear client-side state
      } else {
        console.error("Logout failed:", result.error);
        // Still clear client state even if server logout fails
        clearUserState();
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear client state even if server logout fails
      clearUserState();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't render anything until after client-side hydration
  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-3">
      <div className="container max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-2">
                  N
                </div>
                <h1 className="text-xl font-bold hidden sm:block">NailFeed</h1>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Middle section - removed search input */}
        <div className="flex-1"></div>

        <div className="flex items-center space-x-1">
          {isLoading ? (
            // Show loading state
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : !isAuthenticated ? (
            <div className="hidden sm:flex items-center space-x-2 mr-2">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
              </Button>

              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </Button>

              {/* Display username when authenticated */}
              <span className="hidden md:inline-block text-sm font-medium mr-2">
                {user?.displayName || user?.username}
              </span>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 ml-1"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfileImageUrl} alt="Your profile" />
                  <AvatarFallback>
                    {user?.username?.substring(0, 2).toUpperCase() || "YP"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem>
                    <Link href="/me" className="flex items-center w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Look Book Section - Expandable */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLookBookExpanded(!lookBookExpanded);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Look Book
                      </div>
                      {lookBookExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuItem>

                  {/* Look Book Submenu */}
                  {lookBookExpanded && (
                    <>
                      <DropdownMenuItem className="pl-8">
                        <Link href="/me/saved" className="flex items-center w-full gap-2">
                          <Bookmark className="h-4 w-4" />
                          Saved Posts
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="pl-8">
                        <Link
                          href="/me/collections"
                          className="flex items-center w-full gap-2"
                        >
                          <FolderHeart className="h-4 w-4" />
                          My Collections
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <Link
                      href="/me/settings"
                      className="flex items-center w-full"
                    >
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer"
                  >
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem>
                    <Link href="/auth" className="flex items-center w-full">
                      Login / Sign up
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
