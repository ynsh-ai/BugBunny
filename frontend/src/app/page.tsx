"use client";

import React, { useState } from "react";
import {
  Search,
  FileCode2,
  CheckCircle2,
  FileText,
  Sparkles,
  Terminal,
  ShieldCheck,
  Layers,
  Activity,
  Play,
  Check,
  Database,
  Cpu,
  Boxes,
} from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface PipelineStep {
  id: string;
  number: string;
  title: string;
  agent: string;
  description: string;
  icon: React.ElementType;
  mockArtifact: {
    status: string;
    details: string[];
    snippet?: string;
  };
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "requirements",
    number: "01",
    title: "Requirements Analysis",
    agent: "RequirementsAnalystAgent",
    description: "Parses issue description, extracts reproduction steps, and establishes strict acceptance criteria.",
    icon: Search,
    mockArtifact: {
      status: "Requirements Extracted (100% confidence)",
      details: [
        "Issue: #104 - Fix race condition in async database session acquisition",
        "Target Component: backend/app/core/database.py",
        "Acceptance Criteria: Concurrent queries reuse connection pool safely under peak load",
      ],
      snippet: `// Acceptance Spec:
// 1. Thread-safe async engine pooling
// 2. Max pool size enforced with non-blocking queue
// 3. Graceful fallback on connection timeouts`,
    },
  },
  {
    id: "investigation",
    number: "02",
    title: "Codebase Investigation",
    agent: "CodeInvestigatorAgent",
    description: "Navigates symbol graphs, call hierarchies, and related tests to localize root causes.",
    icon: FileCode2,
    mockArtifact: {
      status: "Call Hierarchy Mapped (3 relevant files)",
      details: [
        "Identified file: backend/app/core/database.py:L34-L52",
        "Referenced in: backend/app/api/routes/issues.py",
        "Existing regression test: tests/test_database.py",
      ],
      snippet: `Call Graph:
  get_db() -> async_sessionmaker()
    └── engine.connect() [Leak identified: missing session.close() in exception path]`,
    },
  },
  {
    id: "planning",
    number: "03",
    title: "Implementation Planning",
    agent: "SolutionPlannerAgent",
    description: "Formulates a minimal, non-breaking architectural plan with verifiable validation milestones.",
    icon: Layers,
    mockArtifact: {
      status: "Plan Formulated (4 phases)",
      details: [
        "Step 1: Wrap session lifecycle in contextmanager with async yield",
        "Step 2: Add connection retry backoff with jitter",
        "Step 3: Add concurrent connection stress test in tests/test_concurrency.py",
      ],
      snippet: `Execution Strategy:
  [Phase 1]: Update session generator to use async context manager
  [Phase 2]: Enforce pool recycling (pool_recycle=1800)
  [Phase 3]: Run pytest with 50 parallel client sessions`,
    },
  },
  {
    id: "patching",
    number: "04",
    title: "Patch Engineering",
    agent: "PatchEngineerAgent",
    description: "Applies precision code edits adhering to repo conventions and coding standards.",
    icon: Terminal,
    mockArtifact: {
      status: "Patch Generated (1 file modified, +8 -3 lines)",
      details: [
        "File: backend/app/core/database.py",
        "Clean AST formatting applied",
        "No extraneous dependency added",
      ],
      snippet: `@@ -38,7 +38,12 @@ async def get_db():
-    session = AsyncSessionLocal()
-    yield session
+    async with AsyncSessionLocal() as session:
+        try:
+            yield session
+        finally:
+            await session.close()`,
    },
  },
  {
    id: "testing",
    number: "05",
    title: "Test Verification",
    agent: "TestRunnerAgent",
    description: "Executes test suites in isolated sandbox containers to verify zero regressions.",
    icon: CheckCircle2,
    mockArtifact: {
      status: "All Tests Passing (48 passed, 0 failed)",
      details: [
        "Unit tests: 36 passed in 0.42s",
        "Concurrency stress tests: 12 passed in 1.18s",
        "Code coverage: 94.2% (+1.8%)",
      ],
      snippet: `pytest backend/tests/
============ 48 passed, 0 warnings in 1.60s ============
Result: SUCCESS (Zero regressions detected)`,
    },
  },
  {
    id: "review",
    number: "06",
    title: "Review & Documentation",
    agent: "CodeReviewerAgent",
    description: "Reviews the unified diff for security, generates release notes, and drafts the pull request.",
    icon: FileText,
    mockArtifact: {
      status: "Ready for Human Review (Clean Score: 98/100)",
      details: [
        "Security check: 0 vulnerabilities found",
        "PR title: fix(database): prevent connection leak in async session lifecycle",
        "Release documentation compiled",
      ],
      snippet: `PR Description:
Summary: Wraps database session generation in async context manager
to guarantee pool cleanup during unhandled API exceptions.
Fixes: #104`,
    },
  },
];

