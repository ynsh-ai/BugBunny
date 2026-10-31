import {
  AgentStage,
  DiffFile,
  DocumentationData,
  EvidenceItem,
  InvestigationItem,
  IssueDetail,
  IssueStatus,
  PlanStep,
  RepositoryItem,
  ReviewData,
  SystemMode,
  TestResultData,
  WorkspaceSummary,
} from "@/mock/types";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
}

export interface RawTimelineItem {
  stage: string;
  agentName?: string;
  agent_name?: string;
  status: "complete" | "in_progress" | "pending" | "failed";
  duration?: string;
  model?: string;
  summary?: string;
}

export interface RawInvestigation {
  id: string;
  issue_id?: string;
  issue_key?: string;
  repository_name?: string;
  status: string;
  root_cause_summary?: string;
  evidence?: unknown;
  proposed_plan?: unknown;
  code_diff?: string;
  diffs?: unknown;
  test_results?: unknown;
  review_audit?: unknown;
  documentation?: unknown;
  branch_name?: string;
  target_commit?: string;
  mode?: string;
  started_at?: string;
  completed_at?: string;
  artifacts?: Array<{
    id: string;
    name: string;
    artifact_type: string;
    content: unknown;
    created_at?: string;
  }>;
  agent_runs?: RawTimelineItem[];
}

export interface RawBackendIssue {
  id: string;
  issue_key?: string;
  title: string;
  repository_name?: string;
  repository?: { name?: string; github_url?: string } | string;
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
  evidence?: unknown;
  proposed_plan?: unknown;
  code_diff?: string;
  diffs?: unknown;
  test_results?: unknown;
  review_audit?: unknown;
  documentation?: unknown;
  description?: string;
  github_issue_number?: number;
  investigations?: RawInvestigation[];
  latest_investigation_id?: string;
  latest_investigation_status?: string;
}

