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
  Clock,
  Layers,
} from "lucide-react";

export default function DashboardInvestigationsPage() {
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#171916]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DADDD3] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#171916]">
              Investigations Audit
            </h1>
            {investigations.length > 0 && (
              <span className="rounded-xs bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 font-mono text-xs text-[#171916]">
                {investigations.length}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#777D71]">
            History of autonomous agent runs, root-cause analyses, and human approval decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3 py-1.5 font-mono text-xs text-[#171916] focus:border-[#171916] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="running">In Progress</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh Investigations"
            className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-1.5 text-[#777D71] hover:text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-6 w-6 mb-3 animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
          <p className="text-xs font-mono text-[#777D71]">Loading investigations...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-4 text-xs text-[#B33833] flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="font-mono underline hover:text-[#171916] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table of Investigations */}
      {!isLoading && !error && filteredInvestigations.length > 0 && (
        <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
          <div className="divide-y divide-[#DADDD3]">
            {filteredInvestigations.map((inv) => {
              const targetIssue = inv.issue_key || inv.issue_id;
              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-[#F5F5F0] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/issues/${encodeURIComponent(targetIssue)}`}
                        className="font-mono text-xs font-bold text-[#171916] hover:underline"
                      >
                        {targetIssue}
                      </Link>
                      <StatusBadge status={inv.status} />
                      {inv.repository_name && (
                        <span className="font-mono text-xs text-[#777D71]">
                          {inv.repository_name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/issues/${encodeURIComponent(targetIssue)}`}
                      className="font-semibold text-xs sm:text-sm text-[#171916] hover:text-[#171916] transition-colors block truncate"
                    >
                      {inv.title || inv.root_cause_summary || "Investigation Trace"}
                    </Link>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-[#777D71]">
                      {inv.current_stage && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-[#171916]" />
                          <span>stage: {inv.current_stage}</span>
                        </span>
                      )}
                      {inv.started_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>started {new Date(inv.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/issues/${encodeURIComponent(targetIssue)}`}
                      className="flex items-center gap-1.5 rounded-xs bg-[#171916] px-3.5 py-1.5 text-xs font-semibold text-[#F5F5F0] hover:bg-[#292D27] transition-colors"
                    >
                      <span>Review Artifacts</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredInvestigations.length === 0 && (
        <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-12 text-center space-y-3">
          <Activity className="mx-auto h-8 w-8 text-[#777D71]" />
          <h3 className="text-sm font-bold text-[#171916]">
            No investigations found
          </h3>
          <p className="text-xs text-[#777D71] max-w-sm mx-auto">
            Investigations are created when you select &ldquo;Start Investigation&rdquo; on any imported GitHub issue.
          </p>
        </div>
      )}
    </main>
  );
}
