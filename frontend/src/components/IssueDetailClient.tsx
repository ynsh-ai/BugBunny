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
  GitBranch,
  GitCommit,
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
  FileCheck,
  Sparkles,
} from "lucide-react";

type TabKey = "plan" | "diff" | "tests" | "review" | "docs" | "evidence" | "artifacts";

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
  const [activeTab, setActiveTab] = useState<TabKey>("plan");
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [reviewActionState, setReviewActionState] = useState<
    "idle" | "approved" | "rejected"
  >("idle");
  const [reviewNote, setReviewNote] = useState<string>("");

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
          // Set sensible active tab based on what data is present
          if (data.proposedPlan && data.proposedPlan.length > 0) {
            setActiveTab("plan");
          } else if (data.diffs && data.diffs.length > 0) {
            setActiveTab("diff");
          } else if (data.evidence && data.evidence.length > 0) {
            setActiveTab("evidence");
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
        if (updatedIssue.proposedPlan && updatedIssue.proposedPlan.length > 0) {
          setActiveTab("plan");
        } else if (updatedIssue.diffs && updatedIssue.diffs.length > 0) {
          setActiveTab("diff");
        }
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
    if (!issue) return;
    const invId = issue.investigationId;
    const decision = modalType === "approve" ? "approved_for_export" : "rejected";

    if (invId) {
      try {
        await submitApprovalDecision(
          invId,
          decision,
          "Engineering Reviewer",
          note || "Human approval decision recorded."
        );
      } catch (err) {
        console.warn("Failed to persist approval decision via API:", err);
      }
    }

    if (modalType === "approve") {
      setReviewActionState("approved");
      setIssue((prev) => (prev ? { ...prev, status: "Approved" } : null));
    } else if (modalType === "reject") {
      setReviewActionState("rejected");
      setIssue((prev) => (prev ? { ...prev, status: "Rejected" } : null));
    }
    setModalType(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#8b949e] mx-auto mb-3" />
        <p className="text-xs font-mono text-[#8b949e]">Loading issue workspace...</p>
      </div>
    );
  }

  if (notFound || !issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e]">
          <AlertCircle className="h-6 w-6 text-amber-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-[#f0f6fc]">Issue not found</h1>
          <p className="text-xs text-[#8b949e]">
            The issue &ldquo;{issueId}&rdquo; does not exist in the active database workspace.
          </p>
        </div>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-3.5 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Issues</span>
        </Link>
      </div>
    );
  }

  // Real investigation status evaluation
  const hasAgentRuns = issue.timeline && issue.timeline.length > 0;
  const canApprove =
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

  // Check which tabs have real data returned by API
  const hasEvidence = issue.evidence && issue.evidence.length > 0;
  const hasPlan = issue.proposedPlan && issue.proposedPlan.length > 0;
  const hasDiffs = issue.diffs && issue.diffs.length > 0;
  const hasTests = Boolean(issue.testResults);
  const hasReview = Boolean(issue.review);
  const hasDocs = Boolean(issue.documentation);
  const hasArtifacts = Boolean(issue.artifacts && issue.artifacts.length > 0);

  const availableTabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [];
  if (hasPlan) availableTabs.push({ id: "plan", label: "Plan", icon: Layers });
  if (hasDiffs) availableTabs.push({ id: "diff", label: "Patch Diff", icon: FileCode2 });
  if (hasEvidence) availableTabs.push({ id: "evidence", label: "Evidence", icon: FileCode2 });
  if (hasTests) availableTabs.push({ id: "tests", label: "Tests", icon: TestTube2 });
  if (hasReview) availableTabs.push({ id: "review", label: "Review", icon: ShieldCheck });
  if (hasDocs) availableTabs.push({ id: "docs", label: "Documentation", icon: FileText });
  if (hasArtifacts) availableTabs.push({ id: "artifacts", label: "Artifacts Ledger", icon: FileCheck });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
        <div className="flex items-center gap-2">
          <Link
            href="/issues"
            className="flex items-center gap-1 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Issues</span>
          </Link>
          <span>/</span>
          <span className="text-[#8b949e]">{issue.repository}</span>
          <span>/</span>
          <span className="text-[#f0f6fc] font-semibold">{issue.id}</span>
        </div>

        {isInvestigating && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Agent investigation in progress...</span>
          </div>
        )}
      </div>

      {/* Security Assurance Banner */}
      <div className="flex items-center gap-2 rounded-md border border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs text-[#8b949e]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          Read-only workspace: BugBunny prepares patches and tests for your inspection. No code is modified without your approval.
        </span>
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

      {/* Issue Detail Card Header */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#f0f6fc] bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded">
                {issue.id}
              </span>
              <SourceBadge mode={issue.mode} />
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="font-mono text-xs text-[#8b949e] bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded">
                {issue.repository}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f0f6fc]">
              {issue.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8b949e]">
              {issue.branch && (
                <span className="flex items-center gap-1 text-[#8b949e]">
                  <GitBranch className="h-3.5 w-3.5 text-[#6e7681]" />
                  <span>{issue.branch}</span>
                </span>
              )}
              {issue.targetCommit && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-[#8b949e]">
                    <GitCommit className="h-3.5 w-3.5 text-[#6e7681]" />
                    <span>{issue.targetCommit}</span>
                  </span>
                </>
              )}
              {issue.author && (
                <>
                  <span>&bull;</span>
                  <span>Author: {issue.author}</span>
                </>
              )}
            </div>
          </div>

          {/* Controls: Mode Selector, Start/Re-run Investigation, Approval Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Mode Selector Toggle */}
            <div className="flex items-center rounded-md border border-[#30363d] bg-[#0d1117] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMode("demo")}
                className={`rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                  selectedMode === "demo"
                    ? "bg-[#21262d] text-[#f0f6fc] shadow-sm"
                    : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                Demo
              </button>
              <button
                type="button"
                disabled={!systemMode?.liveAvailable}
                onClick={() => {
                  if (systemMode?.liveAvailable) {
                    setSelectedMode("live");
                  }
                }}
                className={`flex items-center gap-1 rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                  selectedMode === "live"
                    ? "bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-sm"
                    : systemMode?.liveAvailable
                    ? "text-[#8b949e] hover:text-[#c9d1d9]"
                    : "text-[#6e7681] cursor-not-allowed opacity-50"
                }`}
                title={
                  systemMode?.liveAvailable
                    ? `Live model reasoning using ${systemMode.model}`
                    : "Live Gemini Mode unavailable: configure GEMINI_API_KEY in backend environment."
                }
              >
                <Sparkles className="h-3 w-3" />
                <span>Live Gemini</span>
              </button>
            </div>

            {/* Start Investigation / Re-run Action */}
            <button
              type="button"
              disabled={isInvestigating}
              onClick={handleRunInvestigation}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                !hasAgentRuns
                  ? "border border-[#2ea043] bg-[#238636] text-white hover:bg-[#2ea043]"
                  : "border border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc]"
              }`}
            >
              {isInvestigating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>
                {isInvestigating
                  ? "Investigating..."
                  : !hasAgentRuns
                  ? "Start Investigation"
                  : "Re-run Investigation"}
              </span>
            </button>

            {/* Approval Controls: ONLY render when genuinely awaiting approval */}
            {canApprove && !isApproved && !isRejected && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalType("reject")}
                  className="flex items-center gap-1.5 rounded-md border border-rose-900/60 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalType("approve")}
                  className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve Solution</span>
                </button>
              </div>
            )}

            {isApproved && (
              <span className="flex items-center gap-1.5 rounded-md border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Approved for Export</span>
              </span>
            )}

            {isRejected && (
              <span className="flex items-center gap-1.5 rounded-md border border-rose-800/60 bg-rose-950/40 px-3 py-1 text-xs font-mono text-rose-300">
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Rejected</span>
              </span>
            )}
          </div>
        </div>

        {/* Feedback after user approves or rejects */}
        {reviewActionState !== "idle" && (
          <div
            className={`flex items-start justify-between gap-3 rounded-md border p-3 text-xs font-mono ${
              reviewActionState === "approved"
                ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
                : "border-rose-800/60 bg-rose-950/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {reviewActionState === "approved" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <div>
                <strong>
                  {reviewActionState === "approved"
                    ? "Status: Approved for Export (approved_for_export)"
                    : "Status: Rejected"}
                </strong>
                {reviewNote && (
                  <span className="block text-[11px] text-[#8b949e] mt-0.5">
                    Note: &ldquo;{reviewNote}&rdquo;
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReviewActionState("idle")}
              className="text-[10px] text-[#8b949e] underline hover:text-[#f0f6fc]"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Multi-Agent Pipeline Progression: RENDER ONLY IF ACTUAL AGENT RUNS EXIST */}
      {hasAgentRuns && (
        <section>
          <AgentTimeline timeline={issue.timeline} />
        </section>
      )}

      {/* Root-Cause Summary: RENDER ONLY IF RETURNED BY API */}
      {issue.rootCauseSummary && issue.rootCauseSummary.trim().length > 0 && (
        <section className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
          <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-2.5">
            <h2 className="text-xs font-semibold text-[#f0f6fc] uppercase tracking-wider">
              Root-Cause Summary
            </h2>
          </div>
          <div className="p-4 text-xs text-[#c9d1d9] leading-relaxed font-sans">
            {issue.rootCauseSummary}
          </div>
        </section>
      )}

      {/* Tabs Section: Displays ONLY tabs that exist in API data */}
      {availableTabs.length > 0 ? (
        <section className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
          {/* Tab Headers */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[#30363d] bg-[#161b22] px-3 pt-2">
            {availableTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-[#58a6ff] text-[#f0f6fc]"
                      : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="p-4">
            {activeTab === "plan" && issue.proposedPlan && (
              <ImplementationPlan steps={issue.proposedPlan} />
            )}

            {activeTab === "diff" && issue.diffs && (
              <CodeDiffViewer diffs={issue.diffs} />
            )}

            {activeTab === "evidence" && issue.evidence && (
              <EvidenceViewer evidence={issue.evidence} />
            )}

            {activeTab === "tests" && issue.testResults && (
              <TestResultsViewer testResults={issue.testResults} />
            )}

            {activeTab === "review" && issue.review && (
              <ReviewChecklist review={issue.review} />
            )}

            {activeTab === "docs" && issue.documentation && (
              <DocPreview doc={issue.documentation} />
            )}

            {activeTab === "artifacts" && issue.artifacts && (
              <div className="space-y-3 font-mono text-xs">
                {issue.artifacts.map((art) => (
                  <div
                    key={art.id}
                    className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[#f0f6fc]">
                      <span className="font-semibold">{art.name}</span>
                      <span className="text-[10px] text-[#58a6ff] bg-[#21262d] px-1.5 py-0.5 rounded">
                        {art.artifact_type}
                      </span>
                    </div>
                    {art.created_at && (
                      <div className="text-[10px] text-[#8b949e]">
                        Created: {new Date(art.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Empty State before investigation has produced results */
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-10 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#21262d] text-[#8b949e]">
            <Play className="h-5 w-5 text-[#8b949e]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              Investigation not yet executed
            </h2>
            <p className="text-xs text-[#8b949e] max-w-md mx-auto">
              Click &ldquo;Start Investigation&rdquo; above to run the multi-agent engineering workflow. The evidence, plan, code diff, and test results will appear here once generated.
            </p>
          </div>
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
