export type AgentStage =
  | "Requirements Analysis"
  | "Bug Investigation"
  | "Coding Assistant"
  | "Testing"
  | "Code Review"
  | "Documentation";

export type IssueStatus =
  | "Investigation complete"
  | "In progress"
  | "Review required"
  | "Testing"
  | "Queued"
  | "Failed"
  | "Approved"
  | "Rejected";

export interface TimelineStep {
  stage: AgentStage;
  agentName: string;
  status: "complete" | "in_progress" | "pending" | "failed";
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  model: string;
  summary: string;
}

export interface EvidenceItem {
  id: string;
  type: "stack_trace" | "log" | "test_output" | "code_reference";
  title: string;
  location?: string;
  timestamp?: string;
  snippet: string;
  description: string;
}

export interface PlanStep {
  stepNumber: number;
  title: string;
  description: string;
  targetFile: string;
  action: "modify" | "create" | "test";
  risk: "low" | "medium" | "high";
  status: "proposed" | "applied" | "verified";
}

export interface DiffLine {
  type: "addition" | "deletion" | "context" | "header";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffFile {
  filename: string;
  oldPath: string;
  newPath: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

export interface TestCase {
  id: string;
  name: string;
  file: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  isNewRegressionTest?: boolean;
}

export interface TestResultData {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationSeconds: number;
  coverage: {
    before: number;
    after: number;
    delta: number;
  };
  testCases: TestCase[];
}

export interface ReviewItem {
  category: "Security" | "Performance" | "Correctness" | "Maintainability";
  status: "pass" | "warn" | "fail";
  title: string;
  details: string;
}

export interface ReviewData {
  reviewerName: string;
  overallScore: number;
  recommendation: "Approve" | "Request Changes" | "Comment";
  checks: ReviewItem[];
  automatedSummary: string;
}

export interface DocumentationData {
  prTitle: string;
  branchName: string;
  targetBranch: string;
  prBody: string;
  changelogEntry: string;
  releaseNotes: string;
  affectedComponents: string[];
}

export interface IssueDetail {
  id: string; // e.g., "PP-101"
  title: string;
  repository: string;
  status: IssueStatus;
  priority: "critical" | "high" | "medium" | "low";
  author: string;
  assignedAgent: string;
  createdAt: string;
  updatedAt: string;
  branch: string;
  targetCommit: string;
  timeline: TimelineStep[];
  rootCauseSummary: string;
  evidence: EvidenceItem[];
  proposedPlan: PlanStep[];
  diffs: DiffFile[];
  testResults: TestResultData;
  review: ReviewData;
  documentation: DocumentationData;
}
