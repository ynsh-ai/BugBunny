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
  Code2,
  CheckCircle2,
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
import { BugBunnyLogo } from "@/components/BugBunnyLogo";

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
              className="flex items-center gap-1 font-mono text-[11px] underline hover:text-[#171916]"
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
      {/* 1. PRODUCT LANDING & ONBOARDING (When Database has No Real Data)        */}
      {/* ====================================================================== */}
      {!isLoading && !hasRealData && (
        <div className="space-y-16 pb-20">
          {/* Top Hero Section */}
          <section className="relative border-b border-[#DADDD3] bg-[#F5F5F0] pt-16 pb-20 bg-tech-grid">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
              {/* Product Badge Pill */}
              <div className="inline-flex items-center gap-2 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3 py-1 text-xs font-mono text-[#171916]">
                <span className="flex h-2 w-2 rounded-full bg-[#35A56A]" />
                <span className="font-semibold">BUGBUNNY // AI ENGINEERING WORKSPACE</span>
                <span className="text-[#777D71]">|</span>
                <span className="text-[#777D71]">HUMAN-APPROVED AUTONOMY</span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#171916] leading-[1.08]">
                Investigate software issues with an{" "}
                <span className="underline decoration-[#C6F36B] decoration-4 underline-offset-4">
                  AI engineering team
                </span>
                .
              </h1>

              {/* Supporting Technical Copy */}
              <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#777D71] leading-relaxed">
                Import any public GitHub issue or repository. BugBunny gathers codebase context,
                isolates root causes, synthesizes verified git patches, and keeps every change under your control.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => openImport("issue")}
                  className="flex items-center gap-2.5 rounded-xs bg-[#C6F36B] px-5 py-3 text-xs font-bold text-[#171916] border border-[#AEE64E] shadow-xs hover:bg-[#B5E856] active:translate-y-px transition-all"
                >
                  <GitPullRequest className="h-4 w-4 text-[#171916]" />
                  <span>Import GitHub Issue</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </button>

                <button
                  onClick={() => openImport("repo")}
                  className="flex items-center gap-2 rounded-xs bg-[#E8EAE3] px-5 py-3 text-xs font-semibold text-[#171916] border border-[#DADDD3] hover:bg-[#DADDD3] active:translate-y-px transition-all"
                >
                  <FolderGit2 className="h-4 w-4 text-[#777D71]" />
                  <span>Import Repository</span>
                </button>
              </div>

              {/* Safety Tagline */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-[#777D71]">
                <ShieldCheck className="h-4 w-4 text-[#35A56A]" />
                <span>BugBunny proposes changes. Your repository stays under your control.</span>
              </div>
            </div>
          </section>

          {/* Product-Led Interface Preview (Realistic Codebase & Agent Canvas) */}
          <section className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-xs border border-[#3A4037] bg-[#292D27] text-[#F5F5F0] shadow-xl overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between border-b border-[#3A4037] bg-[#1F221E] px-4 py-2.5 font-mono text-[11px] text-[#9BA095]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D65B56]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D99A37]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#35A56A]" />
                  </div>
                  <span className="font-semibold text-[#F5F5F0] flex items-center gap-1.5">
                    <BugBunnyLogo size={14} />
                    <span>bugbunny // session #PP-104</span>
                  </span>
                  <span>•</span>
                  <span>target: psf/requests</span>
                  <span>•</span>
                  <span>branch: bugbunny/fix-timeout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#C6F36B] text-[#171916] font-semibold px-2 py-0.5 rounded-2xs text-[10px]">
                    STAGE 6 / COMPLETE
                  </span>
                </div>
              </div>

              {/* Split Preview Grid: Agent Execution Stages + Unified Diff */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#3A4037]">
                {/* Left: 6-Stage Autonomous Pipeline */}
                <div className="lg:col-span-5 p-5 space-y-3 font-mono text-xs">
                  <div className="text-[11px] uppercase tracking-wider text-[#9BA095] font-bold border-b border-[#3A4037] pb-2">
                    Autonomous Multi-Agent Pipeline
                  </div>
                  <div className="space-y-2">
                    {[
                      { step: "01", name: "Requirements Analyst", status: "COMPLETE", detail: "Parsed issue & HTTP timeout specs", color: "text-[#35A56A]" },
                      { step: "02", name: "Codebase Investigator", status: "COMPLETE", detail: "Located adapters.py line 412", color: "text-[#35A56A]" },
                      { step: "03", name: "Solution Planner", status: "COMPLETE", detail: "Designed safe float clamp utility", color: "text-[#35A56A]" },
                      { step: "04", name: "Patch Engineer", status: "COMPLETE", detail: "Unified git diff generated", color: "text-[#35A56A]" },
                      { step: "05", name: "Test Runner", status: "COMPLETE", detail: "14/14 regression assertions passed", color: "text-[#35A56A]" },
                      { step: "06", name: "Code Review & Docs", status: "AWAITING APPROVAL", detail: "OWASP verified • zero security alerts", color: "text-[#C6F36B]" },
                    ].map((st) => (
                      <div
                        key={st.step}
                        className="flex items-start justify-between rounded-xs border border-[#3A4037] bg-[#1F221E] p-2.5 hover:border-[#4D554A] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[#9BA095] text-[10px]">{st.step}</span>
                            <span className="font-semibold text-[#F5F5F0]">{st.name}</span>
                          </div>
                          <div className="text-[11px] text-[#9BA095] pl-5">{st.detail}</div>
                        </div>
                        <span className={`text-[10px] font-bold ${st.color} bg-black/40 px-1.5 py-0.5 rounded-2xs`}>
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Unified Code Diff Preview */}
                <div className="lg:col-span-7 p-5 space-y-3 font-mono text-xs bg-[#1A1D18]">
                  <div className="flex items-center justify-between text-[11px] text-[#9BA095] border-b border-[#3A4037] pb-2">
                    <span className="font-bold text-[#F5F5F0] flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-[#C6F36B]" />
                      <span>src/requests/adapters.py</span>
                    </span>
                    <span className="text-[10px] text-[#C6F36B]">+6 lines / -2 lines</span>
                  </div>
                  <div className="bg-[#141613] border border-[#2B3128] rounded-xs p-3 text-[11px] leading-relaxed overflow-x-auto">
                    <div className="text-[#777D71]">@@ -410,8 +410,12 @@ def send(self, request, stream=False, timeout=None):</div>
                    <div className="text-[#777D71]">&nbsp;&nbsp;&nbsp;&nbsp;url = request.url</div>
                    <div className="text-[#D65B56] bg-[#D65B56]/15 px-1">-&nbsp;&nbsp;&nbsp;if timeout is not None:</div>
                    <div className="text-[#D65B56] bg-[#D65B56]/15 px-1">-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;conn.timeout = timeout</div>
                    <div className="text-[#35A56A] bg-[#35A56A]/15 px-1">+&nbsp;&nbsp;&nbsp;validated_timeout = self._validate_timeout(timeout)</div>
                    <div className="text-[#35A56A] bg-[#35A56A]/15 px-1">+&nbsp;&nbsp;&nbsp;if validated_timeout is not None:</div>
                    <div className="text-[#35A56A] bg-[#35A56A]/15 px-1">+&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;conn.timeout = max(0.001, float(validated_timeout))</div>
                    <div className="text-[#777D71]">&nbsp;&nbsp;&nbsp;&nbsp;try:</div>
                    <div className="text-[#777D71]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;resp = conn.urlopen(...)</div>
                  </div>

                  {/* Human Approval Decision Bar */}
                  <div className="mt-4 rounded-xs border border-[#AEE64E] bg-[#C6F36B]/15 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#F5F5F0] flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-[#C6F36B]" />
                        <span>Ready for Human Approval</span>
                      </div>
                      <p className="text-[11px] text-[#9BA095]">
                        All 6 agents finished. BugBunny awaits developer authorization.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openImport("issue")}
                        className="rounded-xs bg-[#C6F36B] text-[#171916] font-bold px-3 py-1.5 text-xs hover:bg-[#B5E856] transition-colors"
                      >
                        Approve Proposal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow Steps: Ingest → Investigate → Review */}
          <section className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="border-t border-[#DADDD3] pt-12 space-y-8">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-[#777D71] font-semibold">
                  HOW BUGBUNNY OPERATES
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171916]">
                  A disciplined, transparent engineering pipeline
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-6 space-y-3">
                  <div className="font-mono text-xs font-bold text-[#171916] bg-[#DADDD3] w-7 h-7 flex items-center justify-center rounded-2xs">
                    01
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171916]">
                    Ingest Context
                  </h3>
                  <p className="text-xs leading-relaxed text-[#777D71]">
                    Import public GitHub issues and code repositories. BugBunny crawls file trees and symbol hierarchies strictly with read-only containment.
                  </p>
                </div>

                <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-6 space-y-3">
                  <div className="font-mono text-xs font-bold text-[#171916] bg-[#DADDD3] w-7 h-7 flex items-center justify-center rounded-2xs">
                    02
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171916]">
                    Investigate & Patch
                  </h3>
                  <p className="text-xs leading-relaxed text-[#777D71]">
                    Specialized AI agents isolate root causes, craft minimal surgical unified diffs, and execute regression test simulations.
                  </p>
                </div>

                <div className="rounded-xs border border-[#DADDD3] bg-[#DADDD3] p-6 space-y-3">
                  <div className="font-mono text-xs font-bold text-[#171916] bg-[#C6F36B] w-7 h-7 flex items-center justify-center rounded-2xs">
                    03
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171916]">
                    Human Approval
                  </h3>
                  <p className="text-xs leading-relaxed text-[#171916]">
                    Inspect diffs, evidence, and test reports. BugBunny records your decision and only pushes changes when explicitly confirmed.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2. REAL-DATA WORKSPACE DASHBOARD (Renders When API Records Exist)       */}
      {/* ====================================================================== */}
      {!isLoading && hasRealData && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
                className="flex items-center gap-2 rounded-xs bg-[#C6F36B] px-3.5 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] shadow-2xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Import Issue</span>
              </button>

              <button
                onClick={() => openImport("repo")}
                className="flex items-center gap-2 rounded-xs bg-[#E8EAE3] px-3.5 py-2 text-xs font-semibold text-[#171916] border border-[#DADDD3] hover:bg-[#DADDD3] transition-colors"
              >
                <FolderGit2 className="h-3.5 w-3.5 text-[#777D71]" />
                <span>Import Repo</span>
              </button>

              <button
                onClick={loadData}
                title="Refresh Workspace"
                className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-2 text-[#777D71] hover:text-[#171916] hover:bg-[#DADDD3] transition-colors"
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
                href="/issues"
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
                          href={`/issues/${issue.id}`}
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
                  href="/investigations"
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
                        href={`/issues/${encodeURIComponent(inv.issue_key || inv.issue_id)}`}
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