export default function Home() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [issueInput, setIssueInput] = useState<string>(
    "https://github.com/ynsh-ai/patchpilot-ai/issues/104"
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const activeStep = PIPELINE_STEPS[activeStepIndex];

  const handleSimulate = () => {
    setIsSimulating(true);
    const nextIdx = (activeStepIndex + 1) % PIPELINE_STEPS.length;
    setTimeout(() => {
      setActiveStepIndex(nextIdx);
      setIsSimulating(false);
    }, 400);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-[600px] right-0 h-[400px] w-[500px] rounded-full bg-violet-600/10 blur-[140px]" />

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  PatchPilot AI
                </span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-indigo-400">
                  v0.1.0-alpha
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multi-Agent Autonomous Engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Orchestrator: Standby</span>
            </div>
            <a
              href="https://github.com/ynsh-ai/patchpilot-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800"
            >
              <GithubIcon className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Autonomous Software Engineering Pipeline</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              PatchPilot AI
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-indigo-300">
            From GitHub issue to implementation-ready change.
          </p>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-400 max-w-2xl mx-auto">
            A developer selects a GitHub issue. PatchPilot orchestrates specialized AI agents to analyze requirements, inspect code symbols, formulate verified plans, execute tests, and deliver review-ready patches.
          </p>

          {/* Interactive Demo Control Bar */}
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <GithubIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={issueInput}
                  onChange={(e) => setIssueInput(e.target.value)}
                  placeholder="Paste GitHub Issue URL (e.g. owner/repo#123)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Simulate Pipeline</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Interactive preview &mdash; external API integrations intentionally decoupled in foundation mode
            </p>
          </div>
        </div>

        {/* Pipeline Interactive Stages Section */}
        <section className="mt-20">
          <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Boxes className="h-5 w-5 text-indigo-400" />
                Multi-Agent Workflow Execution
              </h2>
              <p className="text-sm text-slate-400">
                Click any stage to inspect the specialized agent persona and generated artifacts.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Step {activeStep.number} of {PIPELINE_STEPS.length}
            </div>
          </div>

          {/* Step Selector Tabs */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = idx === activeStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`group relative flex flex-col items-start rounded-xl p-4 text-left transition-all ${
                    isSelected
                      ? "border border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                      : "border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-3">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isSelected ? "text-indigo-400" : "text-slate-500"
                      }`}
                    >
                      {step.number}
                    </span>
                    <div
                      className={`rounded-lg p-1.5 transition-colors ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-800/80 text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                    {step.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-mono line-clamp-1">
                    {step.agent}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:p-8 backdrop-blur-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Agent Overview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                  <span>Stage {activeStep.number}</span>
                  <span>&bull;</span>
                  <span className="font-mono">{activeStep.agent}</span>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {activeStep.title}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed">
                  {activeStep.description}
                </p>

                <div className="pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Key Deliverables
                  </div>
                  <ul className="space-y-2">
                    {activeStep.mockArtifact.details.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-300"
                      >
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Code / Artifact Visualizer */}
              <div className="lg:col-span-7 rounded-xl border border-slate-800/90 bg-slate-950 p-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[11px] text-slate-500">
                      artifact://{activeStep.id}.output
                    </span>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {activeStep.mockArtifact.status}
                  </span>
                </div>
                <pre className="overflow-x-auto p-2 text-slate-300 leading-relaxed font-mono whitespace-pre text-[12px]">
                  {activeStep.mockArtifact.snippet}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Foundation Architecture Section */}
        <section className="mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Production-Grade Monorepo Foundation
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Architected with independent, modular components ready for enterprise expansion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Next.js Frontend</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                App Router, React 19, TypeScript, and Tailwind CSS v4 for real-time agent observability and interactive developer review.
              </p>
              <div className="mt-4 font-mono text-[11px] text-indigo-400">
                frontend/ (Port 3000)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">FastAPI Backend</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                High-performance async Python backend with health probing, modular API routing, and structured service boundaries.
              </p>
              <div className="mt-4 font-mono text-[11px] text-emerald-400">
                backend/ (Port 8000)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">PostgreSQL & Alembic</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Docker Compose infrastructure with persistent storage volumes and SQLAlchemy / Alembic migration templates.
              </p>
              <div className="mt-4 font-mono text-[11px] text-sky-400">
                infra/ (Port 5432)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Agent Orchestration</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ready for OpenAI Agents SDK orchestration loops with Gemini as model provider for deep multi-file codebase reasoning.
              </p>
              <div className="mt-4 font-mono text-[11px] text-purple-400">
                backend/app/agents/
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PatchPilot AI</span>
            <span>&bull;</span>
            <span>From GitHub issue to implementation-ready change.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Next.js</span>
            <span>&bull;</span>
            <span>FastAPI</span>
            <span>&bull;</span>
            <span>PostgreSQL</span>
            <span>&bull;</span>
            <span>Agents SDK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
