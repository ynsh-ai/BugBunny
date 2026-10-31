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
import { StatusBadge } from "@/components/Badge";

export default function WorkspacePage() {
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-[#c9d1d9]">
      {/* Error / Connection Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-md border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 font-mono text-[11px] underline hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#626875] mb-3" />
          <p className="text-xs font-mono text-[#9aa1b0]">
            Connecting to BugBunny workspace API...
          </p>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 1. CLEAN ONBOARDING / EMPTY WORKSPACE SCREEN (Zero Fake Data)           */}
      {/* ====================================================================== */}
      {!isLoading && !hasRealData && (
        <div className="mx-auto max-w-3xl py-12 space-y-12">
          {/* Main Hero Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#22252e] bg-[#13151a] px-3 py-1 text-xs text-[#9aa1b0]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Workspace Ready</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f0f2f5]">
              Investigate software issues with an AI engineering team.
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-[#9aa1b0]">
              Import a public GitHub issue or repository to gather context, investigate
              the problem, and prepare a human-approved implementation proposal.
            </p>

            {/* Primary & Secondary Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => openImport("issue")}
                className="flex items-center gap-2 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2ea043] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <GitPullRequest className="h-4 w-4" />
                <span>Import GitHub Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-2 rounded-md border border-[#2d313d] bg-[#181b21] px-4 py-2 text-xs font-semibold text-[#f0f2f5] shadow-sm hover:bg-[#22252e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <FolderGit2 className="h-4 w-4" />
                <span>Import Repository</span>
              </button>
            </div>
          </div>

          {/* Three Understated Workflow Steps: Import → Investigate → Review */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-5 space-y-2.5 transition-colors hover:border-[#2d313d]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#22252e] bg-[#0d0e12] text-[#58a6ff] text-xs font-bold font-mono">
                1
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f0f2f5]">
                Import
              </h2>
              <p className="text-xs leading-relaxed text-[#9aa1b0]">
                Provide a public GitHub issue or repository URL. BugBunny maps the repository structure with bounded read-only inspection.
              </p>
            </div>

            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-5 space-y-2.5 transition-colors hover:border-[#2d313d]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#22252e] bg-[#0d0e12] text-[#58a6ff] text-xs font-bold font-mono">
                2
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f0f2f5]">
                Investigate
              </h2>
              <p className="text-xs leading-relaxed text-[#9aa1b0]">
                Specialized AI agents investigate code context, pinpoint root causes, author minimal patch proposals, and verify test suites.
              </p>
            </div>

            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-5 space-y-2.5 transition-colors hover:border-[#2d313d]">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#22252e] bg-[#0d0e12] text-[#58a6ff] text-xs font-bold font-mono">
                3
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f0f2f5]">
                Review
              </h2>
              <p className="text-xs leading-relaxed text-[#9aa1b0]">
                Inspect evidence, proposed plans, unified diffs, and verification reports before explicitly approving any implementation.
              </p>
            </div>
          </div>

          {/* Safety Note */}
          <div className="flex items-center justify-center gap-2.5 rounded-lg border border-[#22252e] bg-[#13151a] p-4 text-center text-xs text-[#9aa1b0]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              BugBunny proposes changes. Your repository stays under your control.
            </span>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2. REAL-DATA WORKSPACE (Only renders when real API data exists)        */}
      {/* ====================================================================== */}
      {!isLoading && hasRealData && (
        <div className="space-y-8">
          {/* Header & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252e] pb-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#f0f2f5]">
                Engineering Workspace
              </h1>
              <p className="mt-1 text-xs text-[#9aa1b0]">
                Connected repositories, active issues, and verified agent investigations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openImport("issue")}
                className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Import GitHub Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-1.5 rounded-md border border-[#22252e] bg-[#181b21] px-3 py-1.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#22252e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Import Repository</span>
              </button>

              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center justify-center rounded-md border border-[#22252e] bg-[#181b21] p-1.5 text-[#9aa1b0] hover:text-[#f0f2f5] transition-colors"
                title="Refresh workspace from API"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Real API-Calculated Summary Metric Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-4 space-y-1">
              <span className="text-xs font-medium text-[#9aa1b0]">
                Connected Repositories
              </span>
              <p className="text-2xl font-bold font-mono tracking-tight text-[#f0f2f5]">
                {summary.repositories_count}
              </p>
            </div>

            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-4 space-y-1">
              <span className="text-xs font-medium text-[#9aa1b0]">
                Tracked Issues
              </span>
              <p className="text-2xl font-bold font-mono tracking-tight text-[#f0f2f5]">
                {summary.issues_count}
              </p>
            </div>

            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-4 space-y-1">
              <span className="text-xs font-medium text-[#9aa1b0]">
                Agent Investigations
              </span>
              <p className="text-2xl font-bold font-mono tracking-tight text-[#f0f2f5]">
                {summary.investigations_count}
              </p>
            </div>

            <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-4 space-y-1">
              <span className="text-xs font-medium text-[#9aa1b0]">
                Awaiting Approval
              </span>
              <p className="text-2xl font-bold font-mono tracking-tight text-[#f0f2f5]">
                {summary.awaiting_approval_count}
              </p>
            </div>
          </div>

          {/* Connected Repositories (Only real records from API) */}
          {repositories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9aa1b0]">
                  Connected Repositories
                </h2>
                <Link
                  href="/issues"
                  className="text-xs text-[#58a6ff] hover:underline"
                >
                  View all issues &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="rounded-lg border border-[#22252e] bg-[#13151a] p-4 flex flex-col justify-between hover:border-[#2d313d] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#58a6ff] truncate">
                          {repo.name}
                        </span>
                        <span className="rounded-full border border-[#22252e] bg-[#0d0e12] px-2 py-0.5 text-[10px] font-mono text-[#9aa1b0]">
                          {repo.defaultBranch || "main"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#9aa1b0] line-clamp-2">
                        {repo.owner ? `Owner: ${repo.owner}` : "Imported repository"}
                        {repo.fileCount ? ` · ${repo.fileCount} files indexed` : ""}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#22252e] flex items-center justify-between text-xs font-mono text-[#626875]">
                      <span>{repo.mode === "live_github" ? "GitHub Import" : "Public Repo"}</span>
                      <Link
                        href={`/issues?repo=${encodeURIComponent(repo.name)}`}
                        className="text-[#58a6ff] hover:underline text-xs"
                      >
                        Inspect &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Investigations (Only real records from API) */}
          {investigations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9aa1b0]">
                Recent Investigations
              </h2>

              <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden divide-y divide-[#22252e]">
                {investigations.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-[#181b21] transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/issues/${inv.issue_id || inv.id}`}
                          className="font-mono text-xs font-semibold text-[#58a6ff] hover:underline"
                        >
                          {inv.issue_key || inv.id.slice(0, 8)}
                        </Link>
                        <StatusBadge status={inv.status} />
                        {inv.repository_name && (
                          <span className="text-xs text-[#626875] font-mono">
                            {inv.repository_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9aa1b0] truncate">
                        {inv.root_cause_summary ||
                          "Investigation trace recorded in database."}
                      </p>
                    </div>

                    <Link
                      href={`/issues/${inv.issue_id || inv.id}`}
                      className="flex items-center gap-1 rounded border border-[#22252e] bg-[#181b21] px-2.5 py-1 text-xs text-[#c9d1d9] hover:text-white hover:bg-[#22252e] transition-colors shrink-0 self-start sm:self-auto"
                    >
                      <span>View Run</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Statement */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-[#22252e] bg-[#13151a] p-3 text-center text-xs text-[#9aa1b0]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              BugBunny proposes changes. Your repository stays under your control.
            </span>
          </div>
        </div>
      )}

      {/* GitHub Import Modal */}
      <ImportGitHubModal
        isOpen={isImportModalOpen}
        initialTab={importModalTab}
        onClose={() => setIsImportModalOpen(false)}
        onIssueImported={() => {
          setIsImportModalOpen(false);
          loadData();
        }}
        onRepoImported={() => {
          setIsImportModalOpen(false);
          loadData();
        }}
      />
    </main>
  );
}
