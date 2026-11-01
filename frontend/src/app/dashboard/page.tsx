"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  FolderGit2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Plus,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import {
  fetchIssues,
  fetchInvestigations,
  fetchRepositories,
  fetchWorkspaceSummary,
} from "@/lib/api";
import {
  InvestigationItem,
  IssueDetail,
  RepositoryItem,
  WorkspaceSummary,
} from "@/mock/types";
import { ImportGitHubModal } from "@/components/ImportGitHubModal";
import { StatusBadge, PriorityBadge } from "@/components/Badge";

export default function DashboardOverviewPage() {
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [summary, setSummary] = useState<WorkspaceSummary>({
    repositories_count: 0,
    issues_count: 0,
    investigations_count: 0,
    awaiting_approval_count: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalTab, setImportModalTab] = useState<"issue" | "repo">("issue");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [issuesData, reposData, investigationsData, summaryData] =
        await Promise.all([
          fetchIssues(),
          fetchRepositories(),
          fetchInvestigations(),
          fetchWorkspaceSummary(),
        ]);
      setIssues(issuesData);
      setRepositories(reposData);
      setInvestigations(investigationsData);
      setSummary(summaryData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load workspace data.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchIssues(),
      fetchRepositories(),
      fetchInvestigations(),
      fetchWorkspaceSummary(),
    ])
      .then(([issuesData, reposData, investigationsData, summaryData]) => {
        if (isMounted) {
          setIssues(issuesData);
          setRepositories(reposData);
          setInvestigations(investigationsData);
          setSummary(summaryData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load workspace data.";
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openImport = (tab: "issue" | "repo") => {
    setImportModalTab(tab);
    setIsImportModalOpen(true);
  };

  const hasRealData =
    !isLoading &&
    (summary.repositories_count > 0 ||
      summary.issues_count > 0 ||
      repositories.length > 0 ||
      issues.length > 0);

  return (
    <main className="min-h-screen bg-[#F5F5F0] text-[#171916]">
      {/* Error / Connection Banner */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
          <div className="flex items-center justify-between rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 px-4 py-3 text-xs text-[#B33833]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#D65B56]" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1 font-mono text-[11px] underline hover:text-[#171916] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-8 w-8 mb-3 animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
          <p className="text-xs font-mono text-[#777D71]">
            Loading BugBunny workspace...
          </p>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 1. PURPOSEFUL EMPTY STATE (When Database has No Real Data)              */}
      {/* ====================================================================== */}
      {!isLoading && !hasRealData && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 space-y-12">
          {/* Header Card */}
          <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-8 sm:p-12 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3.5 py-1 text-xs font-mono text-[#171916]">
              <span className="flex h-2 w-2 rounded-full bg-[#35A56A]" />
              <span className="font-semibold">WORKSPACE READY</span>
              <span className="text-[#777D71]">|</span>
              <span className="text-[#777D71]">NO ACTIVE INVESTIGATIONS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171916]">
              Investigate software issues with an AI engineering team.
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#777D71] leading-relaxed">
              Import a public GitHub issue or repository to gather context,
              investigate the problem, and prepare a human-approved implementation proposal.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => openImport("issue")}
                className="flex items-center gap-2 rounded-xs bg-[#C6F36B] px-5 py-2.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] shadow-xs active:translate-y-px transition-all cursor-pointer"
              >
                <GitPullRequest className="h-4 w-4" />
                <span>Import GitHub Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-2 rounded-xs bg-[#FFFFFF] px-5 py-2.5 text-xs font-semibold text-[#171916] border border-[#DADDD3] hover:bg-[#F5F5F0] active:translate-y-px transition-all cursor-pointer"
              >
                <FolderGit2 className="h-4 w-4 text-[#777D71]" />
                <span>Import Repository</span>
              </button>
            </div>

            {/* Safety Note */}
            <div className="pt-4 flex items-center justify-center gap-2 text-xs font-mono text-[#777D71]">
              <ShieldCheck className="h-4 w-4 text-[#35A56A]" />
              <span>BugBunny proposes changes. Your repository stays under your control.</span>
            </div>
          </div>

          {/* 3 Understated Workflow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-3">
              <div className="text-xs font-bold text-[#171916] bg-[#E8EAE3] w-7 h-7 flex items-center justify-center rounded-2xs">
                01
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171916]">
                Import Context
              </h3>
              <p className="text-xs font-sans text-[#777D71] leading-relaxed">
                Provide any public GitHub issue or repository URL. BugBunny crawls repository AST trees in read-only sandbox mode.
              </p>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-3">
              <div className="text-xs font-bold text-[#171916] bg-[#E8EAE3] w-7 h-7 flex items-center justify-center rounded-2xs">
                02
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171916]">
                Investigate
              </h3>
              <p className="text-xs font-sans text-[#777D71] leading-relaxed">
                6 specialized agents collaborate to isolate root causes, craft minimal surgical diffs, and run regression test simulations.
              </p>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-3">
              <div className="text-xs font-bold text-[#171916] bg-[#C6F36B] w-7 h-7 flex items-center justify-center rounded-2xs">
                03
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171916]">
                Review & Approve
              </h3>
              <p className="text-xs font-sans text-[#777D71] leading-relaxed">
                Review unified git diffs and test results. Changes are never committed without your explicit authorization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2. REAL-DATA WORKSPACE DASHBOARD (When API Records Exist)               */}
      {/* ====================================================================== */}
      {!isLoading && hasRealData && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header & Quick Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DADDD3] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#35A56A]" />
                <span className="font-mono text-[11px] text-[#777D71] uppercase tracking-wider">
                  WORKSPACE / ACTIVE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171916]">
                Engineering Workspace
              </h1>
              <p className="text-xs text-[#777D71]">
                Connected repositories, tracked issues, and verified agent investigations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openImport("issue")}
                className="flex items-center gap-2 rounded-xs bg-[#C6F36B] px-3.5 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Import Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-2 rounded-xs bg-[#E8EAE3] px-3.5 py-2 text-xs font-semibold text-[#171916] border border-[#DADDD3] hover:bg-[#DADDD3] transition-colors cursor-pointer"
              >
                <FolderGit2 className="h-3.5 w-3.5 text-[#777D71]" />
                <span>Import Repo</span>
              </button>

              <button
                onClick={loadData}
                title="Refresh Workspace"
                className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-2 text-[#777D71] hover:text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Metric Counter Panels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-4 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#777D71]">
                Repositories
              </div>
              <div className="text-2xl font-bold text-[#171916]">
                {summary.repositories_count}
              </div>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-4 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#777D71]">
                Total Issues
              </div>
              <div className="text-2xl font-bold text-[#171916]">
                {summary.issues_count}
              </div>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-4 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#777D71]">
                Investigations
              </div>
              <div className="text-2xl font-bold text-[#171916]">
                {summary.investigations_count}
              </div>
            </div>

            <div className="rounded-xs border border-[#AEE64E] bg-[#C6F36B]/25 p-4 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#171916] font-semibold">
                Awaiting Approval
              </div>
              <div className="text-2xl font-bold text-[#171916]">
                {summary.awaiting_approval_count}
              </div>
            </div>
          </div>

          {/* Connected Repositories Section */}
          {repositories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777D71]">
                  Connected Repositories ({repositories.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-4 space-y-3 hover:border-[#171916] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-bold text-[#171916]">
                          {repo.name}
                        </div>
                        <div className="text-xs text-[#777D71]">
                          branch: <span className="font-mono text-[#171916]">{repo.defaultBranch || "main"}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] bg-[#E8EAE3] text-[#777D71] px-1.5 py-0.5 rounded-2xs border border-[#DADDD3]">
                        READ-ONLY
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#DADDD3] text-xs font-mono text-[#777D71]">
                      <span>{repo.fileCount ?? "—"} files cached</span>
                      {repo.githubUrl && (
                        <a
                          href={repo.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-[#171916] transition-colors"
                        >
                          <span>github</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracked Issues Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777D71]">
                Tracked Issues ({issues.length})
              </h2>
              <Link
                href="/dashboard/issues"
                className="text-xs font-mono text-[#171916] hover:underline flex items-center gap-1"
              >
                <span>View all issues</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {issues.length === 0 ? (
              <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-8 text-center text-xs text-[#777D71]">
                No issues imported yet. Import a public GitHub issue to begin.
              </div>
            ) : (
              <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
                <div className="divide-y divide-[#DADDD3]">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5F5F0] transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#171916]">
                            {issue.id}
                          </span>
                          <span className="font-mono text-[11px] text-[#777D71]">
                            {issue.repository}
                          </span>
                          <StatusBadge status={issue.status} />
                          <PriorityBadge priority={issue.priority} />
                        </div>
                        <h3 className="text-sm font-semibold text-[#171916] truncate">
                          {issue.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/dashboard/issues/${encodeURIComponent(issue.id)}`}
                          className="flex items-center gap-1.5 rounded-xs bg-[#171916] px-3 py-1.5 text-xs font-medium text-[#F5F5F0] hover:bg-[#292D27] transition-colors"
                        >
                          <span>Open Workspace</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Investigations Section */}
          {investigations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777D71]">
                  Recent Investigations ({investigations.length})
                </h2>
                <Link
                  href="/dashboard/investigations"
                  className="text-xs font-mono text-[#171916] hover:underline flex items-center gap-1"
                >
                  <span>View audit history</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
                <div className="divide-y divide-[#DADDD3]">
                  {investigations.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5F5F0] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#171916]">
                            {inv.issue_key || inv.issue_id}
                          </span>
                          <StatusBadge status={inv.status} />
                          {inv.repository_name && (
                            <span className="font-mono text-[11px] text-[#777D71]">
                              {inv.repository_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#777D71] truncate">
                          {inv.title || inv.root_cause_summary || "Investigation Trace"}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/issues/${encodeURIComponent(inv.issue_key || inv.issue_id)}`}
                        className="flex items-center gap-1.5 rounded-xs bg-[#E8EAE3] px-3 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors shrink-0"
                      >
                        <span>Review</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safe GitHub Import Modal */}
      <ImportGitHubModal
        isOpen={isImportModalOpen}
        initialTab={importModalTab}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          loadData();
        }}
      />
    </main>
  );
}
