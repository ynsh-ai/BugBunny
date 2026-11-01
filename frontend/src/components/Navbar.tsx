"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Activity,
  Settings,
  Sparkles,
  Lock,
  ArrowRight,
  LogOut,
  User,
} from "lucide-react";

import { BugBunnyLogo } from "./BugBunnyLogo";
import { fetchSystemMode } from "@/lib/api";
import { SystemMode } from "@/mock/types";

interface StoredUser {
  email: string;
  name: string;
  provider?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    fetchSystemMode()
      .then((sm) => setSystemMode(sm))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkUser = () => {
      try {
        const stored = localStorage.getItem("bugbunny_user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    const timer = setTimeout(checkUser, 0);
    window.addEventListener("storage", checkUser);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", checkUser);
    };
  }, [pathname]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("bugbunny_user");
      setUser(null);
    } catch {
      // ignore
    }
  };

  const navItems = [
    { name: "Workspace", href: "/", icon: LayoutDashboard, exact: true },
    { name: "Issues", href: "/issues", icon: AlertCircle, exact: false },
    { name: "Investigations", href: "/investigations", icon: Activity, exact: false },
    { name: "Settings", href: "/settings", icon: Settings, exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className="sticky top-0 z-40 border-b border-[#DADDD3] bg-[#F5F5F0]/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
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

          <span className="hidden h-5 w-px bg-[#DADDD3] md:block" />

          {/* Navigation Links: Workspace, Issues, Investigations, Settings */}
          <nav className="flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171916] ${
                    active
                      ? "bg-[#171916] text-[#F5F5F0] font-semibold shadow-2xs"
                      : "text-[#777D71] hover:bg-[#E8EAE3] hover:text-[#171916]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-[#C6F36B]" : "text-[#777D71]"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Security, Provider State & Get Started */}
        <div className="flex items-center gap-2.5">
          {/* Read-Only Guard Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-2.5 py-1 text-[11px] font-mono text-[#171916]"
            title="All agent tools operate with strictly bounded read-only inspection."
          >
            <Lock className="h-3 w-3 text-[#35A56A]" />
            <span>Read-Only Guard</span>
          </div>

          {/* Dynamic Provider State */}
          {systemMode && systemMode.liveAvailable && (
            <div
              className="hidden md:flex items-center gap-1.5 rounded-xs border border-[#C6F36B] bg-[#C6F36B]/25 px-2.5 py-1 text-[11px] font-mono font-medium text-[#171916]"
              title={`Active provider: ${systemMode.provider || "Gemini"} (${systemMode.model || "gemini-1.5-pro"})`}
            >
              <Sparkles className="h-3 w-3 text-[#171916]" />
              <span>Gemini Live</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#35A56A] animate-pulse" />
            </div>
          )}

          {systemMode && !systemMode.liveAvailable && (
            <div
              className="hidden md:flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-2.5 py-1 text-[11px] font-mono text-[#777D71]"
              title="Provider offline. Deterministic simulation active."
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#D99A37]" />
              <span>Demo Mode</span>
            </div>
          )}

          {/* User Profile or Get Started CTA */}
          {!isAuthPage && (
            <>
              {user ? (
                <div className="flex items-center gap-2 pl-1 font-mono text-xs">
                  <div className="flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-2.5 py-1 text-[11px] text-[#171916]">
                    <User className="h-3 w-3 text-[#35A56A]" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-1 rounded-xs text-[#777D71] hover:text-[#171916] hover:bg-[#E8EAE3] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] px-3 py-1.5 text-xs font-bold border border-[#AEE64E] shadow-2xs transition-all active:translate-y-px"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
