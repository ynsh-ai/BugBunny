"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode2,
  FileText,
  FolderGit2,
  GitBranch,
  Layers,
  RefreshCw,
  ShieldCheck,
  TestTube2,
  XCircle,
} from "lucide-react";

import {
  fetchInvestigationDetail,
  fetchIssueDetail,
  fetchRepositories,
  submitApprovalDecision,
} from "@/lib/api";
import { InvestigationDetail, IssueDetail, RepositoryItem } from "@/mock/types";
import {
  PriorityBadge,
  SourceBadge,
  StatusBadge,
} from "@/components/Badge";
import { AgentTimeline } from "@/components/AgentTimeline";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { ImplementationPlan } from "@/components/ImplementationPlan";
import { CodeDiffViewer } from "@/components/CodeDiffViewer";
import { TestResultsViewer } from "@/components/TestResultsViewer";
import { ReviewChecklist } from "@/components/ReviewChecklist";
import { DocPreview } from "@/components/DocPreview";
import { ActionConfirmModal } from "@/components/ActionConfirmModal";

interface InvestigationDetailClientProps {
  investigationId: string;
}

async function fetchInvestigationBundle(investigationId: string): Promise<{
  investigation: InvestigationDetail | null;
  issue: IssueDetail | null;
  repository: RepositoryItem | null;
}> {
  const inv = await fetchInvestigationDetail(investigationId);
  if (!inv) {
    return { investigation: null, issue: null, repository: null };
  }

  const issueLookup = inv.issueKey || inv.issueId;
  const [issueData, repos] = await Promise.all([
    issueLookup ? fetchIssueDetail(issueLookup) : Promise.resolve(null),
    inv.repositoryName ? fetchRepositories() : Promise.resolve([]),
  ]);

  const matchedRepo = inv.repositoryName
    ? repos.find(
        (r) =>
          r.id === inv.repositoryName ||
          r.name.toLowerCase() === inv.repositoryName!.toLowerCase() ||
          `${r.owner}/${r.name}`.toLowerCase() ===
            inv.repositoryName!.toLowerCase()
      ) || null
    : null;

  return { investigation: inv, issue: issueData, repository: matchedRepo };
}

