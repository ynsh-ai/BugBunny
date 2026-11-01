"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Activity,
  Settings,
  Sparkles,
  Lock,
  LogOut,
  User,
} from "lucide-react";
import { BugBunnyLogo } from "./BugBunnyLogo";
import { fetchSystemMode } from "@/lib/api";
import { SystemMode } from "@/mock/types";
import { clearStoredUser, getStoredUser, StoredUser } from "@/lib/auth";

export function DashboardNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    fetchSystemMode()
      .then((sm) => setSystemMode(sm))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkUser = () => {
      setUser(getStoredUser());
    };
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => {
      window.removeEventListener("storage", checkUser);
    };
  }, [pathname]);

  const handleSignOut = () => {
    clearStoredUser();
    setUser(null);
    router.push("/login");
  };

  const navItems = [
    { name: "Workspace", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Issues", href: "/dashboard/issues", icon: AlertCircle, exact: false, altHref: "/issues" },
    { name: "Investigations", href: "/dashboard/investigations", icon: Activity, exact: false, altHref: "/investigations" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, exact: false, altHref: "/settings" },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href) || (item.altHref ? pathname.startsWith(item.altHref) : false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#DADDD3] bg-[#F5F5F0]/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-[#171916] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171916] rounded-xs"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xs border border-[#DADDD3] bg-[#E8EAE3] shadow-2xs">
              <BugBunnyLogo size={20} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-[#171916]">
                BugBunny
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-[#777D71] uppercase tracking-wider">
                workspace
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xs transition-colors ${
                    active
                      ? "bg-[#171916] text-[#F5F5F0] shadow-2xs"
                      : "text-[#777D71] hover:text-[#171916] hover:bg-[#E8EAE3]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-[#C6F36B]" : "text-[#777D71]"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Read-Only Sandbox Guard Indicator */}
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-[#35A56A] bg-[#35A56A]/10 border border-[#35A56A]/30 px-2.5 py-1 rounded-xs">
            <Lock className="h-3 w-3 text-[#35A56A]" />
            <span className="font-semibold">READ-ONLY GUARD</span>
          </div>

          {/* Provider / Gemini Live Indicator */}
          {systemMode?.liveAvailable && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-xs border border-[#AEE64E] bg-[#C6F36B]/20 px-2.5 py-1 text-[11px] font-mono text-[#171916]">
              <Sparkles className="h-3 w-3 text-[#171916]" />
              <span className="font-medium">Gemini 1.5 Live</span>
            </div>
          )}

          {/* User Profile Chip */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#DADDD3]">
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#171916] bg-[#E8EAE3] px-2.5 py-1 rounded-xs border border-[#DADDD3]">
                <User className="h-3.5 w-3.5 text-[#777D71]" />
                <span className="font-medium truncate max-w-[100px]">{user.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 text-[#777D71] hover:text-[#D65B56] hover:bg-[#E8EAE3] rounded-xs transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-mono text-[#777D71] hover:text-[#171916] px-2 py-1"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
