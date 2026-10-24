"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SYSTEM_METRICS as metrics } from "@/mock/issues-data";
import { IssueDetail } from "@/mock/types";
import { fetchIssues, seedDemoData } from "@/lib/api";
import { MetricCard } from "@/components/MetricCard";
import { IssueRow } from "@/components/IssueRow";
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Filter,
  RefreshCw,
  AlertTriangle,
  Database,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [issuesList, setIssuesList] = useState<IssueDetail[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIssues();
      setIssuesList(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to FastAPI backend";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchIssues()
      .then((data) => {
        if (isMounted) {
          setIssuesList(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to connect to FastAPI backend";
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      await seedDemoData();
      await loadIssues();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to seed demo data";
      setError(message);
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredIssues =
    selectedRepo === "all"
      ? issuesList
      : issuesList.filter((i) => i.repository === selectedRepo);

  const repos = Array.from(new Set(issuesList.map((i) => i.repository)));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22252e] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[#f0f2f5]">
              Engineering Control Plane
            </h1>
            <span className="rounded bg-[#1a1c24] px-2 py-0.5 font-mono text-[11px] text-[#9aa1b0] border border-[#2b2f3a]">
              workspace: default
            </span>
            {/* Visible Demo Mode Label */}
            <span className="rounded bg-amber-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 border border-amber-800/60 flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Mode
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9aa1b0]">
            Autonomous multi-agent orchestration for issue triage, root-cause
            investigation, and verified patch generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadIssues}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded border border-[#2b2f3a] bg-[#161820] px-2.5 py-1.5 text-xs font-mono text-[#9aa1b0] hover:text-[#f0f2f5] hover:border-[#383d4a] transition-colors disabled:opacity-50"
            title="Refresh issues from API"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <Link
            href="/issues/PP-101"
            className="flex items-center gap-2 rounded border border-emerald-800/80 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Open Investigation PP-101</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Active Pipelines"
          value={metrics.activeInvestigations}
          subtext="2 analyzing, 1 testing"
          icon={<Activity className="h-4 w-4" />}
          badge="3 Running"
          badgeVariant="warning"
        />
        <MetricCard
          label="Resolved Today"
          value={metrics.resolvedToday}
          subtext="All passed quality gates"
          icon={<CheckCircle2 className="h-4 w-4" />}
          badge="+2 from yesterday"
          badgeVariant="success"
        />
        <MetricCard
          label="Test Suite Pass Rate"
          value={metrics.testSuitePassRate}
          subtext="Across 142 container test runs"
          icon={<ShieldCheck className="h-4 w-4" />}
          badge="High Resilience"
          badgeVariant="success"
        />
        <MetricCard
          label="Mean Investigation Time"
          value={metrics.meanInvestigationDuration}
          subtext="Intake to verified unified diff"
          icon={<Clock className="h-4 w-4" />}
        />
      </section>

      {/* Main Grid: Issues Table + Agent Fleet Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Issues Table */}
        <section className="lg:col-span-8 rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22252e] bg-[#16181f] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#9aa1b0]" />
              <h2 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider">
                Tracked Issue Investigations
              </h2>
              <span className="rounded bg-[#22252e] px-1.5 py-0.2 font-mono text-[10px] text-[#9aa1b0]">
                {isLoading ? "..." : filteredIssues.length}
              </span>
              <span className="rounded bg-amber-950/50 px-1.5 py-0.2 font-mono text-[9px] text-amber-300 border border-amber-900/60 uppercase">
                demo
              </span>
            </div>

            {/* Filter by Repository Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="h-3 w-3 text-[#626875]" />
              <span className="text-[11px] text-[#626875]">Repo:</span>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                disabled={isLoading}
                className="rounded border border-[#262933] bg-[#1a1c23] px-2 py-1 text-[11px] font-mono text-[#f0f2f5] focus:outline-none focus:border-[#383d4a] cursor-pointer"
              >
                <option value="all">all repositories</option>
                {repos.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <Link
                href="/issues"
                className="ml-2 font-mono text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center space-y-3 font-mono text-xs text-[#9aa1b0]">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Connecting to FastAPI backend...</span>
              </div>
              <p className="text-[11px] text-[#626875]">
                Fetching active issue records from PostgreSQL persistence layer
              </p>
              <div className="mt-4 space-y-2 max-w-md mx-auto opacity-40">
                <div className="h-10 bg-[#1e212b] rounded animate-pulse" />
                <div className="h-10 bg-[#1e212b] rounded animate-pulse" />
                <div className="h-10 bg-[#1e212b] rounded animate-pulse" />
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-6 m-4 rounded border border-rose-900/50 bg-rose-950/20 text-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Failed to load issues from FastAPI backend</span>
              </div>
              <p className="font-mono text-[11px] text-[#9aa1b0]">
                {error}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={loadIssues}
                  className="rounded border border-rose-800 bg-rose-900/40 px-3 py-1 font-mono text-xs text-rose-200 hover:bg-rose-900/60 transition-colors"
                >
                  Retry Connection
                </button>
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="flex items-center gap-1.5 rounded border border-[#2b2f3a] bg-[#1a1c24] px-3 py-1 font-mono text-xs text-[#f0f2f5] hover:bg-[#222530] transition-colors"
                >
                  <Database className="h-3 w-3 text-amber-400" />
                  <span>{isSeeding ? "Seeding..." : "Seed Database via /dev/seed"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredIssues.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1b1e27] text-[#9aa1b0]">
                <Database className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-xs font-semibold text-[#f0f2f5]">
                No tracked issues found
              </div>
              <p className="mx-auto max-w-sm text-[11px] text-[#626875] font-mono">
                The database is connected, but has no issues in this filter. Populate the dashboard with the six demo cases.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-1.5 rounded border border-amber-800/80 bg-amber-950/40 px-3 py-1.5 font-mono text-xs text-amber-300 hover:bg-amber-900/40 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isSeeding ? "Seeding issues..." : "Seed Six Demo Issues"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Issue Rows */}
          {!isLoading && !error && filteredIssues.length > 0 && (
            <div className="divide-y divide-[#1f2229]">
              {filteredIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Active Agent Fleet & Telemetry Stream */}
        <div className="lg:col-span-4 space-y-6">
          {/* Multi-Agent Worker Fleet */}
          <section className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
            <div className="border-b border-[#22252e] bg-[#16181f] px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#9aa1b0]" />
                <h3 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider">
                  Specialist Agent Fleet
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                6 Active
              </span>
            </div>

            <div className="divide-y divide-[#1f2229] text-xs">
              {[
                {
                  name: "Requirements Analyst",
                  task: "Extracting issue specs",
                  load: "Idle",
                  model: "Gemini 1.5 Pro",
                },
                {
                  name: "Codebase Investigator",
                  task: "Mapping AST call graph",
                  load: "1 Task",
                  model: "Gemini 1.5 Pro",
                },
                {
                  name: "Solution Planner",
                  task: "Formulating atomic plan",
                  load: "Idle",
                  model: "Gemini 1.5 Pro",
                },
                {
                  name: "Patch Engineer",
                  task: "Generating unified diff",
                  load: "Idle",
                  model: "Gemini 1.5 Pro",
                },
                {
                  name: "Test Runner",
                  task: "Isolated container sandbox",
                  load: "1 Task",
                  model: "Sandbox Runner",
                },
                {
                  name: "Code Reviewer & Docs",
                  task: "Auditing security & PR notes",
                  load: "Idle",
                  model: "Gemini 1.5 Flash",
                },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#161820] transition-colors"
                >
                  <div>
                    <div className="font-medium text-[#f0f2f5]">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-[#626875] font-mono">
                      {agent.task}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        agent.load === "Idle"
                          ? "bg-[#1d2027] text-[#9aa1b0]"
                          : "bg-amber-950/60 text-amber-300 border border-amber-900/50"
                      }`}
                    >
                      {agent.load}
                    </span>
                    <div className="text-[10px] text-[#626875] font-mono mt-0.5">
                      {agent.model}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity Telemetry Feed */}
          <section className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
            <div className="border-b border-[#22252e] bg-[#16181f] px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#9aa1b0]" />
                <h3 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider">
                  Audit Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#626875]">Live</span>
            </div>

            <div className="p-3 bg-[#0c0d10] font-mono text-[11px] space-y-2 text-[#9aa1b0]">
              <div className="flex items-start gap-2">
                <span className="text-[#626875] shrink-0">09:41:05</span>
                <span>
                  <strong className="text-emerald-400">PP-101</strong>:
                  Investigation completed. 24/24 tests verified.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#626875] shrink-0">09:30:15</span>
                <span>
                  <strong className="text-amber-400">PP-102</strong>: TestRunner
                  executing replay verification suite.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#626875] shrink-0">09:12:44</span>
                <span>
                  <strong className="text-amber-400">PP-103</strong>:
                  CodeInvestigator detected N+1 query in cart item loop.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#626875] shrink-0">08:50:33</span>
                <span>
                  <strong className="text-[#f0f2f5]">PP-104</strong>: Queued
                  for requirements analysis triage.
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
