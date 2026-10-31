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
  Clock,
  Layers,
} from "lucide-react";

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInvestigations();
      setInvestigations(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load investigations.";
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
          const msg =
            err instanceof Error ? err.message : "Failed to load investigations.";
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInvestigations = investigations.filter((inv) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "running") {
      return inv.status === "in_progress" || inv.status === "Testing";
    }
    if (statusFilter === "awaiting_approval") {
      return inv.status === "awaiting_approval" || inv.status === "Review required";
    }
    if (statusFilter === "approved") {
      return inv.status === "approved_for_export" || inv.status === "Approved";
    }
    if (statusFilter === "rejected") {
      return inv.status === "rejected" || inv.status === "Rejected";
    }
    if (statusFilter === "failed") {
      return inv.status === "failed" || inv.status === "Failed";
    }
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#c9d1d9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252e] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f2f5]">
              Investigations
            </h1>
            {investigations.length > 0 && (
              <span className="rounded-full bg-[#181b21] border border-[#22252e] px-2.5 py-0.5 font-mono text-xs text-[#9aa1b0]">
                {investigations.length}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#9aa1b0]">
            Audit history of autonomous agent runs, root-cause analyses, and human approval gates.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md border border-[#22252e] bg-[#181b21] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:text-[#f0f2f5] hover:bg-[#22252e] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Safety Note */}
      <div className="flex items-center gap-2 rounded-md border border-[#22252e] bg-[#13151a] px-3.5 py-2 text-xs text-[#9aa1b0]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>BugBunny proposes changes. Your repository stays under your control.</span>
      </div>

      {/* Filter Bar (Only if investigations exist) */}
      {investigations.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All" },
              { id: "running", label: "Running" },
              { id: "awaiting_approval", label: "Awaiting Approval" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
              { id: "failed", label: "Failed" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-md px-3 py-1 text-xs font-mono transition-colors ${
                  statusFilter === f.id
                    ? "bg-[#181b21] text-[#f0f2f5] border border-[#22252e] font-semibold"
                    : "text-[#9aa1b0] hover:text-[#f0f2f5] hover:bg-[#13151a]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-rose-900/60 bg-rose-950/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="h-5 w-5 animate-spin text-[#626875] mb-2" />
          <p className="text-xs font-mono text-[#9aa1b0]">
            Loading investigations from API...
          </p>
        </div>
      )}

      {/* Table of Investigations (API-backed only) */}
      {!isLoading && !error && filteredInvestigations.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#22252e] bg-[#13151a]">
          <div className="divide-y divide-[#22252e]">
            {filteredInvestigations.map((inv) => {
              const targetIssue = inv.issue_key || inv.issue_id;

              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#181b21] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/issues/${encodeURIComponent(targetIssue)}`}
                        className="font-mono text-xs font-semibold text-[#58a6ff] hover:underline"
                      >
                        {targetIssue}
                      </Link>
                      <StatusBadge status={inv.status} />
                      {inv.repository_name && (
                        <span className="font-mono text-xs text-[#626875]">
                          {inv.repository_name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/issues/${encodeURIComponent(targetIssue)}`}
                      className="font-medium text-xs sm:text-sm text-[#f0f2f5] hover:text-[#58a6ff] transition-colors block truncate"
                    >
                      {inv.title || inv.root_cause_summary || "Investigation Trace"}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#626875]">
                      {inv.current_stage && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          <span>Stage: {inv.current_stage}</span>
                        </span>
                      )}
                      {inv.branch_name && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{inv.branch_name}</span>
                          </span>
                        </>
                      )}
                      {inv.started_at && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Created: {new Date(inv.started_at).toLocaleDateString()}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/issues/${encodeURIComponent(targetIssue)}`}
                    className="inline-flex items-center gap-1 rounded-md border border-[#22252e] bg-[#181b21] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:text-[#f0f2f5] hover:bg-[#22252e] transition-colors shrink-0 self-start sm:self-auto"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredInvestigations.length === 0 && (
        <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-12 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#181b21] text-[#9aa1b0]">
            <Activity className="h-5 w-5 text-[#9aa1b0]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#f0f2f5]">
              {investigations.length === 0
                ? "No investigations executed yet."
                : "No matching investigations found"}
            </h2>
            <p className="text-xs text-[#9aa1b0] max-w-md mx-auto">
              {investigations.length === 0
                ? "Import a public GitHub issue and start an investigation to see agent execution records here."
                : "Try selecting a different filter."}
            </p>
          </div>
          {investigations.length === 0 && (
            <Link
              href="/issues"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors shadow-sm"
            >
              <span>Go to Issues</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
