"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MOCK_ISSUES_LIST,
  ISSUE_PP_101,
} from "@/mock/issues-data";
import { IssueDetail } from "@/mock/types";
import { fetchIssueDetail } from "@/lib/api";
import { AgentTimeline } from "@/components/AgentTimeline";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { ImplementationPlan } from "@/components/ImplementationPlan";
import { CodeDiffViewer } from "@/components/CodeDiffViewer";
import { TestResultsViewer } from "@/components/TestResultsViewer";
import { ReviewChecklist } from "@/components/ReviewChecklist";
import { DocPreview } from "@/components/DocPreview";
import { ActionConfirmModal } from "@/components/ActionConfirmModal";
import { StatusBadge, PriorityBadge } from "@/components/Badge";
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
} from "lucide-react";

type TabKey = "plan" | "diff" | "tests" | "review" | "docs";

interface IssueDetailClientProps {
  issueId: string;
}

export function IssueDetailClient({ issueId }: IssueDetailClientProps) {
  // Locate issue by ID, defaulting to PP-101
  const defaultIssue: IssueDetail =
    MOCK_ISSUES_LIST.find((i) => i.id.toUpperCase() === issueId.toUpperCase()) ||
    ISSUE_PP_101;

  const [issue, setIssue] = useState<IssueDetail>(defaultIssue);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>("plan");
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [reviewActionState, setReviewActionState] = useState<
    "idle" | "approved" | "rejected"
  >("idle");
  const [reviewNote, setReviewNote] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const loadApiData = async () => {
      setIsLoading(true);
      try {
        const liveData = await fetchIssueDetail(issueId);
        if (isMounted && liveData) {
          setIssue(liveData);
        }
      } catch (err) {
        // Retain default/mock data on error
        console.warn("FastAPI detail fetch failed, using fallback:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadApiData();
    return () => {
      isMounted = false;
    };
  }, [issueId]);

  const handleConfirmAction = (note: string) => {
    setReviewNote(note);
    if (modalType === "approve") {
      setReviewActionState("approved");
    } else if (modalType === "reject") {
      setReviewActionState("rejected");
    }
    setModalType(null);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs font-mono text-[#626875]">
        <div className="flex items-center gap-2">
          <Link
            href="/issues"
            className="flex items-center gap-1 text-[#9aa1b0] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Issues</span>
          </Link>
          <span>/</span>
          <span className="text-[#9aa1b0]">{issue.repository}</span>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">{issue.id}</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Syncing from API...</span>
          </div>
        )}
      </div>

      {/* Issue Title & Header Actions Bar */}
      <div className="rounded border border-[#22252e] bg-[#13151a] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded">
                {issue.id}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="font-mono text-xs text-[#9aa1b0] bg-[#1a1c22] border border-[#262933] px-2 py-0.5 rounded">
                repo: {issue.repository}
              </span>
              <span className="rounded bg-amber-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 border border-amber-800/60 flex items-center gap-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Demo Mode
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f2f5]">
              {issue.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#626875]">
              <span className="flex items-center gap-1 text-[#9aa1b0]">
                <GitBranch className="h-3.5 w-3.5 text-[#626875]" />
                <span>{issue.branch}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-[#9aa1b0]">
                <GitCommit className="h-3.5 w-3.5 text-[#626875]" />
                <span>{issue.targetCommit}</span>
              </span>
              <span>&bull;</span>
              <span>
                Reported by <span className="text-[#9aa1b0]">{issue.author}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons: Approve & Reject */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setModalType("reject")}
              className="flex items-center gap-1.5 rounded border border-[#3a2025] bg-[#1d1417] px-3.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-[#28171b] hover:border-rose-900 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              onClick={() => setModalType("approve")}
              className="flex items-center gap-1.5 rounded border border-emerald-700/80 bg-emerald-900/60 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-800/80 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve Solution</span>
            </button>
          </div>
        </div>

        {/* Action feedback banner if user clicked Approve or Reject */}
        {reviewActionState !== "idle" && (
          <div
            className={`mt-4 flex items-start justify-between gap-3 rounded border p-3 text-xs font-mono ${
              reviewActionState === "approved"
                ? "border-emerald-800/80 bg-emerald-950/40 text-emerald-300"
                : "border-rose-800/80 bg-rose-950/40 text-rose-300"
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
                    ? "Investigation Approved:"
                    : "Investigation Rejected:"}
                </strong>{" "}
                {reviewActionState === "approved"
                  ? "Implementation verified. PR payload staged for branch merge."
                  : "Marked for human review re-triage."}
                {reviewNote && (
                  <span className="block text-[11px] text-[#cbd0dc] mt-0.5">
                    Note: &ldquo;{reviewNote}&rdquo;
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReviewActionState("idle")}
              className="text-[10px] text-[#9aa1b0] underline hover:text-white"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Multi-Agent Progression Timeline */}
      <section>
        <AgentTimeline timeline={issue.timeline} />
      </section>

      {/* Root-Cause Summary */}
      <section className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#22252e] bg-[#16181f] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider">
              Root-Cause Summary
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            Diagnosis Confidence: 100%
          </span>
        </div>
        <div className="p-4 text-xs text-[#cbd0dc] leading-relaxed font-sans">
          {issue.rootCauseSummary}
        </div>
      </section>

      {/* Evidence List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-[#9aa1b0]" />
            <h2 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider">
              Diagnostic Evidence ({issue.evidence.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#626875]">
            Telemetry, Sentry traces & test logs
          </span>
        </div>

        <EvidenceViewer evidence={issue.evidence} />
      </section>

      {/* Multi-Tab Workspace: Plan | Code Diff | Test Results | Review | Documentation */}
      <section className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[#22252e] bg-[#16181f] px-3 pt-2">
          {[
            {
              id: "plan",
              label: "Implementation Plan",
              count: issue.proposedPlan.length,
              icon: Layers,
            },
            {
              id: "diff",
              label: "Code Diff",
              count: `${issue.diffs[0]?.additions || 19}+`,
              icon: FileCode2,
            },
            {
              id: "tests",
              label: "Test Results",
              count: `${issue.testResults.passed}/${issue.testResults.totalTests}`,
              icon: TestTube2,
            },
            {
              id: "review",
              label: "Review Audit",
              count: `${issue.review.overallScore}/100`,
              icon: ShieldCheck,
            },
            {
              id: "docs",
              label: "Documentation",
              count: "PR Ready",
              icon: FileText,
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-emerald-400 text-white bg-[#13151a]"
                    : "border-transparent text-[#9aa1b0] hover:text-[#f0f2f5] hover:bg-[#1a1c24]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                <span className="rounded bg-[#20232b] px-1.5 py-0.2 font-mono text-[10px] text-[#9aa1b0]">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5">
          {activeTab === "plan" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2229] pb-3 text-xs text-[#9aa1b0]">
                <span>
                  Synthesized by <strong>SolutionPlannerAgent</strong> &bull;
                  Sequenced for zero regressions
                </span>
                <span className="font-mono text-emerald-400">
                  Risk Level: Low
                </span>
              </div>
              <ImplementationPlan steps={issue.proposedPlan} />
            </div>
          )}

          {activeTab === "diff" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2229] pb-3 text-xs text-[#9aa1b0]">
                <span>
                  Unified Diff Author: <strong>PatchEngineerAgent</strong>{" "}
                  &bull; 2 files modified
                </span>
                <span className="font-mono text-emerald-400">
                  Zero Schema Migrations Required
                </span>
              </div>
              <CodeDiffViewer diffs={issue.diffs} />
            </div>
          )}

          {activeTab === "tests" && (
            <TestResultsViewer testResults={issue.testResults} />
          )}

          {activeTab === "review" && (
            <ReviewChecklist review={issue.review} />
          )}

          {activeTab === "docs" && (
            <DocPreview doc={issue.documentation} />
          )}
        </div>
      </section>

      {/* Interactive Modal for Approve / Reject */}
      <ActionConfirmModal
        isOpen={modalType !== null}
        type={modalType || "approve"}
        issueId={issue.id}
        onClose={() => setModalType(null)}
        onConfirm={handleConfirmAction}
      />
    </main>
  );
}
