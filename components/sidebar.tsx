"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  PlusSquare,
  User,
  Menu,
  Bookmark,
  Palette,
  Lightbulb,
  Folder,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  activeItem?: string;
}

export default function Sidebar({ activeItem = "home" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
    { id: "search", icon: Search, label: "Search", href: "/" },
    // { id: "explore", icon: Compass, label: "Explore", href: "/explore" },
    {
      id: "suggestions",
      icon: Lightbulb,
      label: "Community Ideas",
      href: "/suggestions",
    },
    { id: "messages", icon: MessageCircle, label: "Messages", href: "/" },
    { id: "notifications", icon: Heart, label: "Notifications", href: "/" },
    { id: "create", icon: PlusSquare, label: "Create", href: "/" },
    { id: "profile", icon: User, label: "Profile", href: "/me" },
    {
      id: "collections",
      icon: Bookmark,
      label: "Collections",
      href: "/collections",
    },
    // { id: "mood", icon: Palette, label: "Mood", href: "/mood" },
  ];

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-white py-6 transition-all duration-300",
        collapsed ? "items-center" : "items-start"
      )}
    >
      <div className="px-4 mb-8">
        {collapsed ? (
          <Link href="/" className="w-10 h-10 flex items-center justify-center">
            <span className="text-2xl font-bold">N</span>
          </Link>
        ) : (
          <Link href="/">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              NailFeed
            </h1>
          </Link>
        )}
      </div>

      <div className="flex-1 w-full">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          const requiresAuth = [
            "/me",
            "/mood",
            "/messages",
            "/notifications",
          ].some((path) => item.href.startsWith(path));

          if (requiresAuth) {
            return (
              <div key={item.id} className="w-full block">
                <motion.div
                  className={cn(
                    "flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "font-medium text-pink-500"
                      : "text-gray-700 hover:bg-gray-100",
                    collapsed ? "justify-center" : "justify-start"
                  )}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push(item.href);
                    } else {
                      const callbackUrl = encodeURIComponent(item.href);
                      router.push(`/auth?callbackUrl=${callbackUrl}`);
                    }
                  }}
                >
                  <Icon
                    className={cn("h-6 w-6", isActive && "text-pink-500")}
                  />
                  {!collapsed && <span className="ml-4">{item.label}</span>}
                </motion.div>
              </div>
            );
          }

          // For public routes, use regular Link
          return (
            <Link href={item.href} key={item.id} className="w-full block">
              <motion.div
                className={cn(
                  "flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-colors",
                  isActive
                    ? "font-medium text-pink-500"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed ? "justify-center" : "justify-start"
                )}
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className={cn("h-6 w-6", isActive && "text-pink-500")} />
                {!collapsed && <span className="ml-4">{item.label}</span>}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto w-full">
        {isAuthenticated ? (
          <>
            <Link href="/me" className="w-full block">
              <div
                className={cn(
                  "flex items-center px-4 py-3",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/diverse-avatars.png" alt="Your profile" />
                  <AvatarFallback>YP</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="ml-3">
                    <p className="text-sm font-medium">Your Profile</p>
                  </div>
                )}
              </div>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center mt-2"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu className="h-5 w-5 mr-2" />
              {!collapsed && <span>Collapse</span>}
            </Button>
          </>
        ) : (
          <div className={cn("px-4 py-3", collapsed ? "text-center" : "")}>
            <div className="space-y-2">
              <Link href="/auth">
                <Button variant="outline" className="w-full bg-transparent">
                  Log in
                </Button>
              </Link>
              <Link href="/auth?tab=signup">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
