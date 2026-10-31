"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IssueDetail, SystemMode } from "@/mock/types";
import {
  fetchIssueDetail,
  fetchSystemMode,
  submitApprovalDecision,
  triggerInvestigation,
} from "@/lib/api";
import { AgentTimeline } from "@/components/AgentTimeline";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { ImplementationPlan } from "@/components/ImplementationPlan";
import { CodeDiffViewer } from "@/components/CodeDiffViewer";
import { TestResultsViewer } from "@/components/TestResultsViewer";
import { ReviewChecklist } from "@/components/ReviewChecklist";
import { DocPreview } from "@/components/DocPreview";
import { ActionConfirmModal } from "@/components/ActionConfirmModal";
import { StatusBadge, PriorityBadge, SourceBadge } from "@/components/Badge";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCode2,
  TestTube2,
  ShieldCheck,
  FileText,
  AlertCircle,
  Layers,
  RefreshCw,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  Check,
  X,
} from "lucide-react";

interface IssueDetailClientProps {
  issueId: string;
}

export function IssueDetailClient({ issueId }: IssueDetailClientProps) {
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [systemMode, setSystemMode] = useState<SystemMode | null>(null);
  const [selectedMode, setSelectedMode] = useState<"demo" | "live">("demo");
  const [prevIssueId, setPrevIssueId] = useState(issueId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [reviewActionState, setReviewActionState] = useState<
    "idle" | "approved" | "rejected"
  >("idle");
  const [reviewNote, setReviewNote] = useState<string>("");
  const [approvalTimestamp, setApprovalTimestamp] = useState<string | null>(null);

  // Section collapse state for completed investigations
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    requirements: true,
    evidence: true,
    plan: true,
    patch: true,
    tests: true,
    review: true,
    docs: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (issueId !== prevIssueId) {
    setPrevIssueId(issueId);
    setIsLoading(true);
    setNotFound(false);
    setErrorMsg(null);
  }

  useEffect(() => {
    let isMounted = true;

    fetchIssueDetail(issueId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setNotFound(true);
        } else {
          setIssue(data);
          if (data.status === "Approved" || data.investigationStatus === "approved_for_export") {
            setReviewActionState("approved");
          } else if (data.status === "Rejected" || data.investigationStatus === "rejected") {
            setReviewActionState("rejected");
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : "Failed to load issue details.");
        setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    fetchSystemMode()
      .then((sm) => {
        if (isMounted) {
          setSystemMode(sm);
          if (sm.mode === "live" && sm.liveAvailable) {
            setSelectedMode("live");
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [issueId]);

  const handleRunInvestigation = async () => {
    if (!issue) return;
    setIsInvestigating(true);
    setErrorMsg(null);
    try {
      const updatedIssue = await triggerInvestigation(issue.id, selectedMode);
      if (updatedIssue) {
        setIssue(updatedIssue);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Investigation failed to execute";
      setErrorMsg(message);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleConfirmAction = async (note: string) => {
    setReviewNote(note);
    const nowIso = new Date().toISOString();
    setApprovalTimestamp(nowIso);

    if (!issue) return;
    const invId = issue.investigationId;
    const decision = modalType === "approve" ? "approved_for_export" : "rejected";

    if (invId) {
      try {
        await submitApprovalDecision(
          invId,
          decision,
          "Engineering Reviewer",
          note || "Decision recorded by reviewer."
        );
      } catch (err) {
        console.warn("Failed to persist approval decision via API:", err);
      }
    }

    if (modalType === "approve") {
      setReviewActionState("approved");
      setIssue((prev) =>
        prev ? { ...prev, status: "Approved", investigationStatus: "approved_for_export" } : null
      );
    } else if (modalType === "reject") {
      setReviewActionState("rejected");
      setIssue((prev) =>
        prev ? { ...prev, status: "Rejected", investigationStatus: "rejected" } : null
      );
    }
    setModalType(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#626875] mx-auto mb-3" />
        <p className="text-xs font-mono text-[#9aa1b0]">Loading issue workspace...</p>
      </div>
    );
  }

  if (notFound || !issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#13151a] border border-[#22252e] text-[#9aa1b0]">
          <AlertCircle className="h-6 w-6 text-amber-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-[#f0f2f5]">Issue not found</h1>
          <p className="text-xs text-[#9aa1b0]">
            The issue &ldquo;{issueId}&rdquo; does not exist in the active database workspace.
          </p>
        </div>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#22252e] bg-[#181b21] px-3.5 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#22252e] hover:text-[#f0f2f5] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Issues</span>
        </Link>
      </div>
    );
  }

  // Real investigation status evaluation
  const hasAgentRuns = issue.timeline && issue.timeline.length > 0;
  const isAwaitingApproval =
    issue.investigationStatus === "awaiting_approval" ||
    issue.status === "Review required";
  const isApproved =
    issue.status === "Approved" ||
    issue.investigationStatus === "approved_for_export" ||
    reviewActionState === "approved";
  const isRejected =
    issue.status === "Rejected" ||
    issue.investigationStatus === "rejected" ||
    reviewActionState === "rejected";

  // Check which real artifacts genuinely exist in API response
  const hasRequirements = Boolean(issue.rootCauseSummary && issue.rootCauseSummary.trim().length > 0);
  const hasEvidence = Boolean(issue.evidence && issue.evidence.length > 0);
  const hasPlan = Boolean(issue.proposedPlan && issue.proposedPlan.length > 0);
  const hasDiffs = Boolean(issue.diffs && issue.diffs.length > 0);
  const hasTests = Boolean(issue.testResults);
  const hasReview = Boolean(issue.review);
  const hasDocs = Boolean(issue.documentation);

  const hasAnyArtifacts =
    hasRequirements || hasEvidence || hasPlan || hasDiffs || hasTests || hasReview || hasDocs;

  // GitHub Source Link
  const githubSourceUrl =
    issue.githubUrl ||
    (issue.githubIssueNumber && issue.repository
      ? `https://github.com/${issue.repository}/issues/${issue.githubIssueNumber}`
      : null);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#c9d1d9]">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs font-mono text-[#9aa1b0]">
        <div className="flex items-center gap-2">
          <Link
            href="/issues"
            className="flex items-center gap-1 text-[#9aa1b0] hover:text-[#f0f2f5] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Issues</span>
          </Link>
          <span>/</span>
          <span className="text-[#9aa1b0]">{issue.repository}</span>
          <span>/</span>
          <span className="text-[#f0f2f5] font-semibold">{issue.id}</span>
        </div>

        {isInvestigating && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Investigation running...</span>
          </div>
        )}
      </div>

      {/* Safety Note */}
      <div className="flex items-center gap-2 rounded-md border border-[#22252e] bg-[#13151a] px-3.5 py-2 text-xs text-[#9aa1b0]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>BugBunny proposes changes. Your repository stays under your control.</span>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-md border border-rose-900/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              <strong>Error:</strong> {errorMsg}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRunInvestigation}
            className="shrink-0 flex items-center gap-1 rounded bg-rose-900/60 px-2.5 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-800 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ISSUE HEADER CARD: Title, Repo, Source, Body, Labels, Actions           */}
      {/* ====================================================================== */}
      <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#f0f2f5] bg-[#181b21] border border-[#22252e] px-2 py-0.5 rounded">
                {issue.id}
              </span>
              <SourceBadge mode={issue.mode} />
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="font-mono text-xs text-[#9aa1b0] bg-[#0d0e12] border border-[#22252e] px-2 py-0.5 rounded">
                {issue.repository}
              </span>
            </div>

            {/* Issue Title */}
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f0f2f5]">
              {issue.title}
            </h1>

            {/* Meta Row: Source Link, Author, Timestamp */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#9aa1b0]">
              {githubSourceUrl && (
                <a
                  href={githubSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#58a6ff] hover:underline"
                >
                  <span>GitHub Issue</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {issue.author && (
                <>
                  <span>&bull;</span>
                  <span>Author: {issue.author}</span>
                </>
              )}

              {issue.createdAt && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Imported: {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Controls: Mode & Start Investigation */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Model Provider Selector (Only shown if live available) */}
            {systemMode?.liveAvailable && (
              <div className="flex items-center rounded-md border border-[#22252e] bg-[#0d0e12] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedMode("demo")}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedMode === "demo"
                      ? "bg-[#181b21] text-[#f0f2f5] shadow-sm"
                      : "text-[#9aa1b0] hover:text-[#c9d1d9]"
                  }`}
                >
                  Demo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode("live")}
                  className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedMode === "live"
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-sm"
                      : "text-[#9aa1b0] hover:text-[#c9d1d9]"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>Live</span>
                </button>
              </div>
            )}

            {/* Start Investigation Button */}
            {!isApproved && !isRejected && (
              <button
                type="button"
                disabled={isInvestigating}
                onClick={handleRunInvestigation}
                className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors disabled:opacity-50 shadow-sm"
              >
                {isInvestigating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                <span>
                  {isInvestigating
                    ? "Investigating..."
                    : hasAgentRuns
                    ? "Re-run Investigation"
                    : "Start Investigation"}
                </span>
              </button>
            )}

            {isApproved && (
              <span className="flex items-center gap-1.5 rounded-md border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Approved for Export</span>
              </span>
            )}

            {isRejected && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md border border-rose-800/60 bg-rose-950/40 px-3 py-1 text-xs font-mono text-rose-300">
                  <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Rejected</span>
                </span>
                <button
                  type="button"
                  onClick={handleRunInvestigation}
                  disabled={isInvestigating}
                  className="rounded-md border border-[#22252e] bg-[#181b21] px-2.5 py-1 text-xs text-[#f0f2f5] hover:bg-[#22252e] transition-colors"
                >
                  Start a new investigation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Issue Body (Rendered if available) */}
        {issue.description && issue.description.trim().length > 0 && (
          <div className="border-t border-[#22252e] pt-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#9aa1b0] mb-1.5">
              Issue Description
            </h3>
            <div className="rounded-md bg-[#0d0e12] border border-[#22252e] p-3 text-xs leading-relaxed text-[#c9d1d9] whitespace-pre-wrap font-sans">
              {issue.description}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* INVESTIGATION RUNNING / PIPELINE PROGRESSION                            */}
      {/* ====================================================================== */}
      {(hasAgentRuns || isInvestigating) && (
        <section>
          <AgentTimeline timeline={issue.timeline} isInvestigating={isInvestigating} />
        </section>
      )}

      {/* ====================================================================== */}
      {/* HUMAN APPROVAL GATE: ONLY SHOWN WHEN AWAITING APPROVAL                 */}
      {/* ====================================================================== */}
      {isAwaitingApproval && !isApproved && !isRejected && (
        <div className="rounded-lg border border-amber-800/50 bg-[#13151a] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22252e] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f0f2f5]">
                Human Approval Required
              </h2>
            </div>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              awaiting_approval
            </span>
          </div>

          <p className="text-xs text-[#9aa1b0] leading-relaxed">
            Specialist agents have completed their analysis and synthesized a patch proposal. Review the artifacts checklist below before taking action:
          </p>

          {/* Artifacts Verification Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 p-2 rounded bg-[#0d0e12] border border-[#22252e]">
              {hasPlan ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#626875]" />
              )}
              <span className={hasPlan ? "text-[#f0f2f5]" : "text-[#626875]"}>
                Implementation plan available
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0d0e12] border border-[#22252e]">
              {hasDiffs ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#626875]" />
              )}
              <span className={hasDiffs ? "text-[#f0f2f5]" : "text-[#626875]"}>
                Patch proposal available
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0d0e12] border border-[#22252e]">
              {hasTests ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#626875]" />
              )}
              <span className={hasTests ? "text-[#f0f2f5]" : "text-[#626875]"}>
                Test status visible
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0d0e12] border border-[#22252e]">
              {hasReview ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#626875]" />
              )}
              <span className={hasReview ? "text-[#f0f2f5]" : "text-[#626875]"}>
                Code review available
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalType("reject")}
              className="flex items-center gap-1.5 rounded-md border border-rose-900/60 bg-rose-950/40 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject Proposal</span>
            </button>

            <button
              type="button"
              onClick={() => setModalType("approve")}
              className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve Proposal</span>
            </button>
          </div>
        </div>
      )}

      {/* Review Feedback / Decision Confirmation State */}
      {reviewActionState !== "idle" && (
        <div
          className={`flex items-start justify-between gap-3 rounded-md border p-3.5 text-xs font-mono ${
            reviewActionState === "approved"
              ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
              : "border-rose-800/60 bg-rose-950/30 text-rose-300"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {reviewActionState === "approved" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <strong>
                {reviewActionState === "approved"
                  ? "Status: Approved for export"
                  : "Status: Rejected"}
              </strong>
              {approvalTimestamp && (
                <div className="text-[11px] text-[#9aa1b0]">
                  Decision recorded at: {new Date(approvalTimestamp).toLocaleString()}
                </div>
              )}
              {reviewNote && (
                <div className="text-[11px] text-[#c9d1d9]">
                  Reviewer note: &ldquo;{reviewNote}&rdquo;
                </div>
              )}
            </div>
          </div>

          {reviewActionState === "rejected" && (
            <button
              type="button"
              onClick={handleRunInvestigation}
              disabled={isInvestigating}
              className="rounded border border-rose-800/60 bg-rose-900/40 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-900/60 transition-colors"
            >
              Start new investigation
            </button>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* COMPLETED INVESTIGATION ARTIFACTS: RENDER ONLY IF ARTIFACTS EXIST       */}
      {/* ====================================================================== */}
      {hasAnyArtifacts && (
        <div className="space-y-4">
          {/* 1. Requirements Section */}
          {hasRequirements && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("requirements")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Requirements & Root Cause</span>
                </div>
                {openSections.requirements ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.requirements && (
                <div className="p-4 text-xs leading-relaxed text-[#c9d1d9]">
                  {issue.rootCauseSummary}
                </div>
              )}
            </div>
          )}

          {/* 2. Evidence Section */}
          {hasEvidence && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("evidence")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Codebase Evidence ({issue.evidence.length})</span>
                </div>
                {openSections.evidence ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.evidence && (
                <div className="p-4">
                  <EvidenceViewer evidence={issue.evidence} />
                </div>
              )}
            </div>
          )}

          {/* 3. Implementation Plan Section */}
          {hasPlan && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("plan")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Implementation Plan ({issue.proposedPlan.length} steps)</span>
                </div>
                {openSections.plan ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.plan && (
                <div className="p-4">
                  <ImplementationPlan steps={issue.proposedPlan} />
                </div>
              )}
            </div>
          )}

          {/* 4. Patch Proposal Section */}
          {hasDiffs && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("patch")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Patch Proposal</span>
                </div>
                {openSections.patch ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.patch && (
                <div className="p-4">
                  <CodeDiffViewer diffs={issue.diffs} />
                </div>
              )}
            </div>
          )}

          {/* 5. Test Report Section */}
          {hasTests && issue.testResults && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("tests")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TestTube2 className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Test Report</span>
                </div>
                {openSections.tests ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.tests && (
                <div className="p-4">
                  <TestResultsViewer testResults={issue.testResults} />
                </div>
              )}
            </div>
          )}

          {/* 6. Code Review Section */}
          {hasReview && issue.review && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("review")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Code Review</span>
                </div>
                {openSections.review ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.review && (
                <div className="p-4">
                  <ReviewChecklist review={issue.review} />
                </div>
              )}
            </div>
          )}

          {/* 7. Documentation Update Section */}
          {hasDocs && issue.documentation && (
            <div className="rounded-lg border border-[#22252e] bg-[#13151a] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("docs")}
                className="w-full flex items-center justify-between border-b border-[#22252e] bg-[#13151a] px-4 py-2.5 text-xs font-semibold text-[#f0f2f5] hover:bg-[#181b21] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Documentation Update</span>
                </div>
                {openSections.docs ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa1b0]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa1b0]" />
                )}
              </button>
              {openSections.docs && (
                <div className="p-4">
                  <DocPreview doc={issue.documentation} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Approve / Reject */}
      <ActionConfirmModal
        isOpen={modalType !== null}
        type={modalType || "approve"}
        issueId={issue.id}
        repositoryName={issue.repository}
        onClose={() => setModalType(null)}
        onConfirm={handleConfirmAction}
      />
    </main>
  );
}
