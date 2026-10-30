"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Activity,
  Settings,
  Lock,
  Sparkles,
} from "lucide-react";

import { BugBunnyLogo } from "./BugBunnyLogo";
import { fetchSystemMode } from "@/lib/api";
import { SystemMode } from "@/mock/types";

export function Navbar() {
  const pathname = usePathname();
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);

  useEffect(() => {
    fetchSystemMode()
      .then((sm) => setSystemMode(sm))
      .catch(() => {});
  }, []);

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

  return (
    <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-[#f0f6fc] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] rounded"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#30363d] bg-[#161b22] text-[#f0f6fc] shadow-sm">
              <BugBunnyLogo size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-[#f0f6fc]">BugBunny</span>
            </div>
          </Link>

          <span className="hidden h-5 w-px bg-[#30363d] md:block" />

          {/* Clean GitHub-Style Navigation Links */}
          <nav className="flex items-center space-x-1" aria-label="Global Navigation">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] ${
                    active
                      ? "bg-[#21262d] text-[#f0f6fc]"
                      : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-[#58a6ff]" : "text-[#8b949e]"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Security Policy & Runtime Mode */}
        <div className="flex items-center gap-3">
          {/* Read-only safety badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#161b22] px-2.5 py-1 text-[11px] font-mono text-[#8b949e]"
            title="BugBunny enforces strictly read-only repository inspection and never commits changes without explicit user approval."
          >
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>Read-Only Guard</span>
          </div>

          {/* Model Provider Status */}
          {systemMode && (
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono ${
                systemMode.mode === "live"
                  ? "border-purple-800/60 bg-purple-950/40 text-purple-300"
                  : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
              }`}
              title={systemMode.message || (systemMode.mode === "live" ? "Live model execution active" : "Demo mode active")}
            >
              {systemMode.mode === "live" ? (
                <>
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  <span>{systemMode.model || "Gemini Live"}</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8b949e]" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
