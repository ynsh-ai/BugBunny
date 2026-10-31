"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Activity,
  Settings,
  ShieldCheck,
  Sparkles,
  Lock,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

import { BugBunnyLogo } from "./BugBunnyLogo";
import { fetchSystemMode } from "@/lib/api";
import { SystemMode } from "@/mock/types";

export function Sidebar() {
  const pathname = usePathname();
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSystemMode()
      .then((sm) => setSystemMode(sm))
      .catch(() => {});
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      {/* Top Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-1 text-sm font-semibold tracking-tight text-[#f0f6fc] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] rounded"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#30363d] bg-[#161b22] text-[#f0f6fc] shadow-sm shrink-0">
            <BugBunnyLogo size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-[#f0f6fc]">BugBunny</span>
            <span className="text-[10px] font-mono text-[#8b949e]">AI Engineering Assistant</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Sidebar Navigation">
          <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-[#8b949e]">
            Navigation
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] ${
                  active
                    ? "bg-[#21262d] text-[#f0f6fc] shadow-sm font-semibold"
                    : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-[#58a6ff]" : "text-[#8b949e]"}`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Safety & System Telemetry */}
      <div className="space-y-4 pt-4 border-t border-[#30363d]">
        {/* Safety Assurance Card */}
        <div className="rounded-md border border-[#30363d] bg-[#161b22] p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f6fc]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Safety Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#8b949e]">
            BugBunny proposes changes; the developer stays in control.
          </p>
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 pt-1">
            <Lock className="h-3 w-3" />
            <span>Strictly Read-Only Tools</span>
          </div>
        </div>

        {/* System Runtime Status */}
        {systemMode && (
          <div className="px-1 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
              <span>Runtime Engine:</span>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  systemMode.mode === "live"
                    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                    : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
                }`}
              >
                {systemMode.mode === "live" && (
                  <Sparkles className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
                )}
                <span>{systemMode.mode === "live" ? "Live: Gemini" : "Deterministic Demo"}</span>
              </span>
            </div>

            <a
              href="https://github.com/ynsh-ai/BugBunny"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[11px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors pt-1"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#30363d] bg-[#0d1117] h-screen sticky top-0 overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#30363d] bg-[#0d1117]/95 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#30363d] bg-[#161b22] text-[#f0f6fc]">
            <BugBunnyLogo size={18} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#f0f6fc]">BugBunny</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex">
          <div className="w-64 max-w-[80vw] bg-[#0d1117] border-r border-[#30363d] h-full shadow-2xl">
            {navContent}
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}

