import {
  AgentStage,
  DiffFile,
  DocumentationData,
  EvidenceItem,
  IssueDetail,
  IssueStatus,
  PlanStep,
  ReviewData,
  TestResultData,
} from "@/mock/types";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

interface RawTimelineItem {
  stage: string;
  agentName?: string;
  agent_name?: string;
  status: "complete" | "in_progress" | "pending" | "failed";
  duration?: string;
  model?: string;
  summary?: string;
}

interface RawBackendIssue {
  id: string;
  issue_key?: string;
  title: string;
  repository_name?: string;
  repository?: { name?: string } | string;
  status: string;
  priority?: "critical" | "high" | "medium" | "low";
  author?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  branch?: string;
  target_commit?: string;
  mode?: string;
  timeline?: RawTimelineItem[];
  root_cause_summary?: string;
  evidence?: EvidenceItem[];
  proposed_plan?: PlanStep[];
  diffs?: DiffFile[];
  test_results?: TestResultData;
  review_audit?: ReviewData;
  documentation?: DocumentationData;
  description?: string;
}

export function mapBackendIssueToIssueDetail(item: RawBackendIssue): IssueDetail {
  const issueKey = item.issue_key || item.id;
  const repoName =
    item.repository_name ||
    (typeof item.repository === "object" && item.repository ? item.repository.name : null) ||
    (typeof item.repository === "string" ? item.repository : "unknown");

  const timeline = (item.timeline || []).map((t) => ({
    stage: t.stage as AgentStage,
    agentName: t.agentName || t.agent_name || "SpecialistAgent",
    status: t.status,
    duration: t.duration || "",
    model: t.model || "Gemini 1.5 Pro",
    summary: t.summary || "",
  }));

  return {
    id: issueKey,
    title: item.title,
    repository: repoName || "unknown",
    status: item.status as IssueStatus,
    priority: item.priority || "high",
    author: item.author || "developer",
    assignedAgent:
      item.assigned_agent ||
      (timeline[0] ? timeline[0].agentName : "BugBunny Orchestrator"),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    branch: item.branch || `bugbunny/${issueKey.toLowerCase()}-investigation`,
    targetCommit: item.target_commit || "HEAD",
    mode: item.mode || "demo",
    timeline,
    rootCauseSummary: item.root_cause_summary || "",
    evidence: item.evidence || [],
    proposedPlan: item.proposed_plan || [],
    diffs: item.diffs || [],
    testResults: item.test_results || {
      suiteName: "pytest",
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationSeconds: 0,
      coverage: { before: 0, after: 0, delta: 0 },
      testCases: [],
    },
    review: item.review_audit || {
      reviewerName: "CodeReviewerAgent",
      overallScore: 90,
      recommendation: "Approve",
      checks: [],
      automatedSummary: "Under automated review",
    },
    documentation: item.documentation || {
      prTitle: item.title,
      branchName: item.branch || "",
      targetBranch: "main",
      prBody: item.description || "",
      changelogEntry: "",
      releaseNotes: "",
      affectedComponents: [],
    },
  };
}

export async function fetchIssues(): Promise<IssueDetail[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/issues`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch issues from API: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RawBackendIssue[];
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format: expected array of issues");
  }

  return data.map((item) => mapBackendIssueToIssueDetail(item));
}

export async function fetchIssueDetail(issueId: string): Promise<IssueDetail> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/issues/${encodeURIComponent(issueId)}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch issue '${issueId}': ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RawBackendIssue;
  return mapBackendIssueToIssueDetail(data);
}

export async function seedDemoData(): Promise<Record<string, unknown>> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/dev/seed?reset=true`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to seed demo data: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as Record<string, unknown>;
}
