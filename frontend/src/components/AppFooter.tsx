"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BugBunnyLogo } from "./BugBunnyLogo";
import { ShieldCheck } from "lucide-react";

export function AppFooter() {
  const pathname = usePathname();

  // Hide global footer on auth & onboarding
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  // Dashboard & workspace footer
  const isWorkspace =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/issues") ||
    pathname.startsWith("/investigations") ||
    pathname.startsWith("/settings");

  if (isWorkspace) {
    return (
      <footer className="border-t border-[#DADDD3] bg-[#E8EAE3] py-4 text-xs text-[#777D71]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 font-mono text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#171916]">BugBunny</span>
            <span>/</span>
            <span>AI Engineering Team</span>
            <span>/</span>
            <span className="text-[#171916] font-medium bg-[#C6F36B]/60 px-2 py-0.5 rounded-xs border border-[#AEE64E]">
              BugBunny proposes changes. Your repository stays under your control.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#777D71]">
            <span>FastAPI Core</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>Gemini 1.5</span>
            <span>•</span>
            <span className="text-[#35A56A] font-semibold">Read-Only Sandbox</span>
          </div>
        </div>
      </footer>
    );
  }

  // Public marketing landing footer
  return (
    <footer className="border-t border-[#DADDD3] bg-[#171916] text-[#9BA095] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#292D27]">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-[#292D27] border border-[#3A4037]">
                <BugBunnyLogo size={20} />
              </div>
              <span className="font-bold text-lg text-[#F5F5F0] tracking-tight">
                BugBunny
              </span>
            </div>
            <p className="text-xs text-[#9BA095] max-w-sm leading-relaxed">
              Your AI Engineering Team for Every GitHub Issue. BugBunny investigates software issues, isolates root causes, and creates verified patches with human-in-the-loop sign-off.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#35A56A]">
              <ShieldCheck className="h-4 w-4" />
              <span>Read-only sandbox guard active</span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[#F5F5F0] font-bold uppercase tracking-wider text-[11px]">
              Product
            </div>
            <ul className="space-y-2 text-[#9BA095]">
              <li>
                <a href="#how-it-works" className="hover:text-[#C6F36B] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#product" className="hover:text-[#C6F36B] transition-colors">
                  Multi-Agent Team
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#C6F36B] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#C6F36B] transition-colors">
                  Security Model
                </a>
              </li>
            </ul>
          </div>

          {/* Workflow */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[#F5F5F0] font-bold uppercase tracking-wider text-[11px]">
              Agents
            </div>
            <ul className="space-y-2 text-[#9BA095]">
              <li>Requirements Analyst</li>
              <li>Codebase Investigator</li>
              <li>Solution Planner</li>
              <li>Patch Engineer</li>
              <li>Test Runner</li>
              <li>Code Reviewer</li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[#F5F5F0] font-bold uppercase tracking-wider text-[11px]">
              Workspace
            </div>
            <ul className="space-y-2 text-[#9BA095]">
              <li>
                <Link href="/login" className="hover:text-[#C6F36B] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#C6F36B] transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#C6F36B] transition-colors">
                  Enter Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[#575E54]">
          <div>
            © {new Date().getFullYear()} BugBunny AI. All rights reserved.
          </div>
          <div className="text-[#9BA095]">
            BugBunny proposes changes. Your repository stays under your control.
          </div>
        </div>
      </div>
    </footer>
  );
}
