import {
  AgentStage,
  ApprovalDecisionItem,
  DiffFile,
  DocumentationData,
  EvidenceItem,
  InvestigationDetail,
  InvestigationItem,
  IssueDetail,
  IssueStatus,
  PlanStep,
  RepositoryItem,
  ReviewData,
  SystemMode,
  TestResultData,
  TimelineStep,
  WorkspaceSummary,
} from "@/mock/types";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
  decisions?: ApprovalDecisionItem[];
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

interface ParsedInvestigationArtifacts {
  timeline: TimelineStep[];
  evidence: EvidenceItem[];
  proposedPlan: PlanStep[];
  diffs: DiffFile[];
  testResults: TestResultData | null;
  review: ReviewData | null;
  documentation: DocumentationData | null;
}

function parseInvestigationArtifacts(params: {
  rawTimeline?: RawTimelineItem[];
  rawEvidence?: unknown;
  rawPlan?: unknown;
  rawDiffs?: unknown;
  rawCodeDiff?: string;
  rawTest?: unknown;
  rawReview?: unknown;
  rawDoc?: unknown;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackBranch?: string;
}): ParsedInvestigationArtifacts {
  const timeline: TimelineStep[] = (params.rawTimeline || []).map((t) => ({
    stage: t.stage as AgentStage,
    agentName: t.agentName || t.agent_name || "SpecialistAgent",
    status: t.status,
    duration: t.duration || "",
    model: t.model || "",
    summary: t.summary || "",
  }));

  let evidence: EvidenceItem[] = [];
  if (Array.isArray(params.rawEvidence)) {
    evidence = params.rawEvidence as EvidenceItem[];
  } else if (params.rawEvidence && typeof params.rawEvidence === "object") {
    const evObj = params.rawEvidence as Record<string, unknown>;
    const snippets = (evObj.code_snippets as Array<Record<string, string>>) || [];
    evidence = snippets.map((snip, idx) => ({
      id: `ev-${idx + 1}`,
      type: "code_reference",
      title: snip.file || "Code excerpt",
      location: `${snip.file || "file"}#L${snip.lines || "1"}`,
      snippet: snip.snippet || "",
      description: String(evObj.root_cause || evObj.summary || "Isolated code evidence"),
    }));
  }

  let proposedPlan: PlanStep[] = [];
  if (Array.isArray(params.rawPlan)) {
    proposedPlan = params.rawPlan as PlanStep[];
  } else if (params.rawPlan && typeof params.rawPlan === "object") {
    const planObj = params.rawPlan as Record<string, unknown>;
    const rawSteps = (planObj.steps as string[]) || [];
    const targets = (planObj.target_files as string[]) || [];
    proposedPlan = rawSteps.map((stepText, idx) => ({
      stepNumber: idx + 1,
      title: stepText.slice(0, 48),
      description: stepText,
      targetFile: targets[idx % targets.length] || "remediated_file.py",
      action: "modify",
      risk: (planObj.estimated_complexity as "low" | "medium" | "high") || "low",
      status: "proposed",
    }));
  }

  let diffs: DiffFile[] = [];
  if (Array.isArray(params.rawDiffs) && params.rawDiffs.length > 0) {
    diffs = params.rawDiffs as DiffFile[];
  } else if (params.rawDiffs && typeof params.rawDiffs === "object") {
    const patchObj = params.rawDiffs as Record<string, unknown>;
    const diffStr = (patchObj.diff_content as string) || params.rawCodeDiff || "";
    const filesChanged = (patchObj.files_changed as string[]) || ["patch.diff"];
    if (diffStr.trim().length > 0) {
      diffs = [
        {
          filename: filesChanged[0] || "patch.diff",
          oldPath: `a/${filesChanged[0] || "patch.diff"}`,
          newPath: `b/${filesChanged[0] || "patch.diff"}`,
          additions: Number(patchObj.additions || 0),
          deletions: Number(patchObj.deletions || 0),
          lines: diffStr.split("\n").map((line) => {
            if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
              return { type: "header", content: line };
            }
            if (line.startsWith("+")) return { type: "addition", content: line.slice(1) };
            if (line.startsWith("-")) return { type: "deletion", content: line.slice(1) };
            return { type: "context", content: line };
          }),
        },
      ];
    }
  } else if (params.rawCodeDiff && params.rawCodeDiff.trim().length > 0) {
    diffs = [
      {
        filename: "patch.diff",
        oldPath: "a/patch.diff",
        newPath: "b/patch.diff",
        additions: 0,
        deletions: 0,
        lines: params.rawCodeDiff.split("\n").map((line) => {
          if (line.startsWith("+")) return { type: "addition", content: line.slice(1) };
          if (line.startsWith("-")) return { type: "deletion", content: line.slice(1) };
          return { type: "context", content: line };
        }),
      },
    ];
  }

  let testResults: TestResultData | null = null;
  if (params.rawTest && typeof params.rawTest === "object") {
    const tObj = params.rawTest as Record<string, unknown>;
    const passed = Number(tObj.passed || tObj.tests_run || 0);
    const total = Number(tObj.tests_run || passed);
    testResults = {
      suiteName: String(tObj.framework || "Test Runner"),
      totalTests: total,
      passed,
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

  let review: ReviewData | null = null;
  if (params.rawReview && typeof params.rawReview === "object") {
    const rObj = params.rawReview as Record<string, unknown>;
    review = {
      reviewerName: "Code Reviewer Agent",
      overallScore: Math.round(Number(rObj.code_quality_score || 0) * 10),
      recommendation: rObj.verdict === "approved" ? "Approve" : "Request Changes",
      checks: (rObj.checks as ReviewData["checks"]) || [],
      automatedSummary: String(rObj.summary || ""),
    };
  }

  let documentation: DocumentationData | null = null;
  if (params.rawDoc && typeof params.rawDoc === "object") {
    const dObj = params.rawDoc as Record<string, unknown>;
    documentation = {
      prTitle: String(dObj.pr_title || params.fallbackTitle || ""),
      branchName: params.fallbackBranch || "",
      targetBranch: "main",
      prBody: String(dObj.pr_description || params.fallbackDescription || ""),
      changelogEntry: String(dObj.changelog_entry || ""),
      releaseNotes: String(dObj.changelog_entry || ""),
      affectedComponents: (dObj.affected_docs as string[]) || [],
    };
  }

  return { timeline, evidence, proposedPlan, diffs, testResults, review, documentation };
}

export function mapBackendInvestigationToDetail(inv: RawInvestigation): InvestigationDetail {
  const parsed = parseInvestigationArtifacts({
    rawTimeline: inv.agent_runs,
    rawEvidence: inv.evidence,
    rawPlan: inv.proposed_plan,
    rawDiffs: inv.diffs,
    rawCodeDiff: inv.code_diff,
    rawTest: inv.test_results,
    rawReview: inv.review_audit,
    rawDoc: inv.documentation,
    fallbackTitle: inv.issue_key ? `Fix for ${inv.issue_key}` : "Proposed Fix",
    fallbackBranch: inv.branch_name,
  });

  return {
    id: inv.id,
    issueId: inv.issue_id || "",
    issueKey: inv.issue_key,
    repositoryName: inv.repository_name,
    status: inv.status,
    mode: inv.mode || "demo",
    branchName: inv.branch_name,
    targetCommit: inv.target_commit,
    startedAt: inv.started_at || "",
    completedAt: inv.completed_at,
    rootCauseSummary: inv.root_cause_summary || "",
    timeline: parsed.timeline,
    evidence: parsed.evidence,
    proposedPlan: parsed.proposedPlan,
    diffs: parsed.diffs,
    testResults: parsed.testResults,
    review: parsed.review,
    documentation: parsed.documentation,
    artifacts: inv.artifacts || [],
    decisions: inv.decisions || [],
  };
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

  const parsed = parseInvestigationArtifacts({
    rawTimeline,
    rawEvidence: item.evidence || latestInv?.evidence,
    rawPlan: item.proposed_plan || latestInv?.proposed_plan,
    rawDiffs: item.diffs || latestInv?.diffs,
    rawCodeDiff: item.code_diff || latestInv?.code_diff,
    rawTest: item.test_results || latestInv?.test_results,
    rawReview: item.review_audit || latestInv?.review_audit,
    rawDoc: item.documentation || latestInv?.documentation,
    fallbackTitle: item.title,
    fallbackDescription: item.description,
    fallbackBranch: item.branch,
  });

  return {
    id: issueKey,
    title: item.title,
    repository: repoName || "unknown",
    status: (item.status as IssueStatus) || "Queued",
    priority: item.priority || "high",
    author: item.author || "developer",
    assignedAgent:
      item.assigned_agent ||
      (parsed.timeline[0] ? parsed.timeline[0].agentName : "BugBunny Orchestrator"),
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
    timeline: parsed.timeline,
    rootCauseSummary: item.root_cause_summary || latestInv?.root_cause_summary || "",
    evidence: parsed.evidence,
    proposedPlan: parsed.proposedPlan,
    diffs: parsed.diffs,
    testResults: parsed.testResults,
    review: parsed.review,
    documentation: parsed.documentation,
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
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

function safeDecodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function fetchRepositoryDetail(repoId: string): Promise<RepositoryItem | null> {
  const decodedId = safeDecodeParam(repoId).trim();
  if (!decodedId) {
    return null;
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/repositories`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch repository (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    return null;
  }

  const match = data.find(
    (r) =>
      String(r.id) === decodedId ||
      String(r.name).toLowerCase() === decodedId.toLowerCase()
  );

  if (!match) {
    return null;
  }

  let files = match.file_tree as Array<{ path: string; type: string; size?: number }> | undefined;
  if (!files || files.length === 0) {
    try {
      const filesRes = await fetch(
        `${baseUrl}/api/v1/repositories/${encodeURIComponent(String(match.id))}/files`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        if (Array.isArray(filesData?.files)) {
          files = filesData.files;
        }
      }
    } catch {
      // Non-fatal: file list may be empty or unavailable
    }
  }

  return {
    id: match.id,
    name: match.name,
    owner: match.owner,
    githubUrl: match.github_url,
    defaultBranch: match.default_branch,
    isActive: match.is_active,
    mode: match.mode,
    fileCount: match.file_count ?? (files ? files.length : 0),
    files,
    createdAt: match.created_at,
    updatedAt: match.updated_at,
  };
}

export async function fetchInvestigationDetail(
  investigationId: string
): Promise<InvestigationDetail | null> {
  const decodedId = safeDecodeParam(investigationId).trim();
  if (!decodedId) {
    return null;
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(
    `${baseUrl}/api/v1/investigations/${encodeURIComponent(decodedId)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch investigation (${res.status} ${res.statusText})`);
  }

  const data = (await res.json()) as RawInvestigation;
  return mapBackendInvestigationToDetail(data);
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
