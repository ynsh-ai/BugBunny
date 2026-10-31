"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IssueDetail } from "@/mock/types";
import { fetchIssues, triggerInvestigation } from "@/lib/api";
import { StatusBadge, PriorityBadge, SourceBadge } from "@/components/Badge";
import { ImportGitHubModal } from "@/components/ImportGitHubModal";
import {
  Search,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  GitPullRequest,
  Plus,
  ShieldCheck,
  Play,
  Clock,
} from "lucide-react";

export default function IssuesListPage() {
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load issues from API";
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
          const message =
            err instanceof Error ? err.message : "Failed to load issues from API";
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartInvestigation = async (issueId: string) => {
    setTriggeringId(issueId);
    try {
      await triggerInvestigation(issueId, "demo");
      await loadIssues();
    } catch (err) {
      console.warn("Investigation trigger error:", err);
    } finally {
      setTriggeringId(null);
    }
  };

  const repos = Array.from(new Set(issues.map((i) => i.repository))).filter(Boolean);

  const filteredIssues = issues.filter((issue) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      issue.title.toLowerCase().includes(term) ||
      issue.id.toLowerCase().includes(term) ||
      issue.repository.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "awaiting_approval"
        ? issue.status === "Review required" || issue.investigationStatus === "awaiting_approval"
        : statusFilter === "in_progress"
        ? issue.status === "In progress" || issue.status === "Testing"
        : statusFilter === "complete"
        ? issue.status === "Investigation complete" || issue.status === "Approved"
        : true;

    const matchesRepo =
      repoFilter === "all" ? true : issue.repository === repoFilter;

    const matchesPriority =
      priorityFilter === "all" ? true : issue.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesRepo && matchesPriority;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#c9d1d9]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252e] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f2f5]">
              Issues
            </h1>
            {issues.length > 0 && (
              <span className="rounded-full bg-[#181b21] border border-[#22252e] px-2.5 py-0.5 font-mono text-xs text-[#9aa1b0]">
                {issues.length}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#9aa1b0]">
            Tracked issues from connected GitHub repositories and public issue imports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import GitHub Issue</span>
          </button>

          <button
            onClick={loadIssues}
            disabled={isLoading}
            className="flex items-center justify-center rounded-md border border-[#22252e] bg-[#181b21] p-1.5 text-[#9aa1b0] hover:text-[#f0f2f5] transition-colors"
            title="Refresh issues list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Safety Note */}
      <div className="flex items-center gap-2 rounded-md border border-[#22252e] bg-[#13151a] px-3.5 py-2 text-xs text-[#9aa1b0]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>BugBunny proposes changes. Your repository stays under your control.</span>
      </div>

      {/* Filter and Search Bar (Render only if issues exist or search active) */}
      {(issues.length > 0 || searchTerm) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#626875]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, key, or repository..."
              className="w-full rounded-md border border-[#22252e] bg-[#13151a] py-1.5 pl-9 pr-3 text-xs text-[#f0f2f5] placeholder-[#626875] focus:border-[#58a6ff] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {repos.length > 1 && (
              <select
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
                className="rounded-md border border-[#22252e] bg-[#13151a] px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
              >
                <option value="all">All Repositories</option>
                {repos.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[#22252e] bg-[#13151a] px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
            >
              <option value="all">All States</option>
              <option value="in_progress">Running</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="complete">Complete</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border border-[#22252e] bg-[#13151a] px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="h-5 w-5 animate-spin text-[#626875] mb-2" />
          <p className="text-xs font-mono text-[#9aa1b0]">Loading issues from API...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-md border border-rose-900/60 bg-rose-950/20 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Connection Error</span>
          </div>
          <p className="font-mono text-[11px] text-[#9aa1b0]">{error}</p>
          <button
            onClick={loadIssues}
            className="rounded-md border border-[#22252e] bg-[#181b21] px-3 py-1 font-mono text-xs text-[#f0f2f5] hover:bg-[#22252e] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Issues List Table */}
      {!isLoading && !error && filteredIssues.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#22252e] bg-[#13151a]">
          <div className="divide-y divide-[#22252e]">
            {filteredIssues.map((issue) => {
              const hasRuns = issue.timeline && issue.timeline.length > 0;
              const hasInvestigation = Boolean(issue.investigationId || hasRuns);

              return (
                <div
                  key={issue.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#181b21] transition-colors"
                >
                  {/* Left: Issue Key, Title, Repo, Source, Labels */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#58a6ff]">
                        {issue.id}
                      </span>
                      <SourceBadge mode={issue.mode} />
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <span className="font-mono text-xs text-[#626875]">
                        {issue.repository}
                      </span>
                    </div>

                    <Link
                      href={`/issues/${encodeURIComponent(issue.id)}`}
                      className="font-medium text-sm text-[#f0f2f5] hover:text-[#58a6ff] transition-colors block truncate"
                    >
                      {issue.title}
                    </Link>

                    {issue.updatedAt && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#626875]">
                        <Clock className="h-3 w-3" />
                        <span>
                          Updated: {new Date(issue.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Open issue, Start investigation, or View investigation */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {!hasInvestigation ? (
                      <button
                        type="button"
                        disabled={triggeringId === issue.id}
                        onClick={() => handleStartInvestigation(issue.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors disabled:opacity-50"
                      >
                        {triggeringId === issue.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 fill-current" />
                        )}
                        <span>Start investigation</span>
                      </button>
                    ) : (
                      <Link
                        href={`/issues/${encodeURIComponent(issue.id)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#22252e] bg-[#181b21] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:text-[#f0f2f5] hover:bg-[#22252e] transition-colors"
                      >
                        <span>View investigation</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}

                    <Link
                      href={`/issues/${encodeURIComponent(issue.id)}`}
                      className="inline-flex items-center gap-1 rounded-md border border-[#22252e] bg-[#13151a] px-3 py-1.5 text-xs font-medium text-[#9aa1b0] hover:text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
                    >
                      <span>Open issue</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredIssues.length === 0 && (
        <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-12 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#181b21] text-[#9aa1b0]">
            <GitPullRequest className="h-5 w-5 text-[#9aa1b0]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#f0f2f5]">
              {issues.length === 0
                ? "No issues imported yet."
                : "No matching issues found"}
            </h2>
            <p className="text-xs text-[#9aa1b0] max-w-md mx-auto">
              {issues.length === 0
                ? "Import a public GitHub issue to start your first investigation."
                : "Try adjusting your search query or filters."}
            </p>
          </div>
          {issues.length === 0 && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Import GitHub Issue</span>
            </button>
          )}
        </div>
      )}

      {/* Import Modal */}
      <ImportGitHubModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onIssueImported={() => {
          setIsImportModalOpen(false);
          loadIssues();
        }}
      />
    </main>
  );
}
