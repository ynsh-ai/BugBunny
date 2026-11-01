"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Lock,
  Check,
  Search,
  FileCode,
  Layers,
  ChevronRight,
  Eye,
} from "lucide-react";
import { BugBunnyLogo } from "@/components/BugBunnyLogo";

export default function MarketingLandingPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F0] text-[#171916]">
      {/* ====================================================================== */}
      {/* 1. HERO SECTION                                                        */}
      {/* ====================================================================== */}
      <section className="relative border-b border-[#DADDD3] bg-[#F5F5F0] pt-20 pb-20 bg-tech-grid overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-7 relative z-10">
          {/* Product Pill */}
          <div className="inline-flex items-center gap-2 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-1 text-xs font-mono text-[#171916] shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-[#35A56A]" />
            <span className="font-semibold">BUGBUNNY // AI ENGINEERING PLATFORM</span>
            <span className="text-[#777D71]">|</span>
            <span className="text-[#777D71]">HUMAN-APPROVED AUTONOMY</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#171916] leading-[1.08]">
            Your AI Engineering Team for{" "}
            <span className="underline decoration-[#C6F36B] decoration-4 underline-offset-4">
              Every GitHub Issue
            </span>
            .
          </h1>

          {/* Supporting Copy */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#777D71] leading-relaxed">
            BugBunny investigates software issues, understands your codebase,
            identifies root causes, and develops verified engineering solutions
            — while keeping you in control.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2.5 rounded-xs bg-[#C6F36B] px-6 py-3 text-xs font-bold text-[#171916] border border-[#AEE64E] shadow-sm hover:bg-[#B5E856] active:translate-y-px transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 ml-0.5" />
            </Link>

            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xs bg-[#E8EAE3] px-6 py-3 text-xs font-semibold text-[#171916] border border-[#DADDD3] hover:bg-[#DADDD3] active:translate-y-px transition-all"
            >
              <span>Explore How It Works</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#777D71]" />
            </a>
          </div>

          {/* Safety Tagline */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-[#777D71]">
            <ShieldCheck className="h-4 w-4 text-[#35A56A]" />
            <span>BugBunny proposes changes. Your repository stays under your control.</span>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 2. PRODUCT INTERFACE PREVIEW (Realistic Interactive Agent Canvas)       */}
      {/* ====================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 -mt-8 relative z-20">
        <div className="rounded-xs border border-[#3A4037] bg-[#292D27] text-[#F5F5F0] shadow-2xl overflow-hidden">
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
              <div className="text-[11px] uppercase tracking-wider text-[#9BA095] font-bold border-b border-[#3A4037] pb-2 flex items-center justify-between">
                <span>Autonomous Multi-Agent Pipeline</span>
                <span className="text-[#C6F36B] text-[10px]">6/6 COMPLETED</span>
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
                <span className="text-[10px] text-[#C6F36B] font-semibold">+6 lines / -2 lines</span>
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
              <div className="mt-4 rounded-xs border border-[#AEE64E] bg-[#C6F36B]/15 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#F5F5F0] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#C6F36B]" />
                    <span>Awaiting Human Approval</span>
                  </div>
                  <p className="text-[11px] text-[#9BA095]">
                    All 6 agents finished. BugBunny waits for developer review before any action.
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="rounded-xs bg-[#C6F36B] text-[#171916] font-bold px-3.5 py-1.5 text-xs hover:bg-[#B5E856] transition-colors shrink-0 text-center"
                >
                  Try BugBunny
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 3. HOW IT WORKS (3 UNDERSTATED WORKFLOW STEPS)                         */}
      {/* ====================================================================== */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <div className="space-y-12">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#777D71] font-semibold">
              HOW BUGBUNNY OPERATES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171916]">
              A disciplined, transparent engineering pipeline
            </h2>
            <p className="text-sm text-[#777D71] max-w-2xl">
              From public issue intake to verified implementation patch. Every stage is transparent, audited, and strictly sandboxed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-7 space-y-4">
              <div className="font-mono text-xs font-bold text-[#171916] bg-[#DADDD3] w-8 h-8 flex items-center justify-center rounded-2xs">
                01
              </div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#171916]">
                Ingest Context
              </h3>
              <p className="text-xs leading-relaxed text-[#777D71]">
                Import public GitHub issues and code repositories. BugBunny crawls file trees, imports, and symbol hierarchies strictly with read-only sandbox containment.
              </p>
              <div className="pt-2 font-mono text-[11px] text-[#171916] flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#35A56A]" />
                <span>Read-only AST & symbol mapping</span>
              </div>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-7 space-y-4">
              <div className="font-mono text-xs font-bold text-[#171916] bg-[#DADDD3] w-8 h-8 flex items-center justify-center rounded-2xs">
                02
              </div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#171916]">
                Investigate & Patch
              </h3>
              <p className="text-xs leading-relaxed text-[#777D71]">
                Specialized AI agents isolate root causes, craft minimal surgical unified diffs, and execute regression test simulations to verify correctness.
              </p>
              <div className="pt-2 font-mono text-[11px] text-[#171916] flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#35A56A]" />
                <span>Zero-hallucination code generation</span>
              </div>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#DADDD3] p-7 space-y-4">
              <div className="font-mono text-xs font-bold text-[#171916] bg-[#C6F36B] w-8 h-8 flex items-center justify-center rounded-2xs">
                03
              </div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#171916]">
                Human Approval
              </h3>
              <p className="text-xs leading-relaxed text-[#171916]">
                Inspect diffs, evidence, and test reports. BugBunny records your decision and only pushes changes when explicitly confirmed.
              </p>
              <div className="pt-2 font-mono text-[11px] text-[#171916] flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#171916]" />
                <span>Explicit developer sign-off required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 4. MULTI-AGENT ARCHITECTURE (THE 6 REAL SPECIALIZED AGENTS)             */}
      {/* ====================================================================== */}
      <section id="product" className="border-t border-[#DADDD3] bg-[#E8EAE3] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#777D71] font-semibold">
              MULTI-AGENT INTELLIGENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171916]">
              6 Specialized Engineering Agents
            </h2>
            <p className="text-sm text-[#777D71] max-w-2xl">
              Unlike monolithic AI models, BugBunny delegates every phase to a specialized agent designed with strict guardrails and specific responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                name: "Requirements Analyst",
                role: "Issue Ingestion & Specification",
                desc: "Parses GitHub issue descriptions, stack traces, and reproduction notes into formal, machine-actionable problem specifications.",
                highlight: "Extracts error logs & repro steps",
              },
              {
                num: "02",
                name: "Codebase Investigator",
                role: "Symbolic Graph Exploration",
                desc: "Traverses AST hierarchies, imports, call graphs, and definitions in read-only sandbox mode to pinpoint suspect files and lines.",
                highlight: "Read-only file isolation",
              },
              {
                num: "03",
                name: "Solution Planner",
                role: "Strategy & Blast-Radius Assessment",
                desc: "Architects surgical fix blueprints, evaluates ripple effects across dependencies, and defines regression test expectations.",
                highlight: "Minimal blast-radius planning",
              },
              {
                num: "04",
                name: "Patch Engineer",
                role: "Surgical Code Synthesis",
                desc: "Authors clean, deterministic unified git diffs targeting identified root causes without side effects or speculative abstractions.",
                highlight: "Production-grade unified diffs",
              },
              {
                num: "05",
                name: "Test Runner",
                role: "Automated Regression Verification",
                desc: "Synthesizes targeted test assertions, executes test suites, and verifies that the patch resolves the bug without regressions.",
                highlight: "100% test pass verification",
              },
              {
                num: "06",
                name: "Code Reviewer & Docs Agent",
                role: "Security Audit & Release Notes",
                desc: "Performs OWASP security scans, verifies code standards, and authors human-readable pull request summaries and explanations.",
                highlight: "OWASP verified & documented",
              },
            ].map((agent) => (
              <div
                key={agent.num}
                className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-6 space-y-4 hover:border-[#171916] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#777D71] bg-[#E8EAE3] px-2 py-0.5 rounded-2xs">
                    AGENT {agent.num}
                  </span>
                  <span className="font-mono text-[10px] text-[#35A56A] font-semibold">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#171916]">
                    {agent.name}
                  </h3>
                  <div className="font-mono text-xs text-[#777D71]">
                    {agent.role}
                  </div>
                </div>

                <p className="text-xs text-[#575E54] leading-relaxed">
                  {agent.desc}
                </p>

                <div className="pt-2 border-t border-[#DADDD3] font-mono text-[11px] text-[#171916] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#35A56A]" />
                  <span>{agent.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 5. ISSUE INVESTIGATION & DEEP CONTEXT                                  */}
      {/* ====================================================================== */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="font-mono text-xs uppercase tracking-wider text-[#777D71] font-semibold">
              DEEP ISSUE UNDERSTANDING
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171916] leading-tight">
              From bug report to root cause in seconds.
            </h2>
            <p className="text-sm text-[#777D71] leading-relaxed">
              Software issues often omit crucial technical context. BugBunny extracts implicit symbols, maps stack traces to concrete source files, and determines the true cause of failure rather than surface symptoms.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xs border border-[#DADDD3] bg-[#E8EAE3]">
                <Search className="h-4 w-4 text-[#171916] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#171916]">Stack Trace Parsing</div>
                  <div className="text-[#777D71] text-[11px]">Automatically maps tracebacks to local repository paths and line offsets.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xs border border-[#DADDD3] bg-[#E8EAE3]">
                <FileCode className="h-4 w-4 text-[#171916] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#171916]">Symbol Graph Traversal</div>
                  <div className="text-[#777D71] text-[11px]">Follows function calls, imports, and inheritance trees across files.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xs border border-[#DADDD3] bg-[#E8EAE3]">
                <Layers className="h-4 w-4 text-[#171916] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#171916]">Blast Radius Analysis</div>
                  <div className="text-[#777D71] text-[11px]">Computes the risk profile and downstream dependents affected by potential fixes.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xs border border-[#3A4037] bg-[#171916] text-[#F5F5F0] p-6 font-mono text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2B3128] pb-3 text-[11px] text-[#9BA095]">
              <span>INVESTIGATION TRACE // #PP-104</span>
              <span className="text-[#35A56A]">ISOLATED</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="text-[#777D71]">
                [00:01.2] Reading issue #104: Timeout error on float conversions...
              </div>
              <div className="text-[#777D71]">
                [00:02.1] Extracting stack trace: requests.adapters.send() line 412
              </div>
              <div className="text-[#C6F36B]">
                [00:03.4] Candidate file identified: src/requests/adapters.py
              </div>
              <div className="text-[#777D71]">
                [00:04.0] Call graph matched: HTTPAdapter &rarr; send &rarr; conn.urlopen
              </div>
              <div className="text-[#35A56A] bg-[#35A56A]/10 p-2 rounded-xs border border-[#35A56A]/30">
                &gt; Root Cause: conn.timeout does not clamp negative or invalid timeout floats before socket allocation.
              </div>
            </div>

            <div className="pt-2 border-t border-[#2B3128] flex items-center justify-between text-[11px] text-[#9BA095]">
              <span>Candidate Files: 1</span>
              <span>Blast Radius: Low (1 module)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 6. CODEBASE INTELLIGENCE & READ-ONLY SANDBOXING                        */}
      {/* ====================================================================== */}
      <section className="border-t border-[#DADDD3] bg-[#E8EAE3] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-xs border border-[#3A4037] bg-[#1F221E] text-[#F5F5F0] p-6 font-mono text-xs space-y-4 order-2 lg:order-1">
              <div className="flex items-center justify-between border-b border-[#3A4037] pb-3 text-[11px] text-[#9BA095]">
                <span>REPOSITORY AST CACHE</span>
                <span className="text-[#35A56A] font-bold">READ-ONLY SANDBOX</span>
              </div>

              <div className="space-y-1 text-[11px] text-[#9BA095]">
                <div>📁 requests/</div>
                <div className="pl-4">├── 📄 __init__.py</div>
                <div className="pl-4 text-[#C6F36B]">├── 📄 adapters.py (target symbol)</div>
                <div className="pl-4">├── 📄 api.py</div>
                <div className="pl-4">├── 📄 models.py</div>
                <div className="pl-4">└── 📄 sessions.py</div>
                <div>📁 tests/</div>
                <div className="pl-4 text-[#35A56A]">└── 📄 test_adapters.py (14 assertions)</div>
              </div>

              <div className="p-3 bg-[#171916] rounded-xs border border-[#3A4037] text-[10px] text-[#777D71] space-y-1">
                <div>SECURITY POLICY: Zero write permissions granted to AI agents.</div>
                <div>ISOLATION: Local git workspace cloned to ephemeral memory mount.</div>
              </div>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#777D71] font-semibold">
                REPOSITORY INTELLIGENCE
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171916] leading-tight">
                Deep codebase indexing with zero write danger.
              </h2>
              <p className="text-sm text-[#777D71] leading-relaxed">
                BugBunny ingests repository architectures, parses Abstract Syntax Trees, and indexes symbol relationships entirely in read-only containment. We never require write credentials to analyze your repositories.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#171916]">
                  <Check className="h-4 w-4 text-[#35A56A]" />
                  <span>Public GitHub repository parsing via official APIs</span>
                </div>
                <div className="flex items-center gap-2 text-[#171916]">
                  <Check className="h-4 w-4 text-[#35A56A]" />
                  <span>In-memory symbol indexing with AST tree caching</span>
                </div>
                <div className="flex items-center gap-2 text-[#171916]">
                  <Check className="h-4 w-4 text-[#35A56A]" />
                  <span>Zero code modification on remote branches</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 7. SOLUTION GENERATION & MINIMAL BLAST RADIUS                          */}
      {/* ====================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <div className="space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-wider text-[#777D71] font-semibold">
              SURGICAL PATCH QUALITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171916]">
              Minimal diffs. Zero speculative abstractions.
            </h2>
            <p className="text-sm text-[#777D71]">
              BugBunny values minimalism. Patches are kept as small and localized as possible, adhering strictly to existing codebase conventions and coding idioms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-6 space-y-3">
              <div className="p-2.5 bg-[#FFFFFF] rounded-xs border border-[#DADDD3] w-fit">
                <Code2 className="h-5 w-5 text-[#171916]" />
              </div>
              <h3 className="text-sm font-bold text-[#171916]">Standard Git Diffs</h3>
              <p className="text-xs text-[#777D71] leading-relaxed">
                Generates industry-standard unified patches that apply cleanly with <code>git apply</code> or as standard GitHub Pull Requests.
              </p>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-6 space-y-3">
              <div className="p-2.5 bg-[#FFFFFF] rounded-xs border border-[#DADDD3] w-fit">
                <CheckCircle2 className="h-5 w-5 text-[#35A56A]" />
              </div>
              <h3 className="text-sm font-bold text-[#171916]">Automated Assertions</h3>
              <p className="text-xs text-[#777D71] leading-relaxed">
                Test Runner synthesizes exact unit assertions reproducing the issue and proving the patch resolves it before proposing the change.
              </p>
            </div>

            <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-6 space-y-3">
              <div className="p-2.5 bg-[#FFFFFF] rounded-xs border border-[#DADDD3] w-fit">
                <ShieldCheck className="h-5 w-5 text-[#171916]" />
              </div>
              <h3 className="text-sm font-bold text-[#171916]">Security Guardrails</h3>
              <p className="text-xs text-[#777D71] leading-relaxed">
                Reviewer agent inspects proposed changes against OWASP recommendations to prevent regression vulnerabilities or credential leaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 8. SECURITY & PRIVACY MODEL                                            */}
      {/* ====================================================================== */}
      <section id="security" className="border-t border-[#DADDD3] bg-[#171916] text-[#F5F5F0] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#C6F36B] font-semibold">
              SECURITY & GOVERNANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F0]">
              Built for engineering teams with zero compromise on safety.
            </h2>
            <p className="text-sm text-[#9BA095] max-w-2xl leading-relaxed">
              Autonomous engineering only works when you trust the boundaries. BugBunny is built with structural containment and mandatory human verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 space-y-3">
              <div className="p-2 bg-[#292D27] rounded-xs border border-[#3A4037] w-fit text-[#C6F36B]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F5F0]">Read-Only Repositories</h3>
              <p className="text-xs text-[#9BA095] leading-relaxed">
                We strictly consume read-only AST data. BugBunny never requests write permissions to your GitHub repositories or production branches.
              </p>
            </div>

            <div className="rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 space-y-3">
              <div className="p-2 bg-[#292D27] rounded-xs border border-[#3A4037] w-fit text-[#C6F36B]">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F5F0]">Human Approval Gate</h3>
              <p className="text-xs text-[#9BA095] leading-relaxed">
                BugBunny will never automatically merge code or trigger external actions. Every proposed patch halts at an interactive review gate.
              </p>
            </div>

            <div className="rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 space-y-3">
              <div className="p-2 bg-[#292D27] rounded-xs border border-[#3A4037] w-fit text-[#C6F36B]">
                <ShieldCheck className="h-5 w-5 text-[#35A56A]" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F5F0]">Isolated Execution</h3>
              <p className="text-xs text-[#9BA095] leading-relaxed">
                All agent analysis runs in temporary, isolated processes with strict resource limits and full telemetry audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* 9. FINAL CALL TO ACTION                                                */}
      {/* ====================================================================== */}
      <section className="bg-[#C6F36B] py-20 text-[#171916] border-t border-[#AEE64E]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to resolve software issues faster?
          </h2>
          <p className="text-sm sm:text-base text-[#171916]/80 max-w-xl mx-auto leading-relaxed">
            Deploy an autonomous AI engineering team to investigate bugs, identify root causes, and prepare human-approved patches.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xs bg-[#171916] px-7 py-3.5 text-xs font-bold text-[#F5F5F0] hover:bg-[#292D27] shadow-lg transition-all"
            >
              <span>Get Started with BugBunny</span>
              <ArrowRight className="h-4 w-4 text-[#C6F36B]" />
            </Link>

            <Link
              href="/login"
              className="rounded-xs border border-[#171916]/30 bg-transparent px-6 py-3.5 text-xs font-bold text-[#171916] hover:bg-black/5 transition-colors"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
