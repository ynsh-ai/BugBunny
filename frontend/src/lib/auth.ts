"use client";

export interface StoredUser {
  email: string;
  name: string;
  provider?: "email" | "github" | "gitlab" | "google";
  authenticatedAt: string;
}

export interface DeveloperProfile {
  role: string;
  usageType: "individual" | "team" | "";
  intendedUse: string;
}

export type GitHubConnectionStatus = "disconnected" | "pending" | "connected";

export interface OnboardingState {
  currentStep: number;
  isCompleted: boolean;
  developerProfile: DeveloperProfile;
  /**
   * Backend-confirmed GitHub OAuth connection flag.
   * Must remain false unless confirmed by a real backend authorization check.
   */
  githubConnected: boolean;
  githubConnectionStatus: GitHubConnectionStatus;
  githubSkipped: boolean;
  repositorySkipped: boolean;
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
    visibility?: "public" | "private" | "unknown";
    isPublic?: boolean;
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

export const TOTAL_ONBOARDING_STEPS = 4;

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  currentStep: 1,
  isCompleted: false,
  developerProfile: {
    role: "",
    usageType: "",
    intendedUse: "",
  },
  githubConnected: false,
  githubConnectionStatus: "disconnected",
  githubSkipped: false,
  repositorySkipped: false,
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
const ONBOARDING_STORAGE_KEY_PREFIX = "bugbunny_onboarding";

function getAccountScopeId(user: StoredUser | null): string {
  if (!user) return "anonymous";
  const provider = (user.provider || "email").trim().toLowerCase();
  const email = user.email.trim().toLowerCase();
  return `${provider}:${email}`;
}

export function getOnboardingStorageKey(user?: StoredUser | null): string {
  const activeUser = user === undefined ? getStoredUser() : user;
  return `${ONBOARDING_STORAGE_KEY_PREFIX}:${encodeURIComponent(
    getAccountScopeId(activeUser)
  )}`;
}

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
  const activeUser = getStoredUser();
  if (!activeUser) return DEFAULT_ONBOARDING_STATE;

  try {
    const raw = localStorage.getItem(getOnboardingStorageKey(activeUser));
    if (!raw) return DEFAULT_ONBOARDING_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    const rawStep = typeof parsed.currentStep === "number" ? parsed.currentStep : 1;
    const clampedStep = Math.min(Math.max(rawStep, 1), TOTAL_ONBOARDING_STEPS);
    return {
      ...DEFAULT_ONBOARDING_STATE,
      ...parsed,
      currentStep: clampedStep,
      developerProfile: {
        ...DEFAULT_ONBOARDING_STATE.developerProfile,
        ...(parsed.developerProfile || {}),
      },
      // Never trust a stale local githubConnected flag without backend confirmation
      githubConnected: Boolean(parsed.githubConnected && parsed.githubConnectionStatus === "connected"),
    };
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_STATE;
  const activeUser = getStoredUser();
  try {
    const current = getOnboardingState();
    const updated: OnboardingState = {
      ...current,
      ...state,
      currentStep: Math.min(
        Math.max(state.currentStep ?? current.currentStep, 1),
        TOTAL_ONBOARDING_STEPS
      ),
      developerProfile: {
        ...current.developerProfile,
        ...(state.developerProfile || {}),
      },
    };
    localStorage.setItem(getOnboardingStorageKey(activeUser), JSON.stringify(updated));
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
  saveOnboardingState({ isCompleted: true, currentStep: TOTAL_ONBOARDING_STEPS });
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getOnboardingStorageKey());
    localStorage.removeItem(ONBOARDING_STORAGE_KEY_PREFIX);
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}

