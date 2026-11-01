"use client";

import React, { useEffect, useState } from "react";
import { fetchSystemMode, getApiBaseUrl, resetDatabase } from "@/lib/api";
import { SystemMode } from "@/mock/types";
import {
  ShieldCheck,
  Cpu,
  Server,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Sparkles,
  Check,
} from "lucide-react";
import { resetOnboarding } from "@/lib/auth";

export default function DashboardSettingsPage() {
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchSystemMode()
      .then((mode) => {
        if (isMounted) {
          setSystemMode(mode);
          setBackendStatus("online");
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus("offline");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    setResetResult(null);
    setResetError(null);
    setShowConfirmReset(false);

    try {
      const res = await resetDatabase();
      resetOnboarding();
      setResetResult(
        `${res.message} (Removed ${res.deleted_issues} issues, ${res.deleted_repositories} repositories). Workspace reset.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset database.";
      setResetError(msg);
    } finally {
      setIsResetting(false);
    }
  };

  const isLiveProviderActive = Boolean(systemMode?.mode === "live" && systemMode?.liveAvailable);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#171916]">
      {/* Page Header */}
      <div className="border-b border-[#DADDD3] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#171916]">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs text-[#777D71]">
          System status, provider configuration, and security guarantees.
        </p>
      </div>

      {/* 1. System Status & Capabilities */}
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#171916]">
          <Server className="h-4 w-4 text-[#171916]" />
          <span>System Status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {/* Backend Connection */}
          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
            <span className="text-[11px] text-[#777D71]">Backend Connection</span>
            <div className="flex items-center gap-2 pt-0.5">
              {backendStatus === "online" && (
                <span className="flex items-center gap-1.5 text-[#35A56A] font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[#35A56A]" />
                  <span>Online ({getApiBaseUrl()})</span>
                </span>
              )}
              {backendStatus === "offline" && (
                <span className="flex items-center gap-1.5 text-[#D65B56] font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[#D65B56]" />
                  <span>Offline — Check backend API</span>
                </span>
              )}
              {backendStatus === "checking" && (
                <span className="text-[#777D71]">Probing backend...</span>
              )}
            </div>
          </div>

          {/* AI Provider */}
          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
            <span className="text-[11px] text-[#777D71]">Active Provider</span>
            <div className="flex items-center gap-2 pt-0.5">
              {isLiveProviderActive ? (
                <span className="flex items-center gap-1.5 text-[#171916] font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-[#C6F36B]" />
                  <span>Gemini 1.5 Pro (Live Configured)</span>
                </span>
              ) : (
                <span className="text-[#777D71]">
                  Local Heuristic / Mock Pipeline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Security & Containment Model */}
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#171916]">
          <ShieldCheck className="h-4 w-4 text-[#35A56A]" />
          <span>Security & Containment Guarantees</span>
        </div>

        <p className="text-xs text-[#777D71] leading-relaxed">
          BugBunny enforces a strict read-only repository sandboxing architecture. AI agents cannot push to GitHub, write commits, or modify external services without explicit developer authorization.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#171916] font-semibold">
              <Lock className="h-3 w-3 text-[#35A56A]" />
              <span>Read-Only Sandbox</span>
            </div>
            <p className="text-[11px] text-[#777D71]">
              Zero write credentials stored. Repositories are analyzed without mutating source branches.
            </p>
          </div>

          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#171916] font-semibold">
              <Check className="h-3 w-3 text-[#35A56A]" />
              <span>Human Approval Gate</span>
            </div>
            <p className="text-[11px] text-[#777D71]">
              Every synthesized git patch requires explicit human review and authorization.
            </p>
          </div>

          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#171916] font-semibold">
              <Cpu className="h-3 w-3 text-[#35A56A]" />
              <span>6-Agent Isolation</span>
            </div>
            <p className="text-[11px] text-[#777D71]">
              Each agent operates within bounded input-output schemas and deterministic roles.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Database Administration / Danger Zone */}
      <div className="rounded-xs border border-[#D65B56]/40 bg-[#FFFFFF] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#B33833]">
          <Trash2 className="h-4 w-4 text-[#D65B56]" />
          <span>Database Administration & Reset</span>
        </div>

        <p className="text-xs text-[#777D71] leading-relaxed">
          Reset all PostgreSQL records, purge imported public repositories, clear tracked issues, and reset the workspace back to a clean onboarding state.
        </p>

        {resetResult && (
          <div className="rounded-xs border border-[#35A56A]/40 bg-[#35A56A]/10 p-3 text-xs text-[#35A56A] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{resetResult}</span>
          </div>
        )}

        {resetError && (
          <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-3 text-xs text-[#B33833] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{resetError}</span>
          </div>
        )}

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-2 rounded-xs border border-[#D65B56]/50 bg-[#D65B56]/10 px-3.5 py-2 text-xs font-semibold text-[#B33833] hover:bg-[#D65B56]/20 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Workspace Database</span>
          </button>
        ) : (
          <div className="rounded-xs border border-[#D65B56] bg-[#D65B56]/10 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#D65B56] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#B33833]">
                  Are you absolutely sure?
                </div>
                <div className="text-xs text-[#777D71]">
                  This will purge all imported issues, repositories, and investigation artifacts from PostgreSQL.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex items-center gap-1.5 rounded-xs bg-[#D65B56] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#B33833] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{isResetting ? "Resetting..." : "Confirm Purge & Reset"}</span>
              </button>

              <button
                onClick={() => setShowConfirmReset(false)}
                className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#E8EAE3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
