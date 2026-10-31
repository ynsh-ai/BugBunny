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
    <header className="sticky top-0 z-40 border-b border-[#22252e] bg-[#0d0e12]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-[#f0f2f5] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] rounded"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#22252e] bg-[#13151a] text-[#f0f2f5] shadow-sm">
              <BugBunnyLogo size={18} />
            </div>
            <span className="font-semibold text-base tracking-tight text-[#f0f2f5]">
              BugBunny
            </span>
          </Link>

          <span className="hidden h-5 w-px bg-[#22252e] md:block" />

          {/* Navigation Links: Workspace, Issues, Investigations, Settings */}
          <nav className="flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] ${
                    active
                      ? "bg-[#181b21] text-[#f0f2f5] shadow-sm font-semibold"
                      : "text-[#9aa1b0] hover:bg-[#13151a] hover:text-[#c9d1d9]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-[#58a6ff]" : "text-[#9aa1b0]"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Dynamic Backend Mode State (Only when confirmed active) */}
        <div className="flex items-center gap-3">
          {/* Read-Only Safety Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#22252e] bg-[#13151a] px-2.5 py-1 text-[11px] font-mono text-[#9aa1b0]"
            title="All agent tools operate with strictly bounded read-only inspection."
          >
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>Read-Only Guard</span>
          </div>

          {/* Dynamic Provider State: Only displayed if confirmed configured & active by backend */}
          {systemMode && systemMode.mode === "live" && systemMode.liveAvailable && (
            <div
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-mono text-emerald-300"
              title={systemMode.message || "Live model execution active"}
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>{systemMode.model || "Gemini Live"}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