export function mapBackendIssueToIssueDetail(item: RawBackendIssue): IssueDetail {
  const issueKey = item.issue_key || item.id;
  const repoName =
    item.repository_name ||
    (typeof item.repository === "object" && item.repository ? item.repository.name : null) ||
    (typeof item.repository === "string" ? item.repository : "unknown");

  // If item has nested investigations, pull latest
  const latestInv =
    item.investigations && item.investigations.length > 0
      ? item.investigations[item.investigations.length - 1]
      : null;

  const invId = latestInv?.id || item.latest_investigation_id;
  const invStatus = latestInv?.status || item.latest_investigation_status;

  // Real timeline from item or latest investigation agent_runs
  const rawTimeline =
    item.timeline && item.timeline.length > 0
      ? item.timeline
      : latestInv?.agent_runs || [];

  const timeline = rawTimeline.map((t) => ({
    stage: t.stage as AgentStage,
    agentName: t.agentName || t.agent_name || "SpecialistAgent",
    status: t.status,
    duration: t.duration || "",
    model: t.model || "",
    summary: t.summary || "",
  }));

  // Parse evidence only if returned by API
  let evidenceList: EvidenceItem[] = [];
  const rawEvidence = item.evidence || latestInv?.evidence;
  if (Array.isArray(rawEvidence)) {
    evidenceList = rawEvidence as EvidenceItem[];
  } else if (rawEvidence && typeof rawEvidence === "object") {
    const evObj = rawEvidence as Record<string, unknown>;
    const snippets = (evObj.code_snippets as Array<Record<string, string>>) || [];
    evidenceList = snippets.map((snip, idx) => ({
      id: `ev-${idx + 1}`,
      type: "code_reference",
      title: snip.file || "Code excerpt",
      location: `${snip.file || "file"}#L${snip.lines || "1"}`,
      snippet: snip.snippet || "",
      description: String(evObj.root_cause || evObj.summary || "Isolated code evidence"),
    }));
  }

  // Parse plan only if returned by API
  let planSteps: PlanStep[] = [];
  const rawPlan = item.proposed_plan || latestInv?.proposed_plan;
  if (Array.isArray(rawPlan)) {
    planSteps = rawPlan as PlanStep[];
  } else if (rawPlan && typeof rawPlan === "object") {
    const planObj = rawPlan as Record<string, unknown>;
    const rawSteps = (planObj.steps as string[]) || [];
    const targets = (planObj.target_files as string[]) || [];
    planSteps = rawSteps.map((stepText, idx) => ({
      stepNumber: idx + 1,
      title: stepText.slice(0, 48),
      description: stepText,
      targetFile: targets[idx % targets.length] || "remediated_file.py",
      action: "modify",
      risk: (planObj.estimated_complexity as "low" | "medium" | "high") || "low",
      status: "proposed",
    }));
  }

  // Parse diffs only if returned by API
  let diffFiles: DiffFile[] = [];
  const rawDiffs = item.diffs || latestInv?.diffs;
  if (Array.isArray(rawDiffs) && rawDiffs.length > 0) {
    diffFiles = rawDiffs as DiffFile[];
  } else if (rawDiffs && typeof rawDiffs === "object") {
    const patchObj = rawDiffs as Record<string, unknown>;
    const diffStr = (patchObj.diff_content as string) || item.code_diff || latestInv?.code_diff || "";
    const filesChanged = (patchObj.files_changed as string[]) || ["patch.diff"];
    if (diffStr.trim().length > 0) {
      diffFiles = [
        {
          filename: filesChanged[0] || "patch.diff",
          oldPath: `a/${filesChanged[0] || "patch.diff"}`,
          newPath: `b/${filesChanged[0] || "patch.diff"}`,
          additions: Number(patchObj.additions || 0),
          deletions: Number(patchObj.deletions || 0),
          lines: diffStr
            .split("\n")
            .map((line) => {
              if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
                return { type: "header", content: line };
              }
              if (line.startsWith("+")) {
                return { type: "addition", content: line.slice(1) };
              }
              if (line.startsWith("-")) {
                return { type: "deletion", content: line.slice(1) };
              }
              return { type: "context", content: line };
            }),
        },
      ];
    }
  } else if (item.code_diff || latestInv?.code_diff) {
    const rawCodeDiff = item.code_diff || latestInv?.code_diff || "";
    if (rawCodeDiff.trim().length > 0) {
      diffFiles = [
        {
          filename: "patch.diff",
          oldPath: "a/patch.diff",
          newPath: "b/patch.diff",
          additions: 0,
          deletions: 0,
          lines: rawCodeDiff.split("\n").map((line) => {
            if (line.startsWith("+")) return { type: "addition", content: line.slice(1) };
            if (line.startsWith("-")) return { type: "deletion", content: line.slice(1) };
            return { type: "context", content: line };
          }),
        },
      ];
    }
  }

  // Parse test results only if genuinely returned by API
  let testResults: TestResultData | null = null;
  const rawTest = item.test_results || latestInv?.test_results;
  if (rawTest && typeof rawTest === "object") {
    const tObj = rawTest as Record<string, unknown>;
    const passed = Number(tObj.passed || tObj.tests_run || 0);
    const total = Number(tObj.tests_run || passed);
    testResults = {
      suiteName: String(tObj.framework || "Test Runner"),
      totalTests: total,
      passed: passed,
      failed: Number(tObj.failed || 0),
      skipped: Number(tObj.skipped || 0),
      durationSeconds: Number(tObj.execution_duration_sec || 0),
      coverage: {
        before: 0,
        after: Number(tObj.coverage_percentage || 0),
        delta: 0,
      },
      testCases: (tObj.test_cases as TestResultData["testCases"]) || [],
    };
  }

  // Parse review only if genuinely returned by API
  let reviewData: ReviewData | null = null;
  const rawReview = item.review_audit || latestInv?.review_audit;
  if (rawReview && typeof rawReview === "object") {
    const rObj = rawReview as Record<string, unknown>;
    reviewData = {
      reviewerName: "Code Reviewer Agent",
      overallScore: Math.round(Number(rObj.code_quality_score || 0) * 10),
      recommendation: rObj.verdict === "approved" ? "Approve" : "Request Changes",
      checks: (rObj.checks as ReviewData["checks"]) || [],
      automatedSummary: String(rObj.summary || ""),
    };
  }

  // Parse documentation only if genuinely returned by API
  let docData: DocumentationData | null = null;
  const rawDoc = item.documentation || latestInv?.documentation;
  if (rawDoc && typeof rawDoc === "object") {
    const dObj = rawDoc as Record<string, unknown>;
    docData = {
      prTitle: String(dObj.pr_title || item.title),
      branchName: item.branch || "",
      targetBranch: "main",
      prBody: String(dObj.pr_description || item.description || ""),
      changelogEntry: String(dObj.changelog_entry || ""),
      releaseNotes: String(dObj.changelog_entry || ""),
      affectedComponents: (dObj.affected_docs as string[]) || [],
    };
  }

  return {
    id: issueKey,
    title: item.title,
    repository: repoName || "unknown",
    status: (item.status as IssueStatus) || "Queued",
    priority: item.priority || "high",
    author: item.author || "developer",
    assignedAgent:
      item.assigned_agent ||
      (timeline[0] ? timeline[0].agentName : "BugBunny Orchestrator"),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    branch: item.branch || (issueKey ? `bugbunny/${issueKey.toLowerCase()}-fix` : "bugbunny/fix"),
    targetCommit: item.target_commit || "HEAD",
    mode: item.mode || "demo",
    description: item.description || "",
    githubIssueNumber: item.github_issue_number,
    githubUrl:
      (typeof item.repository === "object" && item.repository && "github_url" in item.repository
        ? (item.repository as { github_url?: string }).github_url
        : undefined),
    timeline,
    rootCauseSummary: item.root_cause_summary || latestInv?.root_cause_summary || "",
    evidence: evidenceList,
    proposedPlan: planSteps,
    diffs: diffFiles,
    testResults,
    review: reviewData,
    documentation: docData,
    investigationId: invId,
    investigationStatus: invStatus,
    artifacts: latestInv?.artifacts || [],
  };
}

