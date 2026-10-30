"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchInvestigations } from "@/lib/api";
import { InvestigationItem } from "@/mock/types";
import { StatusBadge } from "@/components/Badge";
import {
  Activity,
  ArrowRight,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInvestigations();
      setInvestigations(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load investigations.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchInvestigations()
      .then((data) => {
        if (isMounted) {
          setInvestigations(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load investigations.";
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f6fc]">
              Investigations
            </h1>
            <span className="rounded-full bg-[#21262d] px-2.5 py-0.5 font-mono text-xs text-[#8b949e]">
              {investigations.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8b949e]">
            Audit history of autonomous agent runs, root-cause analyses, and human approval gates.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Security Statement */}
      <div className="flex items-center gap-2 rounded-md border border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs text-[#8b949e]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          Every investigation runs bounded read-only analysis. Generated patches require human approval before export.
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-rose-900/60 bg-rose-950/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCw className="h-5 w-5 animate-spin text-[#8b949e] mb-2" />
          <p className="text-xs font-mono text-[#8b949e]">Loading investigations from API...</p>
        </div>
      )}

      {/* Table of Investigations */}
      {!isLoading && !error && investigations.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e] font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Issue</th>
                <th className="py-2.5 px-4 font-medium">Repository</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Branch</th>
                <th className="py-2.5 px-4 font-medium">Mode</th>
                <th className="py-2.5 px-4 font-medium">Started</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {investigations.map((inv) => {
                const targetIssue = inv.issue_key || inv.issue_id;
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#21262d]/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <Link
                        href={`/issues/${encodeURIComponent(targetIssue)}`}
                        className="font-medium text-[#f0f6fc] hover:text-[#58a6ff] transition-colors"
                      >
                        {targetIssue}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e]">
                      {inv.repository_name || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e]">
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-[#6e7681]" />
                        <span>{inv.branch_name || "main"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e]">
                      {inv.mode}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e]">
                      {inv.started_at
                        ? new Date(inv.started_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/issues/${encodeURIComponent(targetIssue)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-[11px] font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && investigations.length === 0 && (
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-12 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#21262d] text-[#8b949e]">
            <Activity className="h-5 w-5 text-[#8b949e]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              No investigations executed yet
            </h2>
            <p className="text-xs text-[#8b949e] max-w-md mx-auto">
              Select an imported issue and click &ldquo;Start Investigation&rdquo; to launch the autonomous multi-agent engineering workflow.
            </p>
          </div>
          <Link
            href="/issues"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-3.5 py-1.5 text-xs font-semibold text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
          >
            <span>Go to Issues</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </main>
  );
}
