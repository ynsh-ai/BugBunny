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
  Plus,
  Play,
  Clock,
} from "lucide-react";

export default function DashboardIssuesPage() {
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#171916]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DADDD3] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#171916]">
              Tracked Issues
            </h1>
            {issues.length > 0 && (
              <span className="rounded-xs bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 font-mono text-xs text-[#171916]">
                {issues.length}
              </span>
            )}
          </div>
          <p className="text-xs text-[#777D71] mt-1">
            Browse and trigger multi-agent investigations on public GitHub issues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-3.5 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Issue</span>
          </button>

          <button
            onClick={loadIssues}
            title="Refresh Issues"
            className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-2 text-[#777D71] hover:text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {issues.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#777D71]" />
            <input
              type="text"
              placeholder="Search by issue ID, title, or repository..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xs border border-[#DADDD3] bg-[#FFFFFF] text-[#171916] placeholder-[#777D71] focus:border-[#171916] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-mono rounded-xs border border-[#DADDD3] bg-[#FFFFFF] text-[#171916] focus:border-[#171916] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>

            {repos.length > 1 && (
              <select
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
                className="px-2.5 py-2 text-xs font-mono rounded-xs border border-[#DADDD3] bg-[#FFFFFF] text-[#171916] focus:border-[#171916] focus:outline-none"
              >
                <option value="all">All Repositories</option>
                {repos.map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
            )}

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-mono rounded-xs border border-[#DADDD3] bg-[#FFFFFF] text-[#171916] focus:border-[#171916] focus:outline-none"
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-6 w-6 mb-3 animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
          <p className="text-xs font-mono text-[#777D71]">Loading issues...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-4 text-xs text-[#B33833] flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadIssues}
            className="font-mono underline hover:text-[#171916] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && issues.length === 0 && (
        <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-12 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xs bg-[#E8EAE3] text-[#777D71] border border-[#DADDD3]">
            <Plus className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#171916]">
              No issues imported yet.
            </h3>
            <p className="text-xs text-[#777D71] max-w-sm mx-auto">
              Import a public GitHub issue to start your first autonomous investigation.
            </p>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xs bg-[#C6F36B] px-4 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import GitHub Issue</span>
          </button>
        </div>
      )}

      {/* Issues Table */}
      {!isLoading && !error && issues.length > 0 && (
        <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
          <div className="divide-y divide-[#DADDD3]">
            {filteredIssues.map((issue) => {
              const hasActiveInvestigation =
                issue.investigationStatus === "running" ||
                issue.status === "In progress" ||
                issue.status === "Testing";
              const isTriggering = triggeringId === issue.id;

              return (
                <div
                  key={issue.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5F5F0] transition-colors"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono font-bold text-[#171916]">
                        {issue.id}
                      </span>
                      <span className="font-mono text-[#777D71]">
                        {issue.repository}
                      </span>
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <SourceBadge mode={issue.mode} />
                    </div>

                    <h2 className="text-sm font-semibold text-[#171916] leading-snug">
                      {issue.title}
                    </h2>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-[#777D71]">
                      {issue.author && <span>by @{issue.author}</span>}
                      {issue.branch && (
                        <span>
                          branch: <span className="text-[#171916]">{issue.branch}</span>
                        </span>
                      )}
                      {issue.updatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(issue.updatedAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!hasActiveInvestigation && (
                      <button
                        onClick={() => handleStartInvestigation(issue.id)}
                        disabled={isTriggering}
                        className="flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
                      >
                        <Play className={`h-3 w-3 ${isTriggering ? "animate-spin" : ""}`} />
                        <span>{isTriggering ? "Starting..." : "Start Investigation"}</span>
                      </button>
                    )}

                    <Link
                      href={`/dashboard/issues/${encodeURIComponent(issue.id)}`}
                      className="flex items-center gap-1.5 rounded-xs bg-[#171916] px-3 py-1.5 text-xs font-semibold text-[#F5F5F0] hover:bg-[#292D27] transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportGitHubModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          loadIssues();
        }}
      />
    </main>
  );
}
