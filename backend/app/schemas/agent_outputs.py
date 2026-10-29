"""Structured Pydantic Output Schemas for Multi-Agent Workflow Stages.

Every schema enforces a consistent contract with summary, confidence, risks,
assumptions, source/evidence references, and stage-specific fields.
"""


from pydantic import BaseModel, ConfigDict, Field


class BaseAgentOutput(BaseModel):
    """Base contract implemented by every specialist agent stage."""

    summary: str = Field(..., description="High-level executive summary of this stage's output")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for this stage output (0.0 to 1.0)",
    )
    risks: list[str] = Field(
        default_factory=list,
        description="Identified risks, caveats, or potential regressions",
    )
    assumptions: list[str] = Field(
        default_factory=list,
        description="Underlying assumptions made by the specialist agent",
    )
    references: list[str] = Field(
        default_factory=list,
        description="Source citations, log excerpts, or codebase file references",
    )

    model_config = ConfigDict(extra="ignore")


class RequirementsAnalysis(BaseAgentOutput):
    """Structured output for the Requirements Analyst Agent."""

    issue_key: str = Field(..., description="Identifier of the issue, e.g. PP-101")
    problem_statement: str = Field(..., description="Precise technical problem definition")
    symptom_description: str = Field(..., description="Observable error symptoms and impacts")
    reproduction_steps: list[str] = Field(
        default_factory=list,
        description="Deterministic steps to reproduce the issue",
    )
    acceptance_criteria: list[str] = Field(
        default_factory=list,
        description="Verifiable conditions required to resolve the bug",
    )
    affected_components: list[str] = Field(
        default_factory=list,
        description="Suspect subsystems, modules, or services",
    )
    severity_assessment: str = Field(default="high", description="Assessed severity level")


class EvidenceDetail(BaseModel):
    """Individual item of evidence isolated during codebase investigation."""

    id: str = Field(..., description="Evidence identifier (e.g. ev-1)")
    type: str = Field(..., description="Type of evidence: stack_trace, code_reference, log, etc.")
    title: str = Field(..., description="Descriptive headline of the finding")
    location: str | None = Field(default=None, description="Repository path or environment")
    timestamp: str | None = Field(default=None, description="Timestamp of observed event")
    description: str = Field(..., description="Detailed explanation of the evidence")
    snippet: str = Field(..., description="Code snippet or log trace")


class InvestigationEvidence(BaseAgentOutput):
    """Structured output for the Codebase Investigator Agent."""

    root_cause: str = Field(..., description="Pinpointed root cause mechanism")
    evidence_items: list[EvidenceDetail] = Field(
        default_factory=list,
        description="Collection of verifiable evidence items",
    )
    suspect_files: list[str] = Field(
        default_factory=list,
        description="Code files containing the bug or contributing anti-patterns",
    )
    call_hierarchy: list[str] = Field(
        default_factory=list,
        description="Traced call sequence leading to failure",
    )
    reproduction_command: str | None = Field(
        default=None,
        description="Specific command or test to trigger the error",
    )


class PlanStep(BaseModel):
    """Individual step within the atomic implementation plan."""

    stepNumber: int = Field(..., description="Step sequence number")
    title: str = Field(..., description="Step summary")
    description: str = Field(..., description="Technical implementation details")
    riskLevel: str = Field(default="Low", description="Risk level: Low, Medium, High")
    estimatedImpact: str = Field(..., description="Expected impact on system stability")
    files: list[str] = Field(default_factory=list, description="Target files modified in this step")


class ImplementationPlan(BaseAgentOutput):
    """Structured output for the Solution Planner Agent."""

    steps: list[PlanStep] = Field(
        default_factory=list,
        description="Ordered atomic remediation steps",
    )
    target_files: list[str] = Field(
        default_factory=list,
        description="All files slated for modification",
    )
    rollback_strategy: str = Field(
        ...,
        description="Safety rollback procedure if patch encounters anomalies",
    )
    estimated_impact: str = Field(
        ...,
        description="System-wide performance and behavioral implications",
    )


