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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-28 text-center">
        <div className="h-6 w-6 mb-3 mx-auto animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
        <p className="text-xs font-mono text-[#777D71]">Loading issue workspace...</p>
      </div>
    );
  }

  if (notFound || !issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xs bg-[#E8EAE3] border border-[#DADDD3] text-[#777D71]">
          <AlertCircle className="h-6 w-6 text-[#D99A37]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-bold text-[#171916]">Issue not found</h1>
          <p className="text-xs text-[#777D71]">
            The issue &ldquo;{issueId}&rdquo; does not exist in the active database workspace.
          </p>
        </div>
        <Link
          href="/dashboard/issues"
          className="inline-flex items-center gap-1.5 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-1.5 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors"
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#171916]">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs font-mono text-[#777D71]">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/issues"
            className="flex items-center gap-1 text-[#777D71] hover:text-[#171916] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Issues</span>
          </Link>
          <span>/</span>
          <span className="text-[#777D71]">{issue.repository}</span>
          <span>/</span>
          <span className="text-[#171916] font-bold">{issue.id}</span>
        </div>

        {isInvestigating && (
          <div className="flex items-center gap-1.5 text-[#D99A37] text-xs font-semibold">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Investigation running...</span>
          </div>
        )}
      </div>

      {/* Safety Note */}
      <div className="flex items-center gap-2 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-2 text-xs font-mono text-[#777D71]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#35A56A]" />
        <span>BugBunny proposes changes. Your repository stays under your control.</span>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-3.5 text-xs text-[#B33833] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#D65B56]" />
            <span>
              <strong>Error:</strong> {errorMsg}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRunInvestigation}
            className="shrink-0 flex items-center gap-1 rounded-xs bg-[#D65B56] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#B33833] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ISSUE HEADER CARD: Title, Repo, Source, Body, Labels, Actions           */}
      {/* ====================================================================== */}
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#171916] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
                {issue.id}
              </span>
              <SourceBadge mode={issue.mode} />
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="font-mono text-xs text-[#777D71] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
                {issue.repository}
              </span>
            </div>

            {/* Issue Title */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171916]">
              {issue.title}
            </h1>

            {/* Meta Row: Source Link, Author, Timestamp */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#777D71]">
              {githubSourceUrl && (
                <a
                  href={githubSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#171916] hover:underline font-semibold"
                >
                  <span>GitHub Issue</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {issue.author && (
                <>
                  <span>•</span>
                  <span>Author: @{issue.author}</span>
                </>
              )}

              {issue.createdAt && (
                <>
                  <span>•</span>
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
            {/* Model Provider Selector */}
            {systemMode?.liveAvailable && (
              <div className="flex items-center rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedMode("demo")}
                  className={`rounded-2xs px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    selectedMode === "demo"
                      ? "bg-[#FFFFFF] text-[#171916] shadow-2xs border border-[#DADDD3]"
                      : "text-[#777D71] hover:text-[#171916]"
                  }`}
                >
                  Demo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode("live")}
                  className={`flex items-center gap-1 rounded-2xs px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    selectedMode === "live"
                      ? "bg-[#C6F36B] text-[#171916] border border-[#AEE64E] shadow-2xs"
                      : "text-[#777D71] hover:text-[#171916]"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-[#171916]" />
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
                className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-4 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] transition-colors disabled:opacity-50 shadow-2xs"
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
              <span className="flex items-center gap-1.5 rounded-xs border border-[#35A56A]/40 bg-[#35A56A]/12 px-3 py-1 text-xs font-mono text-[#227247] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#35A56A]" />
                <span>Approved for Export</span>
              </span>
            )}

            {isRejected && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/12 px-3 py-1 text-xs font-mono text-[#B33833] font-semibold">
                  <XCircle className="h-3.5 w-3.5 text-[#D65B56]" />
                  <span>Rejected</span>
                </span>
                <button
                  type="button"
                  onClick={handleRunInvestigation}
                  disabled={isInvestigating}
                  className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1 text-xs font-semibold text-[#171916] hover:bg-[#DADDD3] transition-colors"
                >
                  Start a new investigation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Issue Body */}
        {issue.description && issue.description.trim().length > 0 && (
          <div className="border-t border-[#DADDD3] pt-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#777D71] mb-1.5 font-bold">
              Issue Description
            </h3>
            <div className="rounded-xs bg-[#F5F5F0] border border-[#DADDD3] p-3.5 text-xs leading-relaxed text-[#171916] whitespace-pre-wrap font-sans">
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
        <div className="rounded-xs border border-[#AEE64E] bg-[#C6F36B]/20 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#AEE64E] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#171916]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
                Human Approval Required
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#171916] bg-[#C6F36B] px-2.5 py-0.5 rounded-2xs border border-[#AEE64E]">
              awaiting_approval
            </span>
          </div>

          <p className="text-xs text-[#171916] leading-relaxed">
            Specialist agents have completed their analysis and synthesized a patch proposal. Review the artifacts checklist below before taking action:
          </p>

          {/* Artifacts Verification Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 p-2.5 rounded-xs bg-[#FFFFFF] border border-[#DADDD3]">
              {hasPlan ? (
                <Check className="h-3.5 w-3.5 text-[#35A56A]" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#777D71]" />
              )}
              <span className={hasPlan ? "text-[#171916] font-semibold" : "text-[#777D71]"}>
                Implementation plan available
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xs bg-[#FFFFFF] border border-[#DADDD3]">
              {hasDiffs ? (
                <Check className="h-3.5 w-3.5 text-[#35A56A]" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#777D71]" />
              )}
              <span className={hasDiffs ? "text-[#171916] font-semibold" : "text-[#777D71]"}>
                Patch proposal available
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xs bg-[#FFFFFF] border border-[#DADDD3]">
              {hasTests ? (
                <Check className="h-3.5 w-3.5 text-[#35A56A]" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#777D71]" />
              )}
              <span className={hasTests ? "text-[#171916] font-semibold" : "text-[#777D71]"}>
                Test status visible
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xs bg-[#FFFFFF] border border-[#DADDD3]">
              {hasReview ? (
                <Check className="h-3.5 w-3.5 text-[#35A56A]" />
              ) : (
                <X className="h-3.5 w-3.5 text-[#777D71]" />
              )}
              <span className={hasReview ? "text-[#171916] font-semibold" : "text-[#777D71]"}>
                Code review available
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 font-mono">
            <button
              type="button"
              onClick={() => setModalType("reject")}
              className="flex items-center gap-1.5 rounded-xs border border-[#D65B56]/40 bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-semibold text-[#B33833] hover:bg-[#D65B56]/10 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject Proposal</span>
            </button>

            <button
              type="button"
              onClick={() => setModalType("approve")}
              className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-4 py-1.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] shadow-2xs transition-colors"
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
          className={`flex items-start justify-between gap-3 rounded-xs border p-4 text-xs font-mono ${
            reviewActionState === "approved"
              ? "border-[#35A56A]/40 bg-[#35A56A]/12 text-[#227247]"
              : "border-[#D65B56]/40 bg-[#D65B56]/12 text-[#B33833]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {reviewActionState === "approved" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#35A56A] mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-[#D65B56] mt-0.5" />
            )}
            <div className="space-y-1">
              <strong>
                {reviewActionState === "approved"
                  ? "Status: Approved for export"
                  : "Status: Rejected"}
              </strong>
              {approvalTimestamp && (
                <div className="text-[11px] text-[#777D71]">
                  Decision recorded at: {new Date(approvalTimestamp).toLocaleString()}
                </div>
              )}
              {reviewNote && (
                <div className="text-[11px] text-[#171916]">
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
              className="rounded-xs border border-[#D65B56] bg-[#D65B56] px-2.5 py-1 text-[11px] text-white hover:bg-[#B33833] transition-colors"
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
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("requirements")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-[#171916]" />
                  <span>01 / Requirements &amp; Root Cause</span>
                </div>
                {openSections.requirements ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
                )}
              </button>
              {openSections.requirements && (
                <div className="p-4 text-xs leading-relaxed text-[#171916]">
                  {issue.rootCauseSummary}
                </div>
              )}
            </div>
          )}

          {/* 2. Evidence Section */}
          {hasEvidence && (
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("evidence")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-3.5 w-3.5 text-[#171916]" />
                  <span>02 / Codebase Evidence ({issue.evidence.length})</span>
                </div>
                {openSections.evidence ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
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
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("plan")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-[#171916]" />
                  <span>03 / Implementation Plan ({issue.proposedPlan.length} steps)</span>
                </div>
                {openSections.plan ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
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
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("patch")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-3.5 w-3.5 text-[#171916]" />
                  <span>04 / Patch Proposal (Unified Diff)</span>
                </div>
                {openSections.patch ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
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
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("tests")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <TestTube2 className="h-3.5 w-3.5 text-[#171916]" />
                  <span>05 / Test Report &amp; Regression Assertions</span>
                </div>
                {openSections.tests ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
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
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("review")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#171916]" />
                  <span>06 / Code Review &amp; Security Audit</span>
                </div>
                {openSections.review ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
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
            <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection("docs")}
                className="w-full flex items-center justify-between border-b border-[#DADDD3] bg-[#E8EAE3] px-4 py-2.5 text-xs font-bold text-[#171916] hover:bg-[#DADDD3] transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#171916]" />
                  <span>07 / Documentation &amp; Changelog Draft</span>
                </div>
                {openSections.docs ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#777D71]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
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
