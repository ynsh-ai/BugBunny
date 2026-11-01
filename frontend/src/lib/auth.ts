"use client";

export interface StoredUser {
  email: string;
  name: string;
  provider?: "email" | "github" | "gitlab" | "google";
  authenticatedAt: string;
}

export interface OnboardingState {
  currentStep: number;
  isCompleted: boolean;
  githubConnected: boolean;
  githubAccount?: {
    username: string;
    avatarUrl?: string;
    isReadOnly: boolean;
  };
  selectedRepository?: {
    id?: string;
    name: string;
    owner: string;
    defaultBranch: string;
    isPublic: boolean;
    language?: string;
  };
  useCases: string[];
  enabledAgents: {
    requirementsAnalyst: boolean;
    codebaseInvestigator: boolean;
    solutionPlanner: boolean;
    patchEngineer: boolean;
    testRunner: boolean;
    codeReviewer: boolean;
  };
  autonomyLevel: "investigation_only" | "human_approved" | "assisted_engineering";
  workspacePreferences: {
    defaultBranch: string;
    workflowExecution: "full_pipeline" | "phased";
    notifyOnCompletion: boolean;
    enforceRegressionTests: boolean;
  };
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  currentStep: 1,
  isCompleted: false,
  githubConnected: false,
  useCases: [
    "Investigating GitHub issues",
    "Finding root causes of bugs",
    "Generating code fixes",
  ],
  enabledAgents: {
    requirementsAnalyst: true,
    codebaseInvestigator: true,
    solutionPlanner: true,
    patchEngineer: true,
    testRunner: true,
    codeReviewer: true,
  },
  autonomyLevel: "human_approved",
  workspacePreferences: {
    defaultBranch: "main",
    workflowExecution: "full_pipeline",
    notifyOnCompletion: true,
    enforceRegressionTests: true,
  },
};

const USER_STORAGE_KEY = "bugbunny_user";
const ONBOARDING_STORAGE_KEY = "bugbunny_onboarding";

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}

export function getOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_STATE;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_ONBOARDING_STATE;
    return { ...DEFAULT_ONBOARDING_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_STATE;
  try {
    const current = getOnboardingState();
    const updated = { ...current, ...state };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    return updated;
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function isOnboardingComplete(): boolean {
  return getOnboardingState().isCompleted;
}

export function completeOnboarding(): void {
  saveOnboardingState({ isCompleted: true, currentStep: 8 });
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}
