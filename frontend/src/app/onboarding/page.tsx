"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { BugBunnyLogo } from "@/components/BugBunnyLogo";
import { GitHubBrandIcon } from "@/components/AuthIcons";
import { fetchRepositories } from "@/lib/api";
import { RepositoryItem } from "@/mock/types";
import {
  completeOnboarding,
  DEFAULT_ONBOARDING_STATE,
  getOnboardingState,
  getStoredUser,
  OnboardingState,
  saveOnboardingState,
  StoredUser,
  TOTAL_ONBOARDING_STEPS,
} from "@/lib/auth";

const STEPS_LABELS = [
  "Welcome",
  "Developer Profile",
  "Connect GitHub",
  "Select Repository",
];

const ROLE_OPTIONS = [
  "Full-Stack Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "DevOps / SRE",
  "Engineering Manager",
  "Other",
];

const INTENDED_USE_OPTIONS = [
  "Investigating and understanding GitHub issues",
  "Root-cause analysis and codebase exploration",
  "Generating and reviewing fix proposals",
  "Triaging issues across team repositories",
];

interface ProfileErrors {
  role?: string;
  usageType?: string;
  intendedUse?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [storedUser, setStoredUserState] = useState<StoredUser | null>(null);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});

  // Authorized repositories state (only fetched when backend confirms GitHub connection)
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      setState(getOnboardingState());
      setStoredUserState(getStoredUser());
      setIsHydrated(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateState = useCallback((partial: Partial<OnboardingState>) => {
    const updated = saveOnboardingState(partial);
    setState(updated);
    return updated;
  }, []);

  const loadAuthorizedRepositories = useCallback(async () => {
    setIsLoadingRepos(true);
    setReposError(null);
    try {
      const data = await fetchRepositories();
      setRepositories(data);
    } catch (err: unknown) {
      setReposError(
        err instanceof Error
          ? err.message
          : "Failed to load authorized repositories."
      );
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  // Only load repositories on Step 4 if GitHub is backend-confirmed connected
  useEffect(() => {
    if (!isHydrated || state.currentStep !== 4 || !state.githubConnected) {
      return;
    }
    let isMounted = true;
    Promise.resolve()
      .then(() => {
        if (isMounted) {
          setIsLoadingRepos(true);
          setReposError(null);
        }
        return fetchRepositories();
      })
      .then((data) => {
        if (isMounted) {
          setRepositories(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setReposError(
            err instanceof Error
              ? err.message
              : "Failed to load authorized repositories."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRepos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isHydrated, state.currentStep, state.githubConnected]);

  const currentStep = state.currentStep;

  const validateProfile = (): boolean => {
    const errors: ProfileErrors = {};
    if (!state.developerProfile.role.trim()) {
      errors.role = "Please select your developer role.";
    }
    if (!state.developerProfile.usageType) {
      errors.usageType = "Please select individual or team usage.";
    }
    if (!state.developerProfile.intendedUse.trim()) {
      errors.intendedUse = "Please select how you intend to use BugBunny.";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (currentStep === 2 && !validateProfile()) {
      return;
    }
    if (currentStep < TOTAL_ONBOARDING_STEPS) {
      updateState({ currentStep: currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setProfileErrors({});
      updateState({ currentStep: currentStep - 1 });
    }
  };

  const handleConnectGitHub = () => {
    // Real GitHub OAuth is not yet wired in the backend; record pending state honestly
    // instead of simulating a connected account.
    updateState({
      githubConnected: false,
      githubConnectionStatus: "pending",
      githubSkipped: false,
    });
  };

  const handleSkipGitHub = () => {
    updateState({
      githubSkipped: true,
      currentStep: 4,
    });
  };

  const handleFinish = (skippedRepo = false) => {
    if (skippedRepo) {
      updateState({ repositorySkipped: true });
    }
    completeOnboarding();
    router.push("/dashboard");
  };

  const handleSelectRepository = (repo: RepositoryItem) => {
    updateState({
      repositorySkipped: false,
      selectedRepository: {
        id: repo.id,
        name: repo.name,
        owner: repo.owner,
        defaultBranch: repo.defaultBranch || "main",
        isPublic: true,
      },
    });
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#171916] text-[#F5F5F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-[#3A4037] border-t-[#C6F36B]" />
          <p className="font-mono text-xs text-[#9BA095]">
            Loading workspace setup...
          </p>
        </div>
      </div>
    );
  }

  const isGitHubLoginUser = storedUser?.provider === "github";
  const isGoogleOrEmailUser =
    !storedUser?.provider ||
    storedUser.provider === "google" ||
    storedUser.provider === "email" ||
    storedUser.provider === "gitlab";

  return (
    <div className="min-h-screen bg-[#171916] text-[#F5F5F0] flex flex-col justify-between">
      {/* Top Wizard Header */}
      <header className="border-b border-[#3A4037] bg-[#1F221E] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-[#292D27] border border-[#3A4037]">
              <BugBunnyLogo size={20} />
            </div>
            <span className="font-bold text-sm text-[#F5F5F0] tracking-tight">
              BugBunny
            </span>
          </Link>
          <span className="text-[#575E54]">/</span>
          <span className="font-mono text-xs text-[#9BA095] truncate">
            Onboarding
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#9BA095] shrink-0">
          <span>
            Step {currentStep} of {TOTAL_ONBOARDING_STEPS}:
          </span>
          <span className="text-[#C6F36B] font-semibold">
            {STEPS_LABELS[currentStep - 1]}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div
        className="w-full bg-[#292D27] h-1"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={TOTAL_ONBOARDING_STEPS}
        aria-label={`Onboarding step ${currentStep} of ${TOTAL_ONBOARDING_STEPS}`}
      >
        <div
          className="bg-[#C6F36B] h-1 transition-all duration-300"
          style={{ width: `${(currentStep / TOTAL_ONBOARDING_STEPS) * 100}%` }}
        />
      </div>

      {/* Main Wizard Card */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        {/* Step Pills */}
        <nav
          aria-label="Onboarding steps"
          className="grid grid-cols-4 gap-2 mb-5"
        >
          {STEPS_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isDone = stepNum < currentStep;
            return (
              <div
                key={label}
                className={`rounded-xs border px-2.5 py-1.5 text-[11px] font-mono truncate text-center ${
                  isActive
                    ? "border-[#C6F36B] bg-[#C6F36B]/15 text-[#C6F36B] font-semibold"
                    : isDone
                    ? "border-[#35A56A]/50 bg-[#35A56A]/10 text-[#35A56A]"
                    : "border-[#3A4037] bg-[#1F221E] text-[#777D71]"
                }`}
              >
                <span className="mr-1">{stepNum}.</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            );
          })}
        </nav>

        <div className="rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 sm:p-8 shadow-2xl">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-xs border border-[#AEE64E]/40 bg-[#C6F36B]/10 px-3 py-1 text-xs font-mono text-[#C6F36B]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>WELCOME TO BUGBUNNY</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
                  Investigate GitHub issues with clarity
                </h1>
                <p className="text-sm text-[#9BA095] leading-relaxed">
                  BugBunny helps developers investigate and understand GitHub
                  issues, trace root causes in the codebase, and review proposed
                  fixes before anything touches your repository.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#3A4037]">
                <div className="space-y-1.5 rounded-xs border border-[#3A4037] bg-[#171916] p-4">
                  <div className="font-mono text-xs text-[#C6F36B] font-bold">
                    01 / READ-ONLY
                  </div>
                  <h2 className="text-xs font-bold text-[#F5F5F0]">
                    Safe Inspection
                  </h2>
                  <p className="text-[11px] text-[#9BA095] leading-relaxed">
                    Repositories are inspected in read-only mode without mutating
                    your branches.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xs border border-[#3A4037] bg-[#171916] p-4">
                  <div className="font-mono text-xs text-[#C6F36B] font-bold">
                    02 / STRUCTURED
                  </div>
                  <h2 className="text-xs font-bold text-[#F5F5F0]">
                    Root Cause &amp; Plan
                  </h2>
                  <p className="text-[11px] text-[#9BA095] leading-relaxed">
                    Specialized agents gather evidence, propose a plan, and draft
                    minimal diffs.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xs border border-[#3A4037] bg-[#171916] p-4">
                  <div className="font-mono text-xs text-[#C6F36B] font-bold">
                    03 / HUMAN GATE
                  </div>
                  <h2 className="text-xs font-bold text-[#F5F5F0]">
                    You Stay in Control
                  </h2>
                  <p className="text-[11px] text-[#9BA095] leading-relaxed">
                    Every proposed change requires your explicit approval before
                    export.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DEVELOPER PROFILE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Tell us about your workflow
                </h1>
                <p className="text-sm text-[#9BA095]">
                  These preferences are saved locally for your workspace and can
                  be updated anytime.
                </p>
              </div>

              <div className="space-y-5">
                {/* Developer Role */}
                <div className="space-y-2">
                  <label
                    htmlFor="developer-role"
                    className="block text-xs font-mono text-[#F5F5F0]"
                  >
                    Developer role <span className="text-[#D65B56]">*</span>
                  </label>
                  <select
                    id="developer-role"
                    value={state.developerProfile.role}
                    onChange={(e) => {
                      setProfileErrors((prev) => ({ ...prev, role: undefined }));
                      updateState({
                        developerProfile: {
                          ...state.developerProfile,
                          role: e.target.value,
                        },
                      });
                    }}
                    aria-invalid={Boolean(profileErrors.role)}
                    className="w-full rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2.5 text-xs text-[#F5F5F0] focus:border-[#C6F36B] focus:outline-none"
                  >
                    <option value="">Select your role...</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {profileErrors.role && (
                    <p className="text-xs text-[#D65B56] flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{profileErrors.role}</span>
                    </p>
                  )}
                </div>

                {/* Individual or Team Usage */}
                <div className="space-y-2">
                  <span className="block text-xs font-mono text-[#F5F5F0]">
                    How are you using BugBunny?{" "}
                    <span className="text-[#D65B56]">*</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileErrors((prev) => ({
                          ...prev,
                          usageType: undefined,
                        }));
                        updateState({
                          developerProfile: {
                            ...state.developerProfile,
                            usageType: "individual",
                          },
                        });
                      }}
                      className={`flex items-start gap-3 rounded-xs border p-3.5 text-left transition-colors cursor-pointer ${
                        state.developerProfile.usageType === "individual"
                          ? "border-[#C6F36B] bg-[#C6F36B]/10 text-[#F5F5F0]"
                          : "border-[#3A4037] bg-[#171916] text-[#9BA095] hover:border-[#575E54]"
                      }`}
                    >
                      <User className="h-4 w-4 shrink-0 mt-0.5 text-[#C6F36B]" />
                      <div>
                        <div className="text-xs font-bold text-[#F5F5F0]">
                          Individual
                        </div>
                        <div className="text-[11px] text-[#9BA095]">
                          Personal projects and solo debugging
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileErrors((prev) => ({
                          ...prev,
                          usageType: undefined,
                        }));
                        updateState({
                          developerProfile: {
                            ...state.developerProfile,
                            usageType: "team",
                          },
                        });
                      }}
                      className={`flex items-start gap-3 rounded-xs border p-3.5 text-left transition-colors cursor-pointer ${
                        state.developerProfile.usageType === "team"
                          ? "border-[#C6F36B] bg-[#C6F36B]/10 text-[#F5F5F0]"
                          : "border-[#3A4037] bg-[#171916] text-[#9BA095] hover:border-[#575E54]"
                      }`}
                    >
                      <Users className="h-4 w-4 shrink-0 mt-0.5 text-[#C6F36B]" />
                      <div>
                        <div className="text-xs font-bold text-[#F5F5F0]">
                          Team
                        </div>
                        <div className="text-[11px] text-[#9BA095]">
                          Shared engineering repositories and triage
                        </div>
                      </div>
                    </button>
                  </div>
                  {profileErrors.usageType && (
                    <p className="text-xs text-[#D65B56] flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{profileErrors.usageType}</span>
                    </p>
                  )}
                </div>

                {/* Intended Use */}
                <div className="space-y-2">
                  <label
                    htmlFor="intended-use"
                    className="block text-xs font-mono text-[#F5F5F0]"
                  >
                    Primary goal with BugBunny{" "}
                    <span className="text-[#D65B56]">*</span>
                  </label>
                  <select
                    id="intended-use"
                    value={state.developerProfile.intendedUse}
                    onChange={(e) => {
                      setProfileErrors((prev) => ({
                        ...prev,
                        intendedUse: undefined,
                      }));
                      updateState({
                        developerProfile: {
                          ...state.developerProfile,
                          intendedUse: e.target.value,
                        },
                      });
                    }}
                    aria-invalid={Boolean(profileErrors.intendedUse)}
                    className="w-full rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2.5 text-xs text-[#F5F5F0] focus:border-[#C6F36B] focus:outline-none"
                  >
                    <option value="">Select your primary goal...</option>
                    {INTENDED_USE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {profileErrors.intendedUse && (
                    <p className="text-xs text-[#D65B56] flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{profileErrors.intendedUse}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONNECT GITHUB (OPTIONAL) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Connect GitHub (Optional)
                </h1>
                <p className="text-sm text-[#9BA095]">
                  GitHub authorization lets BugBunny discover repositories you
                  authorize and read their issues and source files for
                  investigation.
                </p>
              </div>

              {/* Account Provider Context */}
              {storedUser && (
                <div className="rounded-xs border border-[#3A4037] bg-[#171916] px-4 py-3 text-xs text-[#9BA095]">
                  {isGitHubLoginUser ? (
                    <span>
                      Signed in with GitHub as{" "}
                      <strong className="text-[#F5F5F0]">
                        {storedUser.name}
                      </strong>
                      . Repository access still requires backend OAuth grant
                      confirmation.
                    </span>
                  ) : isGoogleOrEmailUser ? (
                    <span>
                      Signed in as{" "}
                      <strong className="text-[#F5F5F0]">
                        {storedUser.email}
                      </strong>
                      . You can connect GitHub separately for repository access.
                    </span>
                  ) : null}
                </div>
              )}

              <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#222520] rounded-xs border border-[#3A4037]">
                      <GitHubBrandIcon className="h-6 w-6 text-[#F5F5F0]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F5F5F0]">
                        GitHub Repository Access
                      </div>
                      <div className="text-xs text-[#9BA095]">
                        Read-only access to authorized repositories and issues
                      </div>
                    </div>
                  </div>

                  {state.githubConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xs bg-[#35A56A]/20 border border-[#35A56A] px-2.5 py-1 text-xs font-mono text-[#35A56A] self-start sm:self-auto">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </span>
                  ) : state.githubConnectionStatus === "pending" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xs bg-[#D99A37]/15 border border-[#D99A37]/50 px-2.5 py-1 text-xs font-mono text-[#D99A37] self-start sm:self-auto">
                      <span>Pending Backend OAuth</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xs bg-[#292D27] border border-[#3A4037] px-2.5 py-1 text-xs font-mono text-[#9BA095] self-start sm:self-auto">
                      <span>Not Connected</span>
                    </span>
                  )}
                </div>

                {state.githubConnectionStatus === "pending" &&
                  !state.githubConnected && (
                    <div className="rounded-xs border border-[#D99A37]/40 bg-[#D99A37]/10 p-3.5 text-xs text-[#E8C587] space-y-1">
                      <div className="font-semibold">
                        GitHub OAuth integration is pending backend setup
                      </div>
                      <p className="text-[11px] text-[#9BA095]">
                        Backend OAuth endpoints are not yet configured, so
                        GitHub is not marked as connected. You can skip this
                        step and import public repositories or connect GitHub
                        later from Dashboard Settings.
                      </p>
                    </div>
                  )}

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2B3128]">
                  <button
                    type="button"
                    onClick={handleConnectGitHub}
                    className="inline-flex items-center gap-2 rounded-xs bg-[#292D27] hover:bg-[#323730] border border-[#3A4037] px-4 py-2 text-xs font-semibold text-[#F5F5F0] transition-colors cursor-pointer"
                  >
                    <GitHubBrandIcon className="h-4 w-4" />
                    <span>
                      {state.githubConnectionStatus === "pending"
                        ? "Check GitHub Connection"
                        : "Connect GitHub"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipGitHub}
                    className="text-xs font-mono text-[#9BA095] hover:text-[#F5F5F0] underline cursor-pointer"
                  >
                    Skip for now
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#35A56A]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Read-only sandbox policy: BugBunny never writes to your
                    repositories without approval.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT REPOSITORY (OPTIONAL) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F0]">
                  Select a Repository (Optional)
                </h1>
                <p className="text-sm text-[#9BA095]">
                  Choose an authorized repository to focus your workspace, or
                  skip and add repositories later from the dashboard.
                </p>
              </div>

              {!state.githubConnected ? (
                <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F5F5F0]">
                    <FolderGit2 className="h-4 w-4 text-[#9BA095]" />
                    <span>GitHub is not connected yet</span>
                  </div>
                  <p className="text-xs text-[#9BA095] leading-relaxed">
                    Authorized repositories can only be listed after GitHub
                    OAuth is confirmed by the backend. You can finish setup now
                    and add public repositories or connect GitHub later from the
                    dashboard and Settings.
                  </p>
                </div>
              ) : isLoadingRepos ? (
                <div className="py-10 text-center space-y-2">
                  <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-[#3A4037] border-t-[#C6F36B]" />
                  <p className="font-mono text-xs text-[#9BA095]">
                    Loading authorized repositories...
                  </p>
                </div>
              ) : reposError ? (
                <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-4 text-xs text-[#D65B56] flex items-center justify-between gap-3">
                  <span>{reposError}</span>
                  <button
                    type="button"
                    onClick={loadAuthorizedRepositories}
                    className="inline-flex items-center gap-1 font-mono underline text-[#F5F5F0] cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : repositories.length === 0 ? (
                <div className="rounded-xs border border-[#3A4037] bg-[#171916] p-6 text-center text-xs text-[#9BA095]">
                  No authorized repositories were returned. You can add
                  repositories later from the dashboard.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {repositories.map((repo) => {
                    const isSelected = state.selectedRepository?.id === repo.id;
                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => handleSelectRepository(repo)}
                        className={`rounded-xs border p-3.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#C6F36B] bg-[#C6F36B]/10 text-[#F5F5F0]"
                            : "border-[#3A4037] bg-[#171916] hover:border-[#575E54] text-[#9BA095]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#F5F5F0] truncate">
                            {repo.owner}/{repo.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-[#C6F36B] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#777D71] mt-1">
                          branch: {repo.defaultBranch || "main"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xs border border-[#3A4037] bg-[#171916] px-4 py-3 text-xs font-mono text-[#9BA095]">
                <span>
                  Profile:{" "}
                  <strong className="text-[#F5F5F0]">
                    {state.developerProfile.role || "Not set"}
                  </strong>{" "}
                  ({state.developerProfile.usageType || "unspecified"})
                </span>
                <span>
                  GitHub:{" "}
                  <strong className="text-[#F5F5F0]">
                    {state.githubConnected ? "Connected" : "Skipped / Pending"}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Action Bar (Back / Skip / Continue or Finish) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-8 border-t border-[#3A4037]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9BA095] hover:text-[#F5F5F0] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={handleSkipGitHub}
                  className="rounded-xs border border-[#3A4037] bg-[#171916] px-3.5 py-2 text-xs font-mono text-[#9BA095] hover:text-[#F5F5F0] hover:border-[#575E54] transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              )}

              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  className="rounded-xs border border-[#3A4037] bg-[#171916] px-3.5 py-2 text-xs font-mono text-[#9BA095] hover:text-[#F5F5F0] hover:border-[#575E54] transition-colors cursor-pointer"
                >
                  Skip &amp; Go to Dashboard
                </button>
              )}

              {currentStep < TOTAL_ONBOARDING_STEPS ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] text-xs font-bold py-2 px-5 border border-[#AEE64E] transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  className="inline-flex items-center gap-2 rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] text-xs font-bold py-2 px-5 border border-[#AEE64E] transition-all cursor-pointer"
                >
                  <span>Finish &amp; Go to Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Safety Footer */}
      <footer className="border-t border-[#3A4037] bg-[#141613] py-3 text-center text-xs font-mono text-[#777D71]">
        <span>
          BugBunny proposes changes. Your repository stays under your control.
        </span>
      </footer>
    </div>
  );
}