class PatchProposal(BaseAgentOutput):
    """Structured output for the Patch Engineer Agent."""

    unified_diff: str = Field(
        ...,
        description="Standard unified diff format patch (diff -u / git diff)",
    )
    modified_files: list[str] = Field(
        default_factory=list,
        description="List of files touched by this patch",
    )
    change_rationale: str = Field(
        ...,
        description="Explanation of why this minimal diff resolves the root cause",
    )
    is_breaking_change: bool = Field(
        default=False,
        description="Whether this patch introduces backwards incompatibility",
    )
    backward_compatible: bool = Field(
        default=True,
        description="Confirmation of API and contract backwards compatibility",
    )


class TestCaseResult(BaseModel):
    """Outcome of an individual test case execution."""

    __test__ = False

    name: str = Field(..., description="Test function or method name")
    status: str = Field(default="passed", description="Status: passed, failed, skipped")
    duration: str = Field(default="0.01s", description="Execution time")
    assertions: int = Field(default=1, description="Number of assertions verified")


class TestReport(BaseAgentOutput):
    """Structured output for the Test Runner Agent."""

    __test__ = False

    suite_name: str = Field(..., description="Name of test suite or harness")
    total_tests: int = Field(..., description="Total tests executed")
    passed: int = Field(..., description="Number of passing tests")
    failed: int = Field(default=0, description="Number of failing tests")
    skipped: int = Field(default=0, description="Number of skipped tests")
    duration_seconds: float = Field(..., description="Total suite duration in seconds")
    coverage_delta: float = Field(default=0.0, description="Code coverage delta percentage")
    test_cases: list[TestCaseResult] = Field(
        default_factory=list,
        description="Individual test outcomes",
    )


class ReviewCheckItem(BaseModel):
    """Individual security, performance, or correctness audit check."""

    category: str = Field(..., description="Audit category: Security, Performance, Concurrency, etc.")
    description: str = Field(..., description="Requirement evaluated")
    status: str = Field(default="pass", description="Status: pass, warn, fail")


class CodeReviewReport(BaseAgentOutput):
    """Structured output for the Code Reviewer stage."""

    overall_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Quality and safety audit score (0-100)",
    )
    recommendation: str = Field(
        default="Approve",
        description="Reviewer decision: Approve, Request Changes, or Comment",
    )
    checks: list[ReviewCheckItem] = Field(
        default_factory=list,
        description="Itemized verification checks",
    )
    security_audit: str = Field(..., description="OWASP and security boundary evaluation")
    performance_audit: str = Field(..., description="Latency and resource contention assessment")


class DocumentationUpdate(BaseAgentOutput):
    """Structured output for the Documentation stage."""

    pr_title: str = Field(..., description="Conventional Commit formatted PR title")
    pr_body: str = Field(..., description="Comprehensive Markdown pull request description")
    branch_name: str = Field(..., description="Proposed feature/fix Git branch")
    target_branch: str = Field(default="main", description="Target base branch")
    changelog_entry: str = Field(..., description="User-facing changelog line item")
    release_notes: str = Field(..., description="Executive release summary")
    affected_components: list[str] = Field(
        default_factory=list,
        description="Components and subsystems documented",
    )


class FinalInvestigationSummary(BaseAgentOutput):
    """High-level summary compiling all 6 pipeline stages before human approval."""

    issue_key: str = Field(..., description="Issue identifier")
    status: str = Field(default="awaiting_approval", description="Current pipeline status")
    root_cause_summary: str = Field(..., description="Consolidated root cause analysis")
    branch_name: str = Field(..., description="Working branch with generated patch proposal")
    target_commit: str = Field(..., description="Target commit SHA")
    total_stages_completed: int = Field(default=6, description="Number of successful stages")
    requires_human_approval: bool = Field(
        default=True,
        description="Safety flag mandating human sign-off before export/PR",
    )
    recommended_action: str = Field(
        default="Review patch diff and approve for export",
        description="Next operator action",
    )
