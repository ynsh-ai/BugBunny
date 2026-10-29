"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  ListTodo,
  Search,
  ExternalLink,
  Shield,
  Sparkles,
} from "lucide-react";

import { BugBunnyLogo } from "./BugBunnyLogo";
import { fetchSystemMode } from "@/lib/api";
import { SystemMode } from "@/mock/types";

export function Navbar() {
  const pathname = usePathname();
  const [systemMode, setSystemMode] = useState<SystemMode>({
    mode: "demo",
    liveAvailable: false,
    provider: "gemini",
    model: "gemini-1.5-flash",
    message: "Demo Mode active",
  });

  useEffect(() => {
    fetchSystemMode()
      .then((sm) => setSystemMode(sm))
      .catch(() => {});
  }, []);

  const isOverview = pathname === "/";
  const isIssues = pathname.startsWith("/issues");

  return (
    <header className="sticky top-0 z-40 border-b border-[#22252e] bg-[#0d0e12]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Workspace Indicator */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-[#f0f2f5] hover:text-white transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#2d313d] bg-[#171920] text-emerald-400 shadow-sm">
              <BugBunnyLogo size={18} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight">BugBunny</span>
              <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 font-mono text-[10px] text-emerald-300">
                AI
              </span>
            </div>
          </Link>

          <span className="hidden h-4 w-px bg-[#22252e] md:block" />

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 text-xs">
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 font-medium transition-colors ${
                isOverview
                  ? "bg-[#1d2027] text-white"
                  : "text-[#9aa1b0] hover:bg-[#15171d] hover:text-[#f0f2f5]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Overview</span>
            </Link>

            <Link
              href="/issues"
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 font-medium transition-colors ${
                isIssues
                  ? "bg-[#1d2027] text-white"
                  : "text-[#9aa1b0] hover:bg-[#15171d] hover:text-[#f0f2f5]"
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>Issues</span>
              <span className="ml-1 rounded bg-[#252832] px-1.5 py-0.2 font-mono text-[10px] text-[#9aa1b0]">
                6
              </span>
            </Link>

            <Link
              href="/issues/PP-101"
              className="hidden lg:flex items-center gap-1 rounded px-2.5 py-1.5 text-xs text-[#9aa1b0] hover:bg-[#15171d] hover:text-[#f0f2f5] transition-colors"
            >
              <span className="font-mono text-emerald-400 text-[11px]">PP-101</span>
              <span>Investigation</span>
            </Link>
          </nav>
        </div>

        {/* Right side items: Search, Status, Links */}
        <div className="flex items-center gap-3">
          {/* Quick Filter / Search input */}
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#626875]" />
            <input
              type="text"
              readOnly
              placeholder="Search issues, repos, traces... ⌘K"
              className="w-56 rounded border border-[#22252e] bg-[#14161b] py-1 pl-8 pr-2.5 text-xs text-[#f0f2f5] placeholder-[#626875] focus:outline-none focus:border-[#383d4a] cursor-default font-mono"
            />
          </div>

          {/* Mode Badge */}
          {systemMode.mode === "live" ? (
            <div
              className="flex items-center gap-1.5 rounded border border-purple-800/70 bg-purple-950/50 px-2.5 py-1 text-[11px] font-mono text-purple-300 shadow-sm"
              title={systemMode.message || "Live Gemini Mode active with real OpenAI Agents SDK adapter"}
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Live Gemini Mode</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded border border-amber-800/70 bg-amber-950/50 px-2.5 py-1 text-[11px] font-mono text-amber-300 shadow-sm"
              title={systemMode.message || "Deterministic local demo execution"}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Demo Mode</span>
            </div>
          )}

          {/* System status pill */}
          <div className="hidden sm:flex items-center gap-2 rounded border border-[#22252e] bg-[#13151a] px-2.5 py-1 text-[11px] font-mono text-[#9aa1b0]">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="hidden md:inline">Orchestrator:</span>
            <span className="text-emerald-400">Ready</span>
          </div>

          {/* Docs / GitHub link */}
          <a
            href="https://github.com/ynsh-ai/BugBunny"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded border border-[#22252e] bg-[#13151a] px-2.5 py-1 text-xs text-[#9aa1b0] hover:border-[#2f333f] hover:text-[#f0f2f5] transition-colors"
            title="Repository on GitHub"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Repo</span>
            <ExternalLink className="h-3 w-3 text-[#626875]" />
          </a>
        </div>
      </div>
    </header>
  );
}
