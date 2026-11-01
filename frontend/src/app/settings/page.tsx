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

export default function SettingsPage() {
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
      setResetResult(
        `${res.message} (Removed ${res.deleted_issues} issues, ${res.deleted_repositories} repositories).`
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
                  <span>Offline — Unable to reach API</span>
                </span>
              )}
              {backendStatus === "checking" && (
                <span className="flex items-center gap-1.5 text-[#777D71]">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Connecting...</span>
                </span>
              )}
            </div>
          </div>

          {/* GitHub Import Capability */}
          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
            <span className="text-[11px] text-[#777D71]">GitHub Integration</span>
            <div className="flex items-center gap-1.5 text-[#35A56A] pt-0.5 font-semibold">
              <Check className="h-3.5 w-3.5" />
              <span>Public Issues &amp; Repositories (Read-Only)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Agent Provider Configuration Status */}
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#171916]">
          <Cpu className="h-4 w-4 text-[#171916]" />
          <span>Agent Provider Configuration</span>
        </div>

        {isLiveProviderActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xs border border-[#AEE64E] bg-[#C6F36B]/25 p-3 text-xs text-[#171916] font-mono">
              <Sparkles className="h-4 w-4 text-[#171916] shrink-0" />
              <span>
                Active Provider: <strong>{systemMode?.provider?.toUpperCase()}</strong> ({systemMode?.model})
              </span>
            </div>
            <p className="text-xs text-[#777D71]">
              The backend confirms live model reasoning is active and rate-limited.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3.5 text-xs text-[#777D71] space-y-1">
              <p className="font-semibold text-[#171916]">
                AI provider is not configured. Import and workspace features remain available where supported.
              </p>
              <p className="text-[11px] text-[#777D71]">
                In offline or unconfigured environments, deterministic agent traces provide full offline verification without calling external APIs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Privacy and Safety Explanation */}
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#171916]">
          <ShieldCheck className="h-4 w-4 text-[#35A56A]" />
          <span>Privacy &amp; Safety Guarantees</span>
        </div>

        <div className="space-y-3 text-xs text-[#777D71] leading-relaxed">
          <div className="p-3 rounded-xs bg-[#E8EAE3] border border-[#DADDD3] text-xs text-[#171916] font-semibold flex items-center gap-2 font-mono">
            <ShieldCheck className="h-4 w-4 text-[#35A56A] shrink-0" />
            <span>BugBunny proposes changes. Your repository stays under your control.</span>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 shrink-0 text-[#35A56A] mt-0.5" />
            <div>
              <strong className="text-[#171916]">Strictly Read-Only Repository Access:</strong> BugBunny never requests write permissions, creates remote branches, or makes unauthorized commits to your GitHub repositories.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#35A56A] mt-0.5" />
            <div>
              <strong className="text-[#171916]">Human-In-The-Loop Approval:</strong> Every generated patch, proposed plan, and regression test suite requires explicit developer approval before proceeding to export.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#35A56A] mt-0.5" />
            <div>
              <strong className="text-[#171916]">API Key Privacy:</strong> API credentials are never transmitted to the frontend or exposed to users.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Development Database Reset */}
      <div className="rounded-xs border border-[#D65B56]/30 bg-[#FFFFFF] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#B33833]">
            <Trash2 className="h-4 w-4 text-[#D65B56]" />
            <span>Development Database Reset</span>
          </div>
          <span className="rounded-xs bg-[#D65B56]/15 px-2 py-0.5 font-mono text-[10px] text-[#B33833] border border-[#D65B56]/30">
            destructive
          </span>
        </div>

        <p className="text-xs text-[#777D71] leading-relaxed">
          Wipes all imported issues, repositories, and investigation records from the PostgreSQL database, returning the workspace to a clean onboarding state.
        </p>

        {resetResult && (
          <div className="flex items-center gap-2 rounded-xs border border-[#35A56A]/40 bg-[#35A56A]/10 p-3 text-xs text-[#227247] font-mono">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#35A56A]" />
            <span>{resetResult}</span>
          </div>
        )}

        {resetError && (
          <div className="flex items-center gap-2 rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-3 text-xs text-[#B33833] font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#D65B56]" />
            <span>{resetError}</span>
          </div>
        )}

        <div className="pt-1">
          {showConfirmReset ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#B33833] font-medium">Are you sure? This cannot be undone.</span>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDatabase}
                className="flex items-center gap-1.5 rounded-xs border border-[#D65B56] bg-[#D65B56] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#B33833] transition-colors disabled:opacity-50"
              >
                {isResetting && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span>Confirm Database Wipe</span>
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowConfirmReset(false)}
                className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1.5 text-xs font-medium text-[#171916] hover:bg-[#DADDD3] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-1.5 text-xs font-semibold text-[#B33833] hover:bg-[#D65B56]/10 hover:border-[#D65B56]/40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Database</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
