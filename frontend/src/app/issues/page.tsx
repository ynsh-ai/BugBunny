"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IssueDetail } from "@/mock/types";
import { fetchIssues } from "@/lib/api";
import { StatusBadge } from "@/components/Badge";
import { ImportGitHubModal } from "@/components/ImportGitHubModal";
import {
  Search,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  GitPullRequest,
  Plus,
  ShieldCheck,
} from "lucide-react";

export default function IssuesListPage() {
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load issues from API";
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
          const message = err instanceof Error ? err.message : "Failed to load issues from API";
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f6fc]">
              Issues
            </h1>
            <span className="rounded-full bg-[#21262d] px-2.5 py-0.5 font-mono text-xs text-[#8b949e]">
              {issues.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8b949e]">
            Real tracked issues from connected GitHub repositories and public issue imports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Issue</span>
          </button>

          <button
            onClick={loadIssues}
            disabled={isLoading}
            className="flex items-center justify-center rounded-md border border-[#30363d] bg-[#21262d] p-1.5 text-[#8b949e] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
            title="Refresh issues list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Safety Note */}
      <div className="flex items-center gap-2 rounded-md border border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs text-[#8b949e]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          Read-only workspace: BugBunny prepares patches and tests for your inspection. No code is modified without your approval.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search issues by title, ID, or repository..."
            className="w-full rounded-md border border-[#30363d] bg-[#161b22] py-1.5 pl-9 pr-3 text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:border-[#58a6ff] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {repos.length > 1 && (
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
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
            className="rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="all">All Statuses</option>
            <option value="complete">Investigation Complete</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review Required</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCw className="h-5 w-5 animate-spin text-[#8b949e] mb-2" />
          <p className="text-xs font-mono text-[#8b949e]">Fetching issues...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-md border border-rose-900/60 bg-rose-950/20 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Connection Error</span>
          </div>
          <p className="font-mono text-[11px] text-[#8b949e]">{error}</p>
          <button
            onClick={loadIssues}
            className="rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1 font-mono text-xs text-[#f0f6fc] hover:bg-[#30363d] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Issues Table */}
      {!isLoading && !error && filteredIssues.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e] font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Issue</th>
                <th className="py-2.5 px-4 font-medium">Repository</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Priority</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-[#21262d]/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/issues/${encodeURIComponent(issue.id)}`}
                      className="font-medium text-[#f0f6fc] hover:text-[#58a6ff] transition-colors block max-w-lg truncate"
                    >
                      <span className="font-mono text-[#8b949e] mr-2">
                        {issue.id}
                      </span>
                      {issue.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e]">
                    {issue.repository}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e] uppercase">
                    {issue.priority}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/issues/${encodeURIComponent(issue.id)}`}
                      className="inline-flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-[11px] font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredIssues.length === 0 && (
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-12 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#21262d] text-[#8b949e]">
            <GitPullRequest className="h-5 w-5 text-[#8b949e]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              {issues.length === 0 ? "No issues tracked yet" : "No matching issues found"}
            </h2>
            <p className="text-xs text-[#8b949e] max-w-md mx-auto">
              {issues.length === 0
                ? "Import a public GitHub issue to initiate an automated multi-agent investigation."
                : "Try adjusting your search query or filters."}
            </p>
          </div>
          {issues.length === 0 && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors"
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
        initialTab="issue"
        onIssueImported={() => loadIssues()}
        onRepoImported={() => loadIssues()}
      />
    </main>
  );
}
