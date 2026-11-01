"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { BugBunnyLogo } from "@/components/BugBunnyLogo";
import { GitHubBrandIcon } from "@/components/AuthIcons";
import { fetchRepositories, importGitHubRepo } from "@/lib/api";
import { RepositoryItem } from "@/mock/types";
import {
  getOnboardingState,
  saveOnboardingState,
  completeOnboarding,
  getStoredUser,
  OnboardingState,
} from "@/lib/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(getOnboardingState());
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [repoInput, setRepoInput] = useState("");
  const [importingRepo, setImportingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState(
    state.githubAccount?.username || getStoredUser()?.name || ""
  );

  const currentStep = state.currentStep;

  const updateState = useCallback((partial: Partial<OnboardingState>) => {
    const updated = saveOnboardingState(partial);
    setState(updated);
  }, []);

  // Load backend repositories
  useEffect(() => {
    let isMounted = true;
    fetchRepositories()
      .then((data) => {
        if (isMounted) {
          setRepositories(data);
          setIsLoadingRepos(false);
          // If no repo selected yet but backend has repos, select first by default
          if (!state.selectedRepository && data.length > 0) {
            const first = data[0];
            updateState({
              selectedRepository: {
                id: first.id,
                name: first.name,
                owner: first.owner,
                defaultBranch: first.defaultBranch || "main",
                isPublic: true,
              },
            });
          }
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingRepos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [state.selectedRepository, updateState]);

  const nextStep = () => {
    if (currentStep < 8) {
      updateState({ currentStep: currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      updateState({ currentStep: currentStep - 1 });
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push("/dashboard");
  };

  const handleConnectGitHub = () => {
    const username = githubUsername.trim() || "developer";
    updateState({
      githubConnected: true,
      githubAccount: {
        username,
        isReadOnly: true,
      },
    });
  };

  const handleImportRepo = async () => {
    if (!repoInput.trim()) return;
    setImportingRepo(true);
    setRepoError(null);
    try {
      let targetUrl = repoInput.trim();
      if (!targetUrl.startsWith("http")) {
        targetUrl = `https://github.com/${targetUrl}`;
      }
      const newRepo = await importGitHubRepo(targetUrl);
      setRepositories((prev) => [newRepo, ...prev]);
      updateState({
        selectedRepository: {
          id: newRepo.id,
          name: newRepo.name,
          owner: newRepo.owner,
          defaultBranch: newRepo.defaultBranch || "main",
          isPublic: true,
        },
      });
      setRepoInput("");
    } catch (err: unknown) {
      setRepoError(
        err instanceof Error ? err.message : "Failed to import repository."
      );
    } finally {
      setImportingRepo(false);
    }
  };

  const toggleUseCase = (useCase: string) => {
    const current = state.useCases;
    const next = current.includes(useCase)
      ? current.filter((u) => u !== useCase)
      : [...current, useCase];
    updateState({ useCases: next });
  };

  const toggleAgent = (key: keyof OnboardingState["enabledAgents"]) => {
    updateState({
      enabledAgents: {
        ...state.enabledAgents,
        [key]: !state.enabledAgents[key],
      },
    });
  };

  const STEPS_LABELS = [
    "Welcome",
    "Connect GitHub",
    "Repository",
    "Use Cases",
    "Agents",
    "Autonomy",
    "Preferences",
    "Ready",
  ];

  return (
    <div className="min-h-screen bg-[#171916] text-[#F5F5F0] flex flex-col justify-between">
      {/* Top Wizard Navigation */}
      <header className="border-b border-[#3A4037] bg-[#1F221E] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-[#292D27] border border-[#3A4037]">
              <BugBunnyLogo size={20} />
            </div>
            <span className="font-bold text-sm text-[#F5F5F0] tracking-tight">
              BugBunny
            </span>
          </Link>
          <span className="text-[#575E54]">/</span>
          <span className="font-mono text-xs text-[#9BA095]">
            Workspace Setup
          </span>
        </div>

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#9BA095]">
          <span>Step {currentStep} of 8:</span>
          <span className="text-[#C6F36B] font-semibold">
            {STEPS_LABELS[currentStep - 1]}
          </span>
        </div>

        {/* Skip to Dashboard */}
        <button
          onClick={handleFinish}
          className="text-xs font-mono text-[#777D71] hover:text-[#F5F5F0] transition-colors"
        >
          Skip to Dashboard →
        </button>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#292D27] h-1">
        <div
          className="bg-[#C6F36B] h-1 transition-all duration-300"
          style={{ width: `${(currentStep / 8) * 100}%` }}
        />
      </div>

      {/* Main Wizard Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        <div className="rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 sm:p-10 shadow-2xl relative">
          
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-xs border border-[#AEE64E]/40 bg-[#C6F36B]/10 px-3 py-1 text-xs font-mono text-[#C6F36B]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AUTONOMOUS ENGINEERING TEAM</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
                  Welcome to BugBunny
                </h1>
                <p className="text-sm text-[#9BA095] leading-relaxed">
                  BugBunny is an autonomous multi-agent engineering platform designed to investigate public GitHub issues, diagnose root causes, and craft verified code changes — while keeping you in total control.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#3A4037]">
                <div className="space-y-2 rounded-xs border border-[#3A4037] bg-[#171916] p-4">
                  <div className="font-mono text-xs text-[#C6F36B] font-bold">01 / READ-ONLY</div>
                  <h3 className="text-xs font-bold text-[#F5F5F0]">Containment</h3>
                  <p className="text-[11px] text-[#9BA095] leading-relaxed">
                    Repository ASTs and files are parsed strictly in read-only sandbox mode.
                  </p>
                </div>

                <div className="space-y-2 rounded-xs border border-[#3A4037] bg-[#171916] p-4">
                  <div className="font-mono text-xs text-[#C6F36B] font-bold">02 / 6 SPECIALISTS</div>
                  <h3 className="text-xs font-bold text-[#F5F5F0]">Multi-Agent</h3>
                  <p className="text-[11px] text-[#9BA095] leading-relaxed">
                    6 specialized agents collaborate from issue intake to regression tests.
                  </p>
                </div>

                <div className="space-y-2 rounded-xs border border-[#3A4037] bg-[#171916] p-4">
                  <div className="font-mono text-xs text-[#C6F36B] font-bold">03 / HUMAN GATE</div>
                  <h3 className="text-xs font-bold text-[#F5F5F0]">Control</h3>
                  <p className="text-[11px] text-[#9BA095] leading-relaxed">
                    BugBunny never modifies your repository without your explicit sign-off.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONNECT GITHUB */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Connect Your GitHub Profile
                </h2>
                <p className="text-sm text-[#9BA095]">
                  BugBunny accesses public GitHub issues and repositories. We enforce a zero-write security policy.
                </p>
              </div>

              <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#222520] rounded-xs border border-[#3A4037]">
                      <GitHubBrandIcon className="h-6 w-6 text-[#F5F5F0]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F5F5F0]">
                        GitHub Integration
                      </div>
                      <div className="text-xs text-[#9BA095]">
                        Read-only access to public issues and repository trees
                      </div>
                    </div>
                  </div>

                  {state.githubConnected ? (
                    <span className="flex items-center gap-1.5 rounded-xs bg-[#35A56A]/20 border border-[#35A56A] px-2.5 py-1 text-xs font-mono text-[#35A56A]">
                      <Check className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2 pt-2 border-t border-[#2B3128]">
                  <label className="block text-xs font-mono text-[#9BA095]">
                    GitHub Username or Handle
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="e.g. octocat"
                      className="flex-1 rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2 text-xs text-[#F5F5F0] placeholder-[#575E54] focus:border-[#C6F36B] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConnectGitHub}
                      className="rounded-xs bg-[#292D27] hover:bg-[#323730] border border-[#3A4037] px-4 py-2 text-xs font-semibold text-[#F5F5F0] transition-colors"
                    >
                      {state.githubConnected ? "Update" : "Connect"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#35A56A] pt-1">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Read-only sandbox guard active. No write permissions required.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT REPOSITORY */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Select a Repository to Investigate
                </h2>
                <p className="text-sm text-[#9BA095]">
                  Select an existing indexed repository or provide any public GitHub repository URL.
                </p>
              </div>

              {/* Import by URL */}
              <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-4 space-y-3">
                <label className="block text-xs font-mono text-[#9BA095]">
                  Import Public Repository (e.g. psf/requests or owner/repo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="https://github.com/psf/requests or psf/requests"
                    className="flex-1 rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2 text-xs text-[#F5F5F0] placeholder-[#575E54] focus:border-[#C6F36B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleImportRepo}
                    disabled={importingRepo || !repoInput.trim()}
                    className="rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {importingRepo ? "Indexing..." : "Index Repo"}
                  </button>
                </div>
                {repoError && (
                  <p className="text-xs text-[#D65B56] flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{repoError}</span>
                  </p>
                )}
              </div>

              {/* Existing Repositories List */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#9BA095] uppercase tracking-wider">
                  Available Repositories ({repositories.length})
                </div>

                {isLoadingRepos ? (
                  <div className="py-8 text-center font-mono text-xs text-[#777D71]">
                    Loading repositories...
                  </div>
                ) : repositories.length === 0 ? (
                  <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-6 text-center text-xs text-[#9BA095]">
                    No repositories indexed yet. Enter a public repo above to index.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {repositories.map((repo) => {
                      const isSelected =
                        state.selectedRepository?.name === repo.name;
                      return (
                        <div
                          key={repo.id}
                          onClick={() =>
                            updateState({
                              selectedRepository: {
                                id: repo.id,
                                name: repo.name,
                                owner: repo.owner,
                                defaultBranch: repo.defaultBranch || "main",
                                isPublic: true,
                              },
                            })
                          }
                          className={`rounded-xs border p-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#C6F36B] bg-[#C6F36B]/10 text-[#F5F5F0]"
                              : "border-[#3A4037] bg-[#171916] hover:border-[#575E54] text-[#9BA095]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#F5F5F0]">
                              {repo.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-[#C6F36B]" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#777D71] mt-1 flex items-center gap-2">
                            <span>branch: {repo.defaultBranch || "main"}</span>
                            <span>•</span>
                            <span>{repo.fileCount || 0} files</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: USE CASES */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  How will you use BugBunny?
                </h2>
                <p className="text-sm text-[#9BA095]">
                  Select the primary capabilities you want BugBunny to prioritize for your team.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: "Investigating GitHub issues",
                    desc: "Analyze bug descriptions, stack traces, and reproduction logs.",
                  },
                  {
                    title: "Finding root causes of bugs",
                    desc: "Trace execution paths and identify exact offending code lines.",
                  },
                  {
                    title: "Generating code fixes",
                    desc: "Synthesize surgical, minimal unified git diffs targeting bugs.",
                  },
                  {
                    title: "Automated regression testing",
                    desc: "Formulate test assertions to verify patches prevent recurrence.",
                  },
                  {
                    title: "Security & OWASP audits",
                    desc: "Verify patches do not introduce vulnerability regressions.",
                  },
                  {
                    title: "Documentation & release notes",
                    desc: "Summarize engineering solutions with pull request explanations.",
                  },
                ].map((item) => {
                  const isChecked = state.useCases.includes(item.title);
                  return (
                    <div
                      key={item.title}
                      onClick={() => toggleUseCase(item.title)}
                      className={`rounded-xs border p-4 cursor-pointer transition-all ${
                        isChecked
                          ? "border-[#C6F36B] bg-[#C6F36B]/10 text-[#F5F5F0]"
                          : "border-[#3A4037] bg-[#171916] hover:border-[#575E54] text-[#9BA095]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[#F5F5F0]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#9BA095] leading-relaxed">
                            {item.desc}
                          </div>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-2xs border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "border-[#C6F36B] bg-[#C6F36B] text-[#171916]"
                              : "border-[#575E54]"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: CONFIGURE AGENTS */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Configure Autonomous Engineering Agents
                </h2>
                <p className="text-sm text-[#9BA095]">
                  BugBunny deploys 6 specialized AI agents across the investigation lifecycle.
                </p>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {[
                  {
                    id: "requirementsAnalyst" as const,
                    name: "01. Requirements Analyst",
                    desc: "Extracts problem statements, stack traces, and reproduction steps into formal specifications.",
                  },
                  {
                    id: "codebaseInvestigator" as const,
                    name: "02. Codebase Investigator",
                    desc: "Parses symbol graphs, AST trees, and imports in read-only sandbox containment.",
                  },
                  {
                    id: "solutionPlanner" as const,
                    name: "03. Solution Planner",
                    desc: "Designs surgical fix blueprints, evaluates blast radius, and drafts regression criteria.",
                  },
                  {
                    id: "patchEngineer" as const,
                    name: "04. Patch Engineer",
                    desc: "Synthesizes minimal unified git diffs targeting isolated root causes.",
                  },
                  {
                    id: "testRunner" as const,
                    name: "05. Test Runner",
                    desc: "Synthesizes pytest/unit assertions and verifies patches pass without regressions.",
                  },
                  {
                    id: "codeReviewer" as const,
                    name: "06. Code Reviewer & Docs Agent",
                    desc: "Conducts OWASP security verification and drafts implementation documentation.",
                  },
                ].map((ag) => {
                  const isEnabled = state.enabledAgents[ag.id];
                  return (
                    <div
                      key={ag.id}
                      onClick={() => toggleAgent(ag.id)}
                      className="flex items-center justify-between rounded-xs border border-[#3A4037] bg-[#171916] p-3 hover:border-[#575E54] transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="text-xs font-bold text-[#F5F5F0] font-mono">
                          {ag.name}
                        </div>
                        <div className="text-[11px] text-[#9BA095] truncate">
                          {ag.desc}
                        </div>
                      </div>
                      <div
                        className={`h-5 w-9 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                          isEnabled ? "bg-[#C6F36B]" : "bg-[#3A4037]"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-[#171916] transition-transform ${
                            isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: AUTONOMY PREFERENCES */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Autonomy & Human Control
                </h2>
                <p className="text-sm text-[#9BA095]">
                  Choose how much autonomy BugBunny should exercise during investigation.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    level: "human_approved" as const,
                    badge: "RECOMMENDED",
                    title: "Human-Approved Proposals",
                    desc: "BugBunny executes all 6 stages (requirements → investigation → diff → tests) and halts at an approval gate. No code is modified without your authorization.",
                  },
                  {
                    level: "investigation_only" as const,
                    badge: "DIAGNOSTIC",
                    title: "Investigation & Diagnosis Only",
                    desc: "BugBunny investigates issues, identifies offending lines, and computes blast radius, but leaves patch synthesis to human developers.",
                  },
                  {
                    level: "assisted_engineering" as const,
                    badge: "INTERACTIVE",
                    title: "Assisted Engineering Checkpoints",
                    desc: "Step-by-step checkpoints requiring human confirmation between the planning, patching, and testing stages.",
                  },
                ].map((opt) => {
                  const isSelected = state.autonomyLevel === opt.level;
                  return (
                    <div
                      key={opt.level}
                      onClick={() => updateState({ autonomyLevel: opt.level })}
                      className={`rounded-xs border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#C6F36B] bg-[#C6F36B]/10 text-[#F5F5F0]"
                          : "border-[#3A4037] bg-[#171916] hover:border-[#575E54] text-[#9BA095]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F5F5F0]">
                            {opt.title}
                          </span>
                          <span className="font-mono text-[9px] bg-[#292D27] text-[#C6F36B] px-1.5 py-0.5 rounded-2xs border border-[#3A4037]">
                            {opt.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-[#C6F36B]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#9BA095] leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: WORKSPACE PREFERENCES */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Workspace Preferences
                </h2>
                <p className="text-sm text-[#9BA095]">
                  Fine-tune default branches and testing rules for investigations.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-4 space-y-2">
                  <label className="block text-xs font-mono text-[#9BA095]">
                    Default Branch Target
                  </label>
                  <input
                    type="text"
                    value={state.workspacePreferences.defaultBranch}
                    onChange={(e) =>
                      updateState({
                        workspacePreferences: {
                          ...state.workspacePreferences,
                          defaultBranch: e.target.value,
                        },
                      })
                    }
                    placeholder="main"
                    className="w-full rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2 text-xs text-[#F5F5F0] placeholder-[#575E54] focus:border-[#C6F36B] focus:outline-none"
                  />
                </div>

                <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F0]">
                        Enforce Regression Tests
                      </div>
                      <div className="text-[11px] text-[#9BA095]">
                        Require test assertions to pass before allowing patch approval.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.workspacePreferences.enforceRegressionTests}
                      onChange={(e) =>
                        updateState({
                          workspacePreferences: {
                            ...state.workspacePreferences,
                            enforceRegressionTests: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 accent-[#C6F36B]"
                    />
                  </div>
                </div>

                <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F0]">
                        Completion Notifications
                      </div>
                      <div className="text-[11px] text-[#9BA095]">
                        Alert when all 6 agents finish and an issue awaits approval.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.workspacePreferences.notifyOnCompletion}
                      onChange={(e) =>
                        updateState({
                          workspacePreferences: {
                            ...state.workspacePreferences,
                            notifyOnCompletion: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 accent-[#C6F36B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: WORKSPACE READY */}
          {currentStep === 8 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xs bg-[#C6F36B]/20 border border-[#AEE64E] text-[#C6F36B]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
                  Your Engineering Workspace is Ready
                </h2>
                <p className="text-sm text-[#9BA095] max-w-md mx-auto">
                  BugBunny is configured and ready to investigate issues, analyze repository ASTs, and prepare verified solutions.
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-5 text-left font-mono text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-[#2B3128] pb-2">
                  <span className="text-[#777D71]">Target Repository:</span>
                  <span className="text-[#C6F36B] font-bold">
                    {state.selectedRepository?.name || "psf/requests"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#2B3128] pb-2">
                  <span className="text-[#777D71]">Active Agents:</span>
                  <span className="text-[#F5F5F0]">
                    {Object.values(state.enabledAgents).filter(Boolean).length}/6 Active
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#2B3128] pb-2">
                  <span className="text-[#777D71]">Autonomy Level:</span>
                  <span className="text-[#F5F5F0] capitalize">
                    {state.autonomyLevel.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#777D71]">Sandbox Guard:</span>
                  <span className="text-[#35A56A] font-bold">STRICT READ-ONLY</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full max-w-md mx-auto flex items-center justify-center gap-2 rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] text-sm font-bold py-3.5 px-6 border border-[#AEE64E] shadow-lg transition-all active:translate-y-px cursor-pointer"
              >
                <span>Enter My Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Action Bar (Back / Continue) */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-[#3A4037]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1.5 text-xs font-mono text-[#9BA095] hover:text-[#F5F5F0] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] text-xs font-bold py-2 px-5 border border-[#AEE64E] transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </main>

      {/* Safety Footer */}
      <footer className="border-t border-[#3A4037] bg-[#141613] py-3 text-center text-xs font-mono text-[#777D71]">
        <span>BugBunny proposes changes. Your repository stays under your control.</span>
      </footer>
    </div>
  );
}
