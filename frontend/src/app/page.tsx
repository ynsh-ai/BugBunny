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
  ExternalLink,
  Activity,
  Layers,
  CheckCircle2,
  Plus,
} from "lucide-react";

import {
  fetchIssues,
  fetchRepositories,
  fetchWorkspaceSummary,
} from "@/lib/api";
import { IssueDetail, RepositoryItem, WorkspaceSummary } from "@/mock/types";
import { ImportGitHubModal } from "@/components/ImportGitHubModal";
import { StatusBadge } from "@/components/Badge";

export default function WorkspacePage() {
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
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
      const [issuesData, reposData, summaryData] = await Promise.all([
        fetchIssues(),
        fetchRepositories(),
        fetchWorkspaceSummary(),
      ]);
      setIssues(issuesData);
      setRepositories(reposData);
      setSummary(summaryData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load workspace data.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchIssues(), fetchRepositories(), fetchWorkspaceSummary()])
      .then(([issuesData, reposData, summaryData]) => {
        if (isMounted) {
          setIssues(issuesData);
          setRepositories(reposData);
          setSummary(summaryData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load workspace data.";
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

  const hasData = issues.length > 0 || repositories.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Offline / Error Warning */}
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

      {/* Loading Skeleton */}
      {isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#8b949e] mb-3" />
          <p className="text-xs font-mono text-[#8b949e]">Connecting to workspace API...</p>
        </div>
      )}

      {/* 1. Empty Workspace / Honest Onboarding State */}
      {!isLoading && !hasData && (
        <div className="mx-auto max-w-3xl py-12 space-y-10">
          {/* Main Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs text-[#8b949e]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Engineering Workspace Ready</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f0f6fc]">
              Investigate software issues with an AI engineering team.
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#8b949e]">
              Import a public GitHub issue or repository. BugBunny gathers codebase context,
              creates an implementation proposal, and keeps every change human-approved.
            </p>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => openImport("issue")}
                className="flex items-center gap-2 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2ea043] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <GitPullRequest className="h-4 w-4" />
                <span>Import GitHub Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-xs font-semibold text-[#c9d1d9] shadow-sm hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <FolderGit2 className="h-4 w-4" />
                <span>Import Repository</span>
              </button>
            </div>
          </div>

          {/* Three-step explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5 space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#58a6ff] text-xs font-bold font-mono">
                1
              </div>
              <h2 className="text-xs font-semibold text-[#f0f6fc]">Import</h2>
              <p className="text-[11px] leading-relaxed text-[#8b949e]">
                Provide a public GitHub issue or repository URL. BugBunny maps the file hierarchy with bounded read-only inspection.
              </p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5 space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#58a6ff] text-xs font-bold font-mono">
                2
              </div>
              <h2 className="text-xs font-semibold text-[#f0f6fc]">Investigate</h2>
              <p className="text-[11px] leading-relaxed text-[#8b949e]">
                Specialist agents analyze requirements, locate root causes, construct patch proposals, and execute test suites.
              </p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5 space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#58a6ff] text-xs font-bold font-mono">
                3
              </div>
              <h2 className="text-xs font-semibold text-[#f0f6fc]">Review and approve</h2>
              <p className="text-[11px] leading-relaxed text-[#8b949e]">
                Inspect evidence snippets, proposed plan, code diffs, and verification reports before explicitly approving changes.
              </p>
            </div>
          </div>

          {/* Safety Statement */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-[#30363d] bg-[#0d1117] p-4 text-center text-xs text-[#8b949e]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              BugBunny does not modify your repository without your explicit approval.
            </span>
          </div>
        </div>
      )}

      {/* 2. Real-Data Workspace (Shown ONLY when real data exists) */}
      {!isLoading && hasData && (
        <div className="space-y-8">
          {/* Header & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#f0f6fc]">
                Engineering Workspace
              </h1>
              <p className="mt-1 text-xs text-[#8b949e]">
                Real-time tracking of imported GitHub repositories, active issues, and verified agent investigations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openImport("issue")}
                className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Import Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-semibold text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff]"
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Import Repo</span>
              </button>

              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center justify-center rounded-md border border-[#30363d] bg-[#21262d] p-1.5 text-[#8b949e] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
                title="Refresh workspace from API"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Real API-Backed Summary Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#8b949e]">
                <span>Repositories</span>
                <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-[#f0f6fc] font-mono">
                {summary.repositories_count}
              </div>
              <p className="text-[11px] text-[#8b949e]">Connected read-only</p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#8b949e]">
                <span>Tracked Issues</span>
                <Layers className="h-4 w-4 text-[#8b949e]" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-[#f0f6fc] font-mono">
                {summary.issues_count}
              </div>
              <p className="text-[11px] text-[#8b949e]">In current workspace</p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#8b949e]">
                <span>Investigations</span>
                <Activity className="h-4 w-4 text-[#8b949e]" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-[#f0f6fc] font-mono">
                {summary.investigations_count}
              </div>
              <p className="text-[11px] text-[#8b949e]">Executed agent workflows</p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-[#8b949e]">
                <span>Awaiting Approval</span>
                <CheckCircle2 className="h-4 w-4 text-[#58a6ff]" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-[#f0f6fc] font-mono">
                {summary.awaiting_approval_count}
              </div>
              <p className="text-[11px] text-[#8b949e]">Pending human sign-off</p>
            </div>
          </div>

          {/* Tracked Repositories Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">
                Connected Repositories
              </h2>
              <span className="text-xs font-mono text-[#8b949e]">
                {repositories.length} repository{repositories.length === 1 ? "" : "ies"}
              </span>
            </div>

            {repositories.length === 0 ? (
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-6 text-center text-xs text-[#8b949e]">
                No repositories connected yet. Click &ldquo;Import Repository&rdquo; to add a public GitHub repository.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex flex-col justify-between rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#f0f6fc] truncate">
                          {repo.owner}/{repo.name}
                        </span>
                        <span className="rounded border border-emerald-800/60 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                          read-only
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-[#8b949e] space-y-1">
                        <div>
                          Branch: <span className="text-[#c9d1d9]">{repo.defaultBranch}</span>
                        </div>
                        <div>
                          Safe indexed files:{" "}
                          <span className="text-[#58a6ff]">{repo.fileCount ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#21262d] flex items-center justify-between text-xs">
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <span className="text-[10px] font-mono text-[#8b949e]">
                        {repo.mode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Issues Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">
                Tracked Issues
              </h2>
              <Link
                href="/issues"
                className="flex items-center gap-1 text-xs text-[#58a6ff] hover:underline"
              >
                <span>View all issues</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {issues.length === 0 ? (
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-8 text-center text-xs text-[#8b949e]">
                No issues tracked yet. Click &ldquo;Import Issue&rdquo; to analyze a public issue.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e] font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Issue</th>
                      <th className="py-2.5 px-4 font-medium">Repository</th>
                      <th className="py-2.5 px-4 font-medium">Status</th>
                      <th className="py-2.5 px-4 font-medium">Mode</th>
                      <th className="py-2.5 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#21262d]">
                    {issues.slice(0, 8).map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-[#21262d]/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/issues/${encodeURIComponent(issue.id)}`}
                            className="font-medium text-[#f0f6fc] hover:text-[#58a6ff] transition-colors block max-w-md truncate"
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
                        <td className="py-3 px-4 font-mono text-[11px] text-[#8b949e]">
                          {issue.mode || "demo"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/issues/${encodeURIComponent(issue.id)}`}
                            className="inline-flex items-center gap-1 rounded border border-[#30363d] bg-[#21262d] px-2 py-1 text-[11px] font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
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
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportGitHubModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialTab={importModalTab}
        onIssueImported={() => loadData()}
        onRepoImported={() => loadData()}
      />
    </main>
  );
}
