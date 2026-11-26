"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  FileCode2,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";

import {
  fetchInvestigations,
  fetchIssues,
  fetchRepositoryDetail,
  triggerInvestigation,
} from "@/lib/api";
import {
  InvestigationItem,
  IssueDetail,
  RepositoryItem,
} from "@/mock/types";
import { Badge, PriorityBadge, SourceBadge, StatusBadge } from "@/components/Badge";
import { ImportGitHubModal } from "@/components/ImportGitHubModal";

interface RepositoryDetailClientProps {
  repositoryId: string;
}

export function RepositoryDetailClient({
  repositoryId,
}: RepositoryDetailClientProps) {
  const router = useRouter();
  const [repository, setRepository] = useState<RepositoryItem | null>(null);
  const [issues, setIssues] = useState<IssueDetail[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [isStartingInvestigation, setIsStartingInvestigation] =
    useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [showFileTree, setShowFileTree] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const [repoData, allIssues, allInvestigations] = await Promise.all([
        fetchRepositoryDetail(repositoryId),
        fetchIssues(),
        fetchInvestigations(),
      ]);

      if (!repoData) {
        setRepository(null);
        setNotFound(true);
        return;
      }

      setRepository(repoData);

      const repoIssues = allIssues.filter(
        (issue) =>
          issue.repository.toLowerCase() === repoData.name.toLowerCase() ||
          issue.repository.toLowerCase() ===
            `${repoData.owner}/${repoData.name}`.toLowerCase()
      );
      setIssues(repoIssues);
      setSelectedIssueId((prev) =>
        prev && repoIssues.some((i) => i.id === prev)
          ? prev
          : repoIssues[0]?.id || ""
      );

      const repoInvestigations = allInvestigations.filter(
        (inv) =>
          inv.repository_name &&
          (inv.repository_name.toLowerCase() === repoData.name.toLowerCase() ||
            inv.repository_name.toLowerCase() ===
              `${repoData.owner}/${repoData.name}`.toLowerCase())
      );
      setInvestigations(repoInvestigations);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load repository details.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchRepositoryDetail(repositoryId),
      fetchIssues(),
      fetchInvestigations(),
    ])
      .then(([repoData, allIssues, allInvestigations]) => {
        if (!isMounted) return;
        if (!repoData) {
          setRepository(null);
          setNotFound(true);
          return;
        }

        setRepository(repoData);

        const repoIssues = allIssues.filter(
          (issue) =>
            issue.repository.toLowerCase() === repoData.name.toLowerCase() ||
            issue.repository.toLowerCase() ===
              `${repoData.owner}/${repoData.name}`.toLowerCase()
        );
        setIssues(repoIssues);
        setSelectedIssueId((prev) =>
          prev && repoIssues.some((i) => i.id === prev)
            ? prev
            : repoIssues[0]?.id || ""
        );

        const repoInvestigations = allInvestigations.filter(
          (inv) =>
            inv.repository_name &&
            (inv.repository_name.toLowerCase() === repoData.name.toLowerCase() ||
              inv.repository_name.toLowerCase() ===
                `${repoData.owner}/${repoData.name}`.toLowerCase())
        );
        setInvestigations(repoInvestigations);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load repository details.";
        setError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [repositoryId]);

  const issueStats = useMemo(() => {
    const total = issues.length;
    const active = issues.filter(
      (i) =>
        i.status === "Queued" ||
        i.status === "In progress" ||
        i.status === "Testing"
    ).length;
    const awaitingApproval = issues.filter(
      (i) =>
        i.status === "Review required" ||
        i.investigationStatus === "awaiting_approval"
    ).length;
    const completed = issues.filter(
      (i) =>
        i.status === "Investigation complete" ||
        i.status === "Approved" ||
        i.investigationStatus === "approved_for_export"
    ).length;

    return { total, active, awaitingApproval, completed };
  }, [issues]);

  const handleStartInvestigation = async () => {
    if (!selectedIssueId) return;
    setIsStartingInvestigation(true);
    setActionError(null);
    try {
      const updated = await triggerInvestigation(selectedIssueId);
      if (updated?.investigationId) {
        router.push(
          `/dashboard/investigations/${encodeURIComponent(updated.investigationId)}`
        );
        return;
      }
      router.push(`/dashboard/issues/${encodeURIComponent(selectedIssueId)}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start investigation.";
      setActionError(message);
    } finally {
      setIsStartingInvestigation(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="h-6 w-6 mb-3 mx-auto animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
        <p className="text-xs font-mono text-[#777D71]">
          Loading repository workspace...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-5 text-xs text-[#B33833] space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#D65B56]" />
            <span>Unable to load repository</span>
          </div>
          <p>{error}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xs bg-[#D65B56] px-3 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#B33833] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <Link
              href="/dashboard/repositories"
              className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3 py-1.5 font-mono text-xs font-semibold text-[#171916] hover:bg-[#E8EAE3] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Repositories</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !repository) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xs bg-[#E8EAE3] border border-[#DADDD3] text-[#777D71]">
          <FolderGit2 className="h-6 w-6 text-[#D99A37]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-bold text-[#171916]">
            Repository not found
          </h1>
          <p className="text-xs text-[#777D71]">
            The repository &ldquo;{repositoryId}&rdquo; could not be found in your
            BugBunny workspace.
          </p>
        </div>
        <Link
          href="/dashboard/repositories"
          className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Repositories</span>
        </Link>
      </main>
    );
  }

  const cachedFileCount =
    repository.fileCount ?? (repository.files ? repository.files.length : 0);
  const isIndexed = cachedFileCount > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#171916]">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#777D71]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard/repositories"
            className="flex items-center gap-1 text-[#777D71] hover:text-[#171916] transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Repositories</span>
          </Link>
          <span>/</span>
          <span className="truncate">{repository.owner}</span>
          <span>/</span>
          <span className="text-[#171916] font-bold truncate">
            {repository.name}
          </span>
        </div>

        <button
          type="button"
          onClick={loadData}
          aria-label="Refresh repository workspace"
          className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-2.5 py-1 text-xs font-mono text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </nav>

      {/* Repository Header Card */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={repository.isActive ? "success" : "neutral"}>
                {repository.isActive ? "Connected" : "Inactive"}
              </Badge>
              <SourceBadge mode={repository.mode} />
              <Badge variant="default">
                <GitBranch className="h-3 w-3" />
                <span>{repository.defaultBranch || "main"}</span>
              </Badge>
              <Badge variant="neutral">Visibility: Not provided by API</Badge>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171916] font-mono break-all">
                {repository.owner}/{repository.name}
              </h1>
              <p className="text-xs text-[#777D71]">
                Repository description is not returned by the current backend API.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#777D71]">
              {repository.githubUrl && (
                <a
                  href={repository.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#171916] font-semibold hover:underline"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {repository.createdAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Connected {new Date(repository.createdAt).toLocaleDateString()}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Start Investigation & Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#171916] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Import GitHub Issue</span>
            </button>
          </div>
        </div>
      </section>

      {/* Safety Banner */}
      <div className="flex items-center gap-2 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-2 text-xs font-mono text-[#777D71]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#35A56A]" />
        <span>
          Read-only workspace: BugBunny never pushes commits or mutates your
          repository directly.
        </span>
      </div>

      {/* Overview, Connection/Indexing Status & Issue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repository Overview & Indexing Status */}
        <section className="lg:col-span-2 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DADDD3] pb-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Repository Overview &amp; Indexing Status
            </h2>
            <Badge variant={isIndexed ? "success" : "warning"}>
              {isIndexed ? `Indexed (${cachedFileCount} files)` : "File tree pending"}
            </Badge>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3 space-y-1">
              <dt className="font-mono text-[11px] text-[#777D71] uppercase">
                Connection Mode
              </dt>
              <dd className="font-mono font-semibold text-[#171916]">
                {repository.mode || "connected_read_only"}
              </dd>
            </div>
            <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3 space-y-1">
              <dt className="font-mono text-[11px] text-[#777D71] uppercase">
                Default Branch
              </dt>
              <dd className="font-mono font-semibold text-[#171916]">
                {repository.defaultBranch || "main"}
              </dd>
            </div>
            <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3 space-y-1">
              <dt className="font-mono text-[11px] text-[#777D71] uppercase">
                Cached File Tree
              </dt>
              <dd className="font-mono font-semibold text-[#171916]">
                {isIndexed
                  ? `${cachedFileCount} bounded file entries`
                  : "No file tree cached yet"}
              </dd>
            </div>
            <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3 space-y-1">
              <dt className="font-mono text-[11px] text-[#777D71] uppercase">
                Last Updated
              </dt>
              <dd className="font-mono font-semibold text-[#171916]">
                {repository.updatedAt
                  ? new Date(repository.updatedAt).toLocaleString()
                  : "Unavailable"}
              </dd>
            </div>
          </dl>

          {repository.files && repository.files.length > 0 && (
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => setShowFileTree((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#171916] hover:underline cursor-pointer"
              >
                <FileCode2 className="h-3.5 w-3.5 text-[#777D71]" />
                <span>
                  {showFileTree
                    ? "Hide indexed file sample"
                    : `Show indexed file sample (${Math.min(
                        repository.files.length,
                        25
                      )} of ${repository.files.length})`}
                </span>
              </button>

              {showFileTree && (
                <div className="max-h-56 overflow-y-auto rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3 font-mono text-[11px] text-[#171916] space-y-1">
                  {repository.files.slice(0, 25).map((f) => (
                    <div
                      key={f.path}
                      className="flex items-center justify-between gap-2 truncate"
                    >
                      <span className="truncate">{f.path}</span>
                      {typeof f.size === "number" && (
                        <span className="text-[#777D71] shrink-0">
                          {f.size} B
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Issue Summary & Start Investigation */}
        <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#DADDD3] pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
                Issue Summary
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3">
                <div className="text-[11px] text-[#777D71]">Total Issues</div>
                <div className="text-xl font-bold text-[#171916]">
                  {issueStats.total}
                </div>
              </div>
              <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3">
                <div className="text-[11px] text-[#777D71]">Active</div>
                <div className="text-xl font-bold text-[#171916]">
                  {issueStats.active}
                </div>
              </div>
              <div className="rounded-xs border border-[#AEE64E] bg-[#C6F36B]/20 p-3">
                <div className="text-[11px] text-[#171916]">Awaiting Approval</div>
                <div className="text-xl font-bold text-[#171916]">
                  {issueStats.awaitingApproval}
                </div>
              </div>
              <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3">
                <div className="text-[11px] text-[#777D71]">Completed</div>
                <div className="text-xl font-bold text-[#171916]">
                  {issueStats.completed}
                </div>
              </div>
            </div>
          </div>

          {/* Start Investigation Action */}
          <div className="border-t border-[#DADDD3] pt-4 space-y-2.5">
            <label
              htmlFor="repo-issue-select"
              className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#777D71]"
            >
              Start Investigation
            </label>
            {issues.length > 0 ? (
              <>
                <select
                  id="repo-issue-select"
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  className="w-full rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-2.5 py-2 text-xs font-mono text-[#171916] focus:border-[#171916] focus:outline-none"
                >
                  {issues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.id} — {issue.title.slice(0, 56)}
                    </option>
                  ))}
                </select>
                {actionError && (
                  <p className="text-[11px] text-[#B33833]">{actionError}</p>
                )}
                <button
                  type="button"
                  disabled={isStartingInvestigation || !selectedIssueId}
                  onClick={handleStartInvestigation}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xs bg-[#C6F36B] px-4 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isStartingInvestigation ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  <span>
                    {isStartingInvestigation
                      ? "Starting Investigation..."
                      : "Start Investigation"}
                  </span>
                </button>
              </>
            ) : (
              <p className="text-xs text-[#777D71]">
                Import an issue from this repository to start an investigation.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Recent Issues */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-[#171916]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Recent Issues ({issues.length})
            </h2>
          </div>
          <Link
            href="/dashboard/issues"
            className="text-xs font-mono text-[#171916] hover:underline"
          >
            All issues →
          </Link>
        </div>

        {issues.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-[#777D71]">
              No issues imported for {repository.owner}/{repository.name} yet.
            </p>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xs bg-[#171916] px-3 py-1.5 text-xs font-semibold text-[#F5F5F0] hover:bg-[#292D27] transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Import Issue</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#DADDD3]">
            {issues.slice(0, 10).map((issue) => (
              <div
                key={issue.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F5F0] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/issues/${encodeURIComponent(issue.id)}`}
                      className="font-mono text-xs font-bold text-[#171916] hover:underline"
                    >
                      {issue.id}
                    </Link>
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                  <Link
                    href={`/dashboard/issues/${encodeURIComponent(issue.id)}`}
                    className="block text-xs sm:text-sm font-semibold text-[#171916] truncate hover:underline"
                  >
                    {issue.title}
                  </Link>
                </div>

                <Link
                  href={`/dashboard/issues/${encodeURIComponent(issue.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors shrink-0"
                >
                  <span>Open Issue</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Investigations */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#171916]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Recent Investigations ({investigations.length})
            </h2>
          </div>
          <Link
            href="/dashboard/investigations"
            className="text-xs font-mono text-[#171916] hover:underline"
          >
            All investigations →
          </Link>
        </div>

        {investigations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#777D71]">
            No investigations have been run for this repository yet.
          </div>
        ) : (
          <div className="divide-y divide-[#DADDD3]">
            {investigations.slice(0, 10).map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F5F0] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/investigations/${encodeURIComponent(inv.id)}`}
                      className="font-mono text-xs font-bold text-[#171916] hover:underline"
                    >
                      {inv.issue_key || inv.id.slice(0, 8)}
                    </Link>
                    <StatusBadge status={inv.status} />
                    {inv.current_stage && (
                      <span className="font-mono text-[11px] text-[#777D71]">
                        {inv.current_stage}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#777D71] truncate">
                    {inv.title || inv.root_cause_summary || "Investigation session"}
                  </p>
                </div>

                <Link
                  href={`/dashboard/investigations/${encodeURIComponent(inv.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-xs bg-[#171916] px-3 py-1.5 text-xs font-semibold text-[#F5F5F0] hover:bg-[#292D27] transition-colors shrink-0"
                >
                  <span>View Investigation</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Repository Management Actions */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-[#DADDD3] pb-3">
          <Settings className="h-4 w-4 text-[#777D71]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
            Repository Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-semibold text-[#171916]">
              Workspace connection controls
            </p>
            <p className="text-[#777D71]">
              Repository removal and re-indexing endpoints are not yet exposed by
              the backend API. You can manage workspace settings or import new
              issues from GitHub.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {repository.githubUrl && (
              <a
                href={repository.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1.5 font-mono text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors"
              >
                <span>GitHub Repo</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3 py-1.5 font-mono text-xs font-semibold text-[#171916] hover:bg-[#F5F5F0] transition-colors"
            >
              <span>Workspace Settings</span>
            </Link>
          </div>
        </div>
      </section>

      <ImportGitHubModal
        isOpen={isImportModalOpen}
        initialTab="issue"
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          void loadData();
        }}
      />
    </main>
  );
}
