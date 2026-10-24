"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IssueDetail } from "@/mock/types";
import { fetchIssues } from "@/lib/api";
import { IssueRow } from "@/components/IssueRow";
import { Search, ArrowRight, RefreshCw, AlertTriangle, Database } from "lucide-react";

export default function IssuesListPage() {
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load issues from FastAPI";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchIssues()
      .then((data) => {
        if (isMounted) {
          setIssues(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load issues from FastAPI";
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const repos = Array.from(new Set(issues.map((i) => i.repository)));

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.repository.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "complete"
        ? issue.status === "Investigation complete"
        : statusFilter === "in_progress"
        ? issue.status === "In progress" || issue.status === "Testing"
        : statusFilter === "review"
        ? issue.status === "Review required"
        : true;

    const matchesRepo =
      repoFilter === "all" ? true : issue.repository === repoFilter;

    return matchesSearch && matchesStatus && matchesRepo;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22252e] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-[#f0f2f5]">
              Issue Investigations
            </h1>
            <span className="rounded bg-[#1d2027] px-2 py-0.5 font-mono text-xs text-[#9aa1b0] border border-[#2b2f3a]">
              {isLoading ? "..." : `${filteredIssues.length} of ${issues.length} total`}
            </span>
            <span className="rounded bg-amber-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 border border-amber-800/60 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Mode
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9aa1b0]">
            Browse automated investigation runs, root-cause analyses, and
            implementation patches persisted in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadIssues}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded border border-[#2b2f3a] bg-[#161820] px-2.5 py-1.5 text-xs font-mono text-[#9aa1b0] hover:text-[#f0f2f5] hover:border-[#383d4a] transition-colors disabled:opacity-50"
            title="Refresh issues"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/issues/PP-101"
            className="flex items-center gap-2 rounded border border-emerald-800/80 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 transition-colors"
          >
            <span>Featured Case: PP-101</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded border border-[#22252e] bg-[#13151a] p-3 space-y-3">
        {/* Top Controls: Search and Repo Selector */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#626875]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by issue title, ID (e.g. PP-101), or repository..."
              className="w-full rounded border border-[#22252e] bg-[#0d0e12] py-1.5 pl-9 pr-3 text-xs text-[#f0f2f5] placeholder-[#555b68] focus:border-[#383d4a] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#626875] text-[11px] font-mono">
              Repository:
            </span>
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              disabled={isLoading}
              className="rounded border border-[#262933] bg-[#1a1c23] px-2.5 py-1.5 text-xs font-mono text-[#f0f2f5] focus:outline-none focus:border-[#383d4a]"
            >
              <option value="all">all repositories</option>
              {repos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#1c1f26] text-xs">
          <span className="text-[11px] text-[#626875] font-mono mr-1">
            Status:
          </span>
          {[
            { id: "all", label: "All Statuses" },
            { id: "complete", label: "Investigation Complete" },
            { id: "in_progress", label: "In Progress / Testing" },
            { id: "review", label: "Review Required" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                statusFilter === pill.id
                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80"
                  : "bg-[#181a22] text-[#9aa1b0] border border-[#262933] hover:bg-[#20232c] hover:text-[#f0f2f5]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded border border-[#22252e] bg-[#13151a] p-8 text-center space-y-3 font-mono text-xs text-[#9aa1b0]">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading issues from FastAPI...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded border border-rose-900/50 bg-rose-950/20 p-5 text-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Connection Error</span>
          </div>
          <p className="font-mono text-[11px] text-[#9aa1b0]">{error}</p>
          <button
            onClick={loadIssues}
            className="rounded border border-rose-800 bg-rose-900/40 px-3 py-1 font-mono text-xs text-rose-200 hover:bg-rose-900/60 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Issues Table */}
      {!isLoading && !error && filteredIssues.length > 0 && (
        <div className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden divide-y divide-[#1f2229]">
          {filteredIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredIssues.length === 0 && (
        <div className="rounded border border-[#22252e] bg-[#13151a] p-12 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1b1e27] text-[#9aa1b0]">
            <Database className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-xs font-semibold text-[#f0f2f5]">
            No matching issues found
          </div>
          <p className="mx-auto max-w-sm text-[11px] text-[#626875] font-mono">
            {searchTerm || statusFilter !== "all" || repoFilter !== "all"
              ? "Try adjusting your filters or search keywords."
              : "No issues exist in the database. Seed demo data from the dashboard."}
          </p>
        </div>
      )}
    </main>
  );
}
