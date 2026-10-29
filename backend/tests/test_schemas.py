"""Unit tests for Milestone 2 Structured Agent Output Schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.agent_outputs import (
    CodeReviewReport,
    DocumentationUpdate,
    EvidenceDetail,
    FinalInvestigationSummary,
    ImplementationPlan,
    InvestigationEvidence,
    PatchProposal,
    PlanStep,
    RequirementsAnalysis,
    ReviewCheckItem,
    TestCaseResult,
    TestReport,
)


def test_requirements_analysis_schema_valid():
    """Verify RequirementsAnalysis schema passes with valid payload."""
    payload = {
        "summary": "Avatar upload crashes on truncated PNG",
        "confidence": 0.95,
        "risks": ["Possible retry storms"],
        "assumptions": ["FastAPI default multipart parsing"],
        "references": ["backend/app/services/image_service.py"],
        "issue_key": "PP-101",
        "problem_statement": "PIL raises UnidentifiedImageError",
        "symptom_description": "HTTP 500 returned to user",
        "reproduction_steps": ["POST truncated PNG buffer"],
        "acceptance_criteria": ["Return HTTP 422 on invalid buffer"],
        "affected_components": ["image_service.py"],
        "severity_assessment": "high",
    }
    obj = RequirementsAnalysis.model_validate(payload)
    assert obj.issue_key == "PP-101"
    assert obj.confidence == 0.95
    assert len(obj.acceptance_criteria) == 1


def test_requirements_analysis_missing_field():
    """Verify validation error when required field is missing."""
    with pytest.raises(ValidationError):
        RequirementsAnalysis.model_validate(
            {
                "summary": "Incomplete payload",
                "confidence": 0.9,
            }
        )


def test_investigation_evidence_schema():
    """Verify InvestigationEvidence schema and nested EvidenceDetail validation."""
    ev = EvidenceDetail(
        id="ev-1",
        type="stack_trace",
        title="UnidentifiedImageError trace",
        description="Stack trace observed in error log",
        snippet="Traceback: PIL.UnidentifiedImageError",
    )
    payload = {
        "summary": "Root cause isolated in stream validation",
        "confidence": 0.97,
        "risks": [],
        "assumptions": [],
        "references": ["backend/app/services/image_service.py"],
        "root_cause": "Narrow OSError catch block in verify_stream()",
        "evidence_items": [ev.model_dump()],
        "suspect_files": ["backend/app/services/image_service.py"],
        "call_hierarchy": ["update_avatar", "verify_stream"],
        "reproduction_command": "pytest tests/test_image_service.py",
    }
    obj = InvestigationEvidence.model_validate(payload)
    assert obj.root_cause.startswith("Narrow OSError")
    assert len(obj.evidence_items) == 1
    assert obj.evidence_items[0].id == "ev-1"


def test_implementation_plan_schema():
    """Verify ImplementationPlan schema and PlanStep items."""
    step = PlanStep(
        stepNumber=1,
        title="Catch UnidentifiedImageError",
        description="Expand exception tuple",
        riskLevel="Low",
        estimatedImpact="Zero regression risk",
        files=["backend/app/services/image_service.py"],
    )
    payload = {
        "summary": "Three-step surgical remediation",
        "confidence": 0.98,
        "risks": [],
        "assumptions": [],
        "references": [],
        "steps": [step.model_dump()],
        "target_files": ["backend/app/services/image_service.py"],
        "rollback_strategy": "git revert",
        "estimated_impact": "Resolves 500 errors on corrupted uploads",
    }
    obj = ImplementationPlan.model_validate(payload)
    assert len(obj.steps) == 1
    assert obj.steps[0].stepNumber == 1


def test_patch_proposal_schema():
    """Verify PatchProposal schema formatting and backward compatibility flag."""
    payload = {
        "summary": "Catch unhandled image decoding errors",
        "confidence": 0.98,
        "risks": [],
        "assumptions": [],
        "references": [],
        "unified_diff": "--- a/file.py\n+++ b/file.py\n@@ -1,1 +1,2 @@\n-old\n+new\n",
        "modified_files": ["file.py"],
        "change_rationale": "Gracefully handle truncated uploads",
        "is_breaking_change": False,
        "backward_compatible": True,
    }
    obj = PatchProposal.model_validate(payload)
    assert obj.is_breaking_change is False
    assert obj.backward_compatible is True
    assert "+++ b/file.py" in obj.unified_diff


def test_test_report_schema():
    """Verify TestReport schema and TestCaseResult validation."""
    tc = TestCaseResult(
        name="test_truncated_image",
        status="passed",
        duration="0.05s",
        assertions=2,
    )
    payload = {
        "summary": "All 6 tests passed cleanly",
        "confidence": 0.99,
        "risks": [],
        "assumptions": [],
        "references": [],
        "suite_name": "pytest unit suite",
        "total_tests": 6,
        "passed": 6,
        "failed": 0,
        "skipped": 0,
        "duration_seconds": 0.45,
        "coverage_delta": 4.2,
        "test_cases": [tc.model_dump()],
    }
    obj = TestReport.model_validate(payload)
    assert obj.passed == 6
    assert obj.failed == 0
    assert obj.coverage_delta == 4.2


def test_code_review_report_schema():
    """Verify CodeReviewReport schema with itemized ReviewCheckItem checks."""
    chk = ReviewCheckItem(
        category="Security",
        description="Safe path traversal constraints enforced",
        status="pass",
    )
    payload = {
        "summary": "Production ready patch",
        "confidence": 0.96,
        "risks": [],
        "assumptions": [],
        "references": [],
        "overall_score": 95,
        "recommendation": "Approve",
        "checks": [chk.model_dump()],
        "security_audit": "Clean: no credential leak or unvalidated path access",
        "performance_audit": "Clean: constant-time stream verification",
    }
    obj = CodeReviewReport.model_validate(payload)
    assert obj.overall_score == 95
    assert obj.recommendation == "Approve"


def test_documentation_update_schema():
    """Verify DocumentationUpdate schema."""
    payload = {
        "summary": "Document HTTP 422 avatar upload response",
        "confidence": 0.99,
        "risks": [],
        "assumptions": [],
        "references": [],
        "pr_title": "fix(users): return 422 on corrupted image upload",
        "pr_body": "Resolves PP-101 by translating unhandled exceptions to HTTP 422.",
        "branch_name": "bugbunny/pp-101-fix",
        "target_branch": "main",
        "changelog_entry": "Return HTTP 422 on corrupted avatar uploads",
        "release_notes": "Hardened avatar upload endpoint against corrupted streams",
        "affected_components": ["backend/app/services/image_service.py"],
    }
    obj = DocumentationUpdate.model_validate(payload)
    assert obj.target_branch == "main"
    assert "PP-101" in obj.pr_body


def test_final_investigation_summary_schema():
    """Verify FinalInvestigationSummary schema."""
    payload = {
        "summary": "Investigation complete. Ready for human gate.",
        "confidence": 0.98,
        "risks": [],
        "assumptions": [],
        "references": [],
        "issue_key": "PP-101",
        "status": "awaiting_approval",
        "root_cause_summary": "Uncaught UnidentifiedImageError",
        "branch_name": "bugbunny/pp-101-fix",
        "target_commit": "HEAD",
        "total_stages_completed": 6,
        "requires_human_approval": True,
        "recommended_action": "Review patch and approve for export",
    }
    obj = FinalInvestigationSummary.model_validate(payload)
    assert obj.requires_human_approval is True
    assert obj.total_stages_completed == 6