export function InvestigationDetailClient({
  investigationId,
}: InvestigationDetailClientProps) {
  const [investigation, setInvestigation] =
    useState<InvestigationDetail | null>(null);
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [repository, setRepository] = useState<RepositoryItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    setError(null);
    setDecisionError(null);
    try {
      const bundle = await fetchInvestigationBundle(investigationId);
      if (!bundle.investigation) {
        setInvestigation(null);
        setIssue(null);
        setRepository(null);
        setNotFound(true);
        return;
      }

      setInvestigation(bundle.investigation);
      setIssue(bundle.issue);
      setRepository(bundle.repository);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load investigation details.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [investigationId]);

  useEffect(() => {
    let isMounted = true;

    fetchInvestigationBundle(investigationId)
      .then((bundle) => {
        if (!isMounted) return;
        if (!bundle.investigation) {
          setInvestigation(null);
          setIssue(null);
          setRepository(null);
          setNotFound(true);
          return;
        }
        setInvestigation(bundle.investigation);
        setIssue(bundle.issue);
        setRepository(bundle.repository);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load investigation details.";
        setError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [investigationId]);

  const handleConfirmDecision = async (note: string) => {
    if (!investigation || !modalType) return;
    const decision =
      modalType === "approve" ? "approved_for_export" : "rejected";
    setDecisionError(null);

    try {
      await submitApprovalDecision(
        investigation.id,
        decision,
        "Engineering Reviewer",
        note || "Decision recorded by reviewer."
      );
      setModalType(null);
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to record approval decision.";
      setDecisionError(message);
      setModalType(null);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="h-6 w-6 mb-3 mx-auto animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
        <p className="text-xs font-mono text-[#777D71]">
          Loading investigation workspace...
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
            <span>Unable to load investigation</span>
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
              href="/dashboard/investigations"
              className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-3 py-1.5 font-mono text-xs font-semibold text-[#171916] hover:bg-[#E8EAE3] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Investigations</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !investigation) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xs bg-[#E8EAE3] border border-[#DADDD3] text-[#777D71]">
          <Layers className="h-6 w-6 text-[#D99A37]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-bold text-[#171916]">
            Investigation not found
          </h1>
          <p className="text-xs text-[#777D71]">
            The investigation &ldquo;{investigationId}&rdquo; does not exist in the
            active workspace.
          </p>
        </div>
        <Link
          href="/dashboard/investigations"
          className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Investigations</span>
        </Link>
      </main>
    );
  }

  const targetIssueId = investigation.issueKey || investigation.issueId;
  const isInProgress =
    investigation.status === "in_progress" ||
    investigation.status === "In progress" ||
    investigation.status === "Testing";
  const isAwaitingApproval =
    investigation.status === "awaiting_approval" ||
    investigation.status === "Review required";
  const isApproved =
    investigation.status === "approved_for_export" ||
    investigation.status === "Approved";
  const isRejected =
    investigation.status === "rejected" || investigation.status === "Rejected";

  const githubIssueUrl =
    issue?.githubUrl ||
    (issue?.githubIssueNumber && issue?.repository
      ? `https://github.com/${issue.repository}/issues/${issue.githubIssueNumber}`
      : null);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#171916]">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#777D71]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard/investigations"
            className="flex items-center gap-1 text-[#777D71] hover:text-[#171916] transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Investigations</span>
          </Link>
          <span>/</span>
          {investigation.repositoryName && (
            <>
              {repository ? (
                <Link
                  href={`/dashboard/repositories/${encodeURIComponent(
                    repository.id
                  )}`}
                  className="hover:text-[#171916] hover:underline truncate"
                >
                  {investigation.repositoryName}
                </Link>
              ) : (
                <span className="truncate">{investigation.repositoryName}</span>
              )}
              <span>/</span>
            </>
          )}
          <span className="text-[#171916] font-bold truncate">
            {targetIssueId || investigation.id.slice(0, 8)}
          </span>
        </div>

        <button
          type="button"
          onClick={loadData}
          aria-label="Refresh investigation"
          className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-2.5 py-1 text-xs font-mono text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </nav>

      {/* 1. Investigation Header and Status */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#171916] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
                INV-{investigation.id.slice(0, 8)}
              </span>
              <StatusBadge status={investigation.status} />
              <SourceBadge mode={investigation.mode} />
              {investigation.branchName && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-[#777D71] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
                  <GitBranch className="h-3 w-3" />
                  <span>{investigation.branchName}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171916]">
              {issue?.title ||
                (targetIssueId
                  ? `Investigation for ${targetIssueId}`
                  : "Investigation Session")}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#777D71]">
              {investigation.startedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Started {new Date(investigation.startedAt).toLocaleString()}
                  </span>
                </span>
              )}
              {investigation.completedAt && (
                <span>
                  • Completed{" "}
                  {new Date(investigation.completedAt).toLocaleString()}
                </span>
              )}
              {investigation.targetCommit && (
                <span>• Target commit: {investigation.targetCommit}</span>
              )}
            </div>
          </div>

          {/* Approval Actions / Status */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAwaitingApproval && (
              <>
                <button
                  type="button"
                  onClick={() => setModalType("reject")}
                  className="inline-flex items-center gap-1.5 rounded-xs border border-[#D65B56]/40 bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#B33833] hover:bg-[#D65B56]/10 transition-colors cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalType("approve")}
                  className="inline-flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-4 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve Proposal</span>
                </button>
              </>
            )}
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-[#35A56A]/40 bg-[#35A56A]/12 px-3 py-1.5 text-xs font-mono font-semibold text-[#227247]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#35A56A]" />
                <span>Approved for Export</span>
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/12 px-3 py-1.5 text-xs font-mono font-semibold text-[#B33833]">
                <XCircle className="h-3.5 w-3.5 text-[#D65B56]" />
                <span>Rejected</span>
              </span>
            )}
          </div>
        </div>

        {decisionError && (
          <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-3 text-xs text-[#B33833]">
            {decisionError}
          </div>
        )}

        {investigation.decisions.length > 0 && (
          <div className="border-t border-[#DADDD3] pt-3 space-y-2">
            <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777D71]">
              Recorded Approval Decisions
            </h2>
            <div className="space-y-1.5">
              {investigation.decisions.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xs border border-[#DADDD3] bg-[#F5F5F0] px-3 py-2 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.decision} />
                    <span className="font-semibold text-[#171916]">
                      {d.reviewer}
                    </span>
                    {d.notes && (
                      <span className="text-[#777D71]">— {d.notes}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#777D71]">
                    {new Date(d.decided_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Safety Banner */}
      <div className="flex items-center gap-2 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-2 text-xs font-mono text-[#777D71]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#35A56A]" />
        <span>
          Generated proposals are advisory only and have not been applied to
          your repository.
        </span>
      </div>

      {/* 2. Original Issue Information & 3. Repository Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Original Issue Information */}
        <section className="lg:col-span-2 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#DADDD3] pb-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Original Issue Information
            </h2>
            {targetIssueId && (
              <Link
                href={`/dashboard/issues/${encodeURIComponent(targetIssueId)}`}
                className="text-xs font-mono text-[#171916] hover:underline"
              >
                Open Issue Workspace →
              </Link>
            )}
          </div>

          {issue ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#171916] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
                  {issue.id}
                </span>
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
                {issue.author && (
                  <span className="font-mono text-xs text-[#777D71]">
                    Author: @{issue.author}
                  </span>
                )}
                {githubIssueUrl && (
                  <a
                    href={githubIssueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#171916] hover:underline"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <p className="text-sm font-semibold text-[#171916]">
                {issue.title}
              </p>

              {issue.description ? (
                <div className="rounded-xs border border-[#DADDD3] bg-[#F5F5F0] p-3 text-xs leading-relaxed text-[#171916] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {issue.description}
                </div>
              ) : (
                <p className="text-xs text-[#777D71]">
                  No issue description was provided.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#777D71]">
              {targetIssueId
                ? `Issue reference: ${targetIssueId}. Detailed issue metadata is currently unavailable.`
                : "Original issue metadata is unavailable for this investigation."}
            </p>
          )}
        </section>

        {/* 3. Repository Information */}
        <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#DADDD3] pb-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Repository Information
            </h2>
            <FolderGit2 className="h-4 w-4 text-[#777D71]" />
          </div>

          {investigation.repositoryName ? (
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-mono text-[11px] text-[#777D71] uppercase">
                  Repository
                </div>
                {repository ? (
                  <Link
                    href={`/dashboard/repositories/${encodeURIComponent(
                      repository.id
                    )}`}
                    className="font-mono text-sm font-bold text-[#171916] hover:underline"
                  >
                    {investigation.repositoryName}
                  </Link>
                ) : (
                  <div className="font-mono text-sm font-bold text-[#171916]">
                    {investigation.repositoryName}
                  </div>
                )}
              </div>
              <div>
                <div className="font-mono text-[11px] text-[#777D71] uppercase">
                  Proposed Branch
                </div>
                <div className="font-mono font-semibold text-[#171916]">
                  {investigation.branchName || "Not assigned"}
                </div>
              </div>
              <div>
                <div className="font-mono text-[11px] text-[#777D71] uppercase">
                  Target Commit
                </div>
                <div className="font-mono font-semibold text-[#171916]">
                  {investigation.targetCommit || "HEAD"}
                </div>
              </div>
              {repository ? (
                <Link
                  href={`/dashboard/repositories/${encodeURIComponent(
                    repository.id
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1.5 font-mono text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors"
                >
                  <span>Open Repository Workspace</span>
                </Link>
              ) : (
                <p className="text-[11px] text-[#777D71]">
                  Repository workspace ID could not be resolved.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#777D71]">
              Repository context is unavailable for this investigation.
            </p>
          )}
        </section>
      </div>

      {/* 4. Agent Execution Timeline */}
      <section aria-label="Agent execution timeline">
        {investigation.timeline.length > 0 ? (
          <AgentTimeline
            timeline={investigation.timeline}
            isInvestigating={isInProgress}
          />
        ) : (
          <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Agent Execution Timeline
            </h2>
            <p className="text-xs text-[#777D71]">
              {isInProgress
                ? "Investigation is queued or starting. No agent runs have been recorded yet."
                : "No agent execution runs were recorded for this investigation."}
            </p>
          </div>
        )}
      </section>

      {/* 5. Findings and Evidence */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <FileCode2 className="h-4 w-4 text-[#171916]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
            Findings &amp; Supporting Evidence
            {investigation.evidence.length > 0
              ? ` (${investigation.evidence.length})`
              : ""}
          </h2>
        </div>
        <div className="p-5">
          {investigation.evidence.length > 0 ? (
            <EvidenceViewer evidence={investigation.evidence} />
          ) : (
            <p className="text-xs text-[#777D71]">
              No supporting evidence items are available for this investigation yet.
            </p>
          )}
        </div>
      </section>

      {/* 6. Root Cause Analysis */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#171916]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Root Cause Analysis
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#777D71]">
            Agent hypothesis — verify against evidence
          </span>
        </div>
        <div className="p-5">
          {investigation.rootCauseSummary.trim().length > 0 ? (
            <p className="text-xs leading-relaxed text-[#171916] whitespace-pre-wrap">
              {investigation.rootCauseSummary}
            </p>
          ) : (
            <p className="text-xs text-[#777D71]">
              Root cause analysis is not yet available for this investigation.
            </p>
          )}
        </div>
      </section>

      {/* 7. Proposed Solution */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <Layers className="h-4 w-4 text-[#171916]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
            Proposed Solution
            {investigation.proposedPlan.length > 0
              ? ` (${investigation.proposedPlan.length} steps)`
              : ""}
          </h2>
        </div>
        <div className="p-5">
          {investigation.proposedPlan.length > 0 ? (
            <ImplementationPlan steps={investigation.proposedPlan} />
          ) : (
            <p className="text-xs text-[#777D71]">
              No implementation plan has been generated yet.
            </p>
          )}
        </div>
      </section>

      {/* 8. Code Changes / Diff Viewer */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-[#171916]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
              Proposed Code Changes (Unified Diff)
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#777D71]">
            Not applied to repository
          </span>
        </div>
        <div className="p-5">
          {investigation.diffs.length > 0 ? (
            <CodeDiffViewer diffs={investigation.diffs} />
          ) : (
            <p className="text-xs text-[#777D71]">
              No code diff or patch proposal is available for this investigation.
            </p>
          )}
        </div>
      </section>

      {/* 9. Test Results */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <TestTube2 className="h-4 w-4 text-[#171916]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
            Test Results
          </h2>
        </div>
        <div className="p-5">
          {investigation.testResults ? (
            <TestResultsViewer testResults={investigation.testResults} />
          ) : (
            <p className="text-xs text-[#777D71]">
              Tests have not been run or no test results were recorded for this
              investigation.
            </p>
          )}
        </div>
      </section>

      {/* 10. Code Review and Generated Artifacts */}
      <section className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#DADDD3] bg-[#E8EAE3] px-5 py-3">
          <FileText className="h-4 w-4 text-[#171916]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
            Code Review &amp; Generated Artifacts
          </h2>
        </div>
        <div className="p-5 space-y-6">
          {investigation.review ? (
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777D71]">
                Code Review Audit
              </h3>
              <ReviewChecklist review={investigation.review} />
            </div>
          ) : (
            <p className="text-xs text-[#777D71]">
              Code review findings are not available for this investigation.
            </p>
          )}

          {investigation.documentation && (
            <div className="space-y-2 border-t border-[#DADDD3] pt-5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777D71]">
                Documentation &amp; PR Draft
              </h3>
              <DocPreview doc={investigation.documentation} />
            </div>
          )}

          {investigation.artifacts.length > 0 && (
            <div className="space-y-2 border-t border-[#DADDD3] pt-5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777D71]">
                Persisted Artifacts ({investigation.artifacts.length})
              </h3>
              <div className="divide-y divide-[#DADDD3] rounded-xs border border-[#DADDD3]">
                {investigation.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#171916]">
                        {artifact.name}
                      </span>
                      <span className="rounded-2xs border border-[#DADDD3] bg-[#E8EAE3] px-1.5 py-0.5 text-[10px] text-[#777D71]">
                        {artifact.artifact_type}
                      </span>
                    </div>
                    {artifact.created_at && (
                      <span className="text-[11px] text-[#777D71]">
                        {new Date(artifact.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <ActionConfirmModal
        isOpen={modalType !== null}
        type={modalType || "approve"}
        issueId={targetIssueId || investigation.id}
        repositoryName={investigation.repositoryName || "repository"}
        onClose={() => setModalType(null)}
        onConfirm={handleConfirmDecision}
      />
    </main>
  );
}