export async function fetchIssues(): Promise<IssueDetail[]> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/issues`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch issues: ${res.status}`);
    }

    const data = (await res.json()) as RawBackendIssue[];
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => mapBackendIssueToIssueDetail(item));
  } catch (err) {
    console.warn("fetchIssues error:", err);
    return [];
  }
}

export async function fetchIssueDetail(issueId: string): Promise<IssueDetail | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/issues/${encodeURIComponent(issueId)}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as RawBackendIssue;
    return mapBackendIssueToIssueDetail(data);
  } catch (err) {
    console.warn(`fetchIssueDetail error for ${issueId}:`, err);
    return null;
  }
}

export async function fetchWorkspaceSummary(): Promise<WorkspaceSummary> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/workspace/summary`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        repositories_count: 0,
        issues_count: 0,
        investigations_count: 0,
        awaiting_approval_count: 0,
      };
    }
    return (await res.json()) as WorkspaceSummary;
  } catch {
    return {
      repositories_count: 0,
      issues_count: 0,
      investigations_count: 0,
      awaiting_approval_count: 0,
    };
  }
}

export async function fetchRepositories(): Promise<RepositoryItem[]> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/repositories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      owner: r.owner,
      githubUrl: r.github_url,
      defaultBranch: r.default_branch,
      isActive: r.is_active,
      mode: r.mode,
      fileCount: r.file_count,
      files: r.file_tree,
    }));
  } catch {
    return [];
  }
}

export async function fetchInvestigations(): Promise<InvestigationItem[]> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/investigations`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((inv) => ({
      id: inv.id,
      issue_id: inv.issue_id,
      issue_key: inv.issue_key,
      title: inv.title || inv.issue_key || "Issue Investigation",
      repository_name: inv.repository_name,
      status: inv.status,
      current_stage:
        inv.agent_runs && inv.agent_runs.length > 0
          ? inv.agent_runs[inv.agent_runs.length - 1].stage
          : "Requirements analysis",
      root_cause_summary: inv.root_cause_summary,
      mode: inv.mode,
      branch_name: inv.branch_name,
      started_at: inv.started_at,
      completed_at: inv.completed_at,
    }));
  } catch {
    return [];
  }
}

export async function triggerInvestigation(issueId: string, mode?: string): Promise<IssueDetail | null> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/issues/${encodeURIComponent(issueId)}/investigations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(mode ? { mode } : {}),
  });

  if (!res.ok) {
    let errDetail = `${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        errDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errDetail);
  }

  return fetchIssueDetail(issueId);
}

export async function fetchSystemMode(): Promise<SystemMode> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/system/mode`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        mode: "demo",
        liveAvailable: false,
        provider: "gemini",
        model: "gemini-1.5-flash",
        message: "Fallback demo mode",
      };
    }

    const data = await res.json();
    return {
      mode: data.mode || "demo",
      liveAvailable: Boolean(data.live_available),
      provider: data.provider || "gemini",
      model: data.model || "gemini-1.5-flash",
      message: data.message || "",
    };
  } catch {
    return {
      mode: "demo",
      liveAvailable: false,
      provider: "gemini",
      model: "gemini-1.5-flash",
      message: "API offline or unreachable",
    };
  }
}

export async function importGitHubRepo(url: string): Promise<RepositoryItem> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/github/import-repository`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let errDetail = `Import failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        errDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errDetail);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    owner: data.owner,
    githubUrl: data.github_url,
    defaultBranch: data.default_branch,
    isActive: data.is_active,
    mode: data.mode || "connected_read_only",
    fileCount: data.file_count,
    files: data.file_tree,
  };
}

export async function importGitHubIssue(url: string): Promise<IssueDetail> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/github/import-issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let errDetail = `Import failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        errDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errDetail);
  }

  const data = await res.json();
  return mapBackendIssueToIssueDetail(data);
}

export async function submitApprovalDecision(
  investigationId: string,
  decision: string,
  reviewer: string,
  notes: string,
): Promise<Record<string, unknown>> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/investigations/${encodeURIComponent(investigationId)}/decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      decision,
      reviewer,
      notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit approval decision: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function resetDatabase(): Promise<{ message: string; deleted_issues: number; deleted_repositories: number }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/dev/reset`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to reset database: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}
