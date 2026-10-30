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
} from "lucide-react";

export default function SettingsPage() {
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchSystemMode()
      .then((mode) => {
        if (isMounted) setSystemMode(mode);
      })
      .catch(() => {});

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

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#30363d] pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-[#f0f6fc]">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs text-[#8b949e]">
          Runtime environment configuration, AI model provider status, and security guarantees.
        </p>
      </div>

      {/* Model & Orchestration Settings */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#f0f6fc]">
          <Cpu className="h-4 w-4 text-[#58a6ff]" />
          <span>Model Provider & Orchestration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-1">
            <span className="text-[11px] text-[#8b949e]">Orchestration Mode</span>
            <div className="flex items-center gap-2 pt-0.5">
              {systemMode?.mode === "live" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-800/60 bg-purple-950/40 px-2.5 py-0.5 text-xs text-purple-300">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  Live Model Reasoning
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#21262d] px-2.5 py-0.5 text-xs text-[#8b949e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8b949e]" />
                  Deterministic Demo Mode
                </span>
              )}
            </div>
          </div>

          <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-1">
            <span className="text-[11px] text-[#8b949e]">Model & Provider</span>
            <div className="text-xs text-[#f0f6fc] pt-0.5 font-semibold">
              {systemMode ? `${systemMode.provider.toUpperCase()} (${systemMode.model})` : "—"}
            </div>
          </div>

          <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-1">
            <span className="text-[11px] text-[#8b949e]">Backend API Endpoint</span>
            <div className="text-xs text-[#f0f6fc] pt-0.5">
              {getApiBaseUrl()}
            </div>
          </div>

          <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-1">
            <span className="text-[11px] text-[#8b949e]">Orchestration Framework</span>
            <div className="text-xs text-[#f0f6fc] pt-0.5">
              OpenAI Agents SDK
            </div>
          </div>
        </div>

        {systemMode?.message && (
          <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 text-[11px] font-mono text-[#8b949e]">
            {systemMode.message}
          </div>
        )}
      </div>

      {/* Safety & Security Guarantees */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#f0f6fc]">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Security & Safety Policy</span>
        </div>

        <div className="space-y-3 text-xs text-[#8b949e] leading-relaxed">
          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="text-[#f0f6fc]">Strictly Read-Only Repository Access:</strong> BugBunny never requests write permissions, creates remote branches, or makes unauthorized commits to your GitHub repositories.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Server className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="text-[#f0f6fc]">Bounded File Inspection:</strong> Sensitive credential paths (e.g. <code className="text-[#c9d1d9] bg-[#0d1117] px-1 py-0.5 rounded">.env</code>, <code className="text-[#c9d1d9] bg-[#0d1117] px-1 py-0.5 rounded">.pem</code>, <code className="text-[#c9d1d9] bg-[#0d1117] px-1 py-0.5 rounded">id_rsa</code>) and files exceeding 500 KB are strictly filtered out before agent ingestion.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="text-[#f0f6fc]">Human-In-The-Loop Sign-Off:</strong> Every generated patch, proposed plan, and regression test suite requires explicit developer approval before proceeding to export.
            </div>
          </div>
        </div>
      </div>

      {/* Development Clean Database Reset */}
      <div className="rounded-lg border border-red-950/60 bg-[#161b22] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#f0f6fc]">
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Development Database Reset</span>
          </div>
          <span className="rounded bg-rose-950/50 border border-rose-900/60 px-2 py-0.5 font-mono text-[10px] text-rose-300">
            Dev Only
          </span>
        </div>

        <p className="text-xs text-[#8b949e] leading-relaxed">
          Clears all tracked issues, repositories, investigation runs, artifacts, and decisions from the local database to restart with a completely empty workspace. This does not alter code or database schema migrations.
        </p>

        {resetResult && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-300 font-mono">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{resetResult}</span>
          </div>
        )}

        {resetError && (
          <div className="flex items-center gap-2 rounded-md border border-rose-900/60 bg-rose-950/20 p-3 text-xs text-rose-300 font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{resetError}</span>
          </div>
        )}

        {!showConfirmReset ? (
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-md border border-rose-800/80 bg-rose-950/40 px-3.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Database to Empty State</span>
          </button>
        ) : (
          <div className="rounded-md border border-rose-900/80 bg-rose-950/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Are you sure you want to delete all database records?</span>
            </div>
            <p className="text-[11px] text-[#8b949e]">
              This will remove all issues, investigations, and repositories from PostgreSQL. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex items-center gap-1.5 rounded-md border border-rose-700 bg-rose-800 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isResetting && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span>{isResetting ? "Resetting..." : "Confirm & Reset Database"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                disabled={isResetting}
                className="rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1 text-xs text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
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
