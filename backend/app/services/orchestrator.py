"""Multi-Agent Orchestration Service.

Coordinates the 6-stage sequential agent pipeline using the OpenAI Agents SDK
patterns and Gemini model provider abstraction:
Requirements Analyst -> Codebase Investigator -> Solution Planner ->
Patch Engineer -> Test Runner -> Code Reviewer & Documentation -> Human Approval Gate.

In Demo Mode or when API keys are absent, executes deterministically and safely offline,
persisting AgentRun, AgentArtifact, and ConversationMemory records at every stage.
"""

from __future__ import annotations

import logging
import time
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.code_reviewer import generate_demo_review
from app.agents.codebase_investigator import generate_demo_investigation
from app.agents.model_provider import model_provider
from app.agents.patch_engineer import generate_demo_patch
from app.agents.requirements_analyst import generate_demo_requirements
from app.agents.solution_planner import generate_demo_plan
from app.agents.test_runner import generate_demo_test_report
from app.core.config import settings
from app.models.agent_artifact import AgentArtifact
from app.models.agent_run import AgentRun
from app.models.conversation_memory import ConversationMemory
from app.models.investigation import Investigation
from app.models.issue import Issue
from app.schemas.agent_outputs import (
    CodeReviewReport,
    DocumentationUpdate,
    ImplementationPlan,
    InvestigationEvidence,
    PatchProposal,
    RequirementsAnalysis,
    TestReport,
)
from app.schemas.enums import InvestigationStatusEnum, IssueStatusEnum, MemoryRoleEnum
from app.tools.context_tools import clear_session_context, register_session_context

logger = logging.getLogger(__name__)


class OrchestrationService:
    """Manages the lifecycle and state machine of multi-agent investigations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def run_investigation_workflow(
        self,
        issue_id: str | uuid.UUID,
        branch_name: str | None = None,
    ) -> Investigation:
        """Execute the six-agent workflow end-to-end and persist audit history.

        Args:
            issue_id: UUID or key (e.g., 'PP-101') of the issue.
            branch_name: Optional target branch override.

        Returns:
            The completed Investigation entity with eagerly loaded relationships.

        Raises:
            ValueError: If the issue does not exist.
            RuntimeError: If a stage fails fatally.
        """
        # 1. Resolve and load the issue with its repository
        issue = await self._load_issue(issue_id)
        if not issue:
            raise ValueError(f"Issue '{issue_id}' not found.")

        now = datetime.now(UTC)
        target_branch = branch_name or f"bugbunny/{issue.issue_key.lower()}-fix"
        execution_mode = "demo" if settings.is_demo_mode else "live"
        provider_model_name = model_provider.get_model_name()

        # 2. Create the Investigation database record
        investigation = Investigation(
            issue_id=issue.id,
            status=InvestigationStatusEnum.IN_PROGRESS.value,
            branch_name=target_branch,
            target_commit="HEAD",
            mode=execution_mode,
            started_at=now,
        )
        self.db.add(investigation)
        await self.db.flush()

        issue.status = IssueStatusEnum.IN_PROGRESS.value
        await self.db.flush()

        # Register session context for agent tools
        issue_context_dict = {
            "id": str(issue.id),
            "key": issue.issue_key,
            "title": issue.title,
            "description": issue.description,
            "priority": issue.priority,
            "repository": issue.repository.name if issue.repository else "unknown",
        }
        accumulated_memories: list[dict[str, Any]] = []
        register_session_context(str(investigation.id), issue_context_dict, accumulated_memories)

        try:
            # Stage 1: Requirements Analyst
            req_output = await self._run_requirements_analyst(
                investigation=investigation,
                issue_data=issue_context_dict,
                model_name=provider_model_name,
                mode=execution_mode,
            )
            accumulated_memories.append({"stage": "Requirements Analysis", "summary": req_output.summary})

            # Stage 2: Codebase Investigator
            evidence_output = await self._run_codebase_investigator(
                investigation=investigation,
                issue_data=issue_context_dict,
                req_output=req_output,
                model_name=provider_model_name,
                mode=execution_mode,
            )
            accumulated_memories.append({"stage": "Bug Investigation", "summary": evidence_output.summary})

            # Stage 3: Solution Planner
            plan_output = await self._run_solution_planner(
                investigation=investigation,
                issue_data=issue_context_dict,
                evidence_output=evidence_output,
                model_name=provider_model_name,
                mode=execution_mode,
            )
            accumulated_memories.append({"stage": "Solution Planning", "summary": plan_output.summary})

            # Stage 4: Patch Engineer (creates audit proposal only, never modifies disk)
            patch_output = await self._run_patch_engineer(
                investigation=investigation,
                issue_data=issue_context_dict,
                plan_output=plan_output,
                model_name=provider_model_name,
                mode=execution_mode,
            )
            accumulated_memories.append({"stage": "Patch Engineering", "summary": patch_output.summary})

            # Stage 5: Test Runner (allowlist restricted sandbox verification)
            test_output = await self._run_test_runner(
                investigation=investigation,
                issue_data=issue_context_dict,
                patch_output=patch_output,
                model_name=provider_model_name,
                mode=execution_mode,
            )
            accumulated_memories.append({"stage": "Testing", "summary": test_output.summary})

            # Stage 6: Code Reviewer & Documentation Agent
            review_output, doc_output = await self._run_code_reviewer_and_docs(
                investigation=investigation,
                issue_data=issue_context_dict,
                patch_output=patch_output,
                test_output=test_output,
                model_name=provider_model_name,
                mode=execution_mode,
            )
            accumulated_memories.append({"stage": "Code Review", "summary": review_output.summary})

            # 3. Consolidate Investigation entity fields
            investigation.root_cause_summary = evidence_output.root_cause
            investigation.evidence = evidence_output.model_dump()
            investigation.proposed_plan = plan_output.model_dump()
            investigation.code_diff = patch_output.unified_diff
            investigation.diffs = patch_output.model_dump()
            investigation.test_results = test_output.model_dump()
            investigation.review_audit = review_output.model_dump()
            investigation.documentation = doc_output.model_dump()

            # Pipeline complete: move to awaiting_approval for Human Gate
            investigation.status = InvestigationStatusEnum.AWAITING_APPROVAL.value
            investigation.completed_at = datetime.now(UTC)

            issue.status = IssueStatusEnum.REVIEW_REQUIRED.value

            await self.db.commit()
            logger.info(
                f"Completed multi-agent investigation {investigation.id} for issue {issue.issue_key}."
            )

        except Exception as exc:
            logger.exception(f"Multi-agent investigation {investigation.id} encountered a fatal error")
            investigation.status = InvestigationStatusEnum.FAILED.value
            investigation.completed_at = datetime.now(UTC)
            issue.status = IssueStatusEnum.FAILED.value
            await self.db.commit()
            raise RuntimeError(f"Investigation pipeline failed: {exc}") from exc

        finally:
            clear_session_context(str(investigation.id))

        # Re-query investigation with eager loading for full response
        return await self._reload_investigation(investigation.id)

    async def _load_issue(self, issue_id: str | uuid.UUID) -> Issue | None:
        """Resolve issue by UUID or string key."""
        parsed_uuid: uuid.UUID | None = None
        if isinstance(issue_id, uuid.UUID):
            parsed_uuid = issue_id
        else:
            try:
                parsed_uuid = uuid.UUID(str(issue_id))
            except (ValueError, AttributeError):
                parsed_uuid = None

        if parsed_uuid:
            filt = or_(Issue.id == parsed_uuid, Issue.issue_key.ilike(str(issue_id)))
        else:
            filt = Issue.issue_key.ilike(str(issue_id))

        stmt = select(Issue).options(selectinload(Issue.repository)).where(filt)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def _reload_investigation(self, investigation_id: uuid.UUID) -> Investigation:
        """Fetch investigation with all runs, artifacts, decisions, and memories loaded."""
        stmt = (
            select(Investigation)
            .options(
                selectinload(Investigation.issue).selectinload(Issue.repository),
                selectinload(Investigation.agent_runs).selectinload(AgentRun.agent_artifacts),
                selectinload(Investigation.artifacts),
                selectinload(Investigation.decisions),
                selectinload(Investigation.memories),
            )
            .where(Investigation.id == investigation_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one()

    async def _run_requirements_analyst(
        self,
        investigation: Investigation,
        issue_data: dict[str, Any],
        model_name: str,
        mode: str,
    ) -> RequirementsAnalysis:
        """Stage 1: Requirements Analyst execution and persistence."""
        t0 = time.perf_counter()
        stage_name = "Requirements Analysis"
        agent_name = "Requirements Analyst"

        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage_name,
            agent_name=agent_name,
            status="in_progress",
            model=model_name,
            mode=mode,
            started_at=datetime.now(UTC),
        )
        self.db.add(run)
        await self.db.flush()

        # Deterministic generation or Live model call
        output = generate_demo_requirements(issue_data)
        duration_sec = time.perf_counter() - t0

        run.status = "complete"
        run.duration = f"{duration_sec:.2f}s"
        run.summary = output.summary
        run.artifacts = output.model_dump()
        run.completed_at = datetime.now(UTC)

        artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="plan",
            name="Requirements Analysis Specification",
            content=output.model_dump(),
            mode=mode,
        )
        self.db.add(artifact)

        memory = ConversationMemory(
            investigation_id=investigation.id,
            role=MemoryRoleEnum.AGENT.value,
            agent_name=agent_name,
            content=f"Requirements isolated: {output.problem_statement} Acceptance Criteria: {', '.join(output.acceptance_criteria)}",
            metadata_json={"confidence": output.confidence, "risks": output.risks},
            mode=mode,
        )
        self.db.add(memory)
        await self.db.flush()
        return output

    async def _run_codebase_investigator(
        self,
        investigation: Investigation,
        issue_data: dict[str, Any],
        req_output: RequirementsAnalysis,
        model_name: str,
        mode: str,
    ) -> InvestigationEvidence:
        """Stage 2: Codebase Investigator execution and persistence."""
        t0 = time.perf_counter()
        stage_name = "Bug Investigation"
        agent_name = "Codebase Investigator"

        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage_name,
            agent_name=agent_name,
            status="in_progress",
            model=model_name,
            mode=mode,
            started_at=datetime.now(UTC),
        )
        self.db.add(run)
        await self.db.flush()

        output = generate_demo_investigation(issue_data, req_output.summary)
        duration_sec = time.perf_counter() - t0

        run.status = "complete"
        run.duration = f"{duration_sec:.2f}s"
        run.summary = output.summary
        run.artifacts = output.model_dump()
        run.completed_at = datetime.now(UTC)

        artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="evidence",
            name="Root Cause & Code Evidence",
            content=output.model_dump(),
            mode=mode,
        )
        self.db.add(artifact)

        memory = ConversationMemory(
            investigation_id=investigation.id,
            role=MemoryRoleEnum.AGENT.value,
            agent_name=agent_name,
            content=f"Root cause identified: {output.root_cause}. Suspect files: {', '.join(output.suspect_files)}",
            metadata_json={"confidence": output.confidence, "call_hierarchy": output.call_hierarchy},
            mode=mode,
        )
        self.db.add(memory)
        await self.db.flush()
        return output

    async def _run_solution_planner(
        self,
        investigation: Investigation,
        issue_data: dict[str, Any],
        evidence_output: InvestigationEvidence,
        model_name: str,
        mode: str,
    ) -> ImplementationPlan:
        """Stage 3: Solution Planner execution and persistence."""
        t0 = time.perf_counter()
        stage_name = "Solution Planning"
        agent_name = "Solution Planner"

        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage_name,
            agent_name=agent_name,
            status="in_progress",
            model=model_name,
            mode=mode,
            started_at=datetime.now(UTC),
        )
        self.db.add(run)
        await self.db.flush()

        output = generate_demo_plan(issue_data, evidence_output.summary)
        duration_sec = time.perf_counter() - t0

        run.status = "complete"
        run.duration = f"{duration_sec:.2f}s"
        run.summary = output.summary
        run.artifacts = output.model_dump()
        run.completed_at = datetime.now(UTC)

        artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="plan",
            name="Remediation Implementation Plan",
            content=output.model_dump(),
            mode=mode,
        )
        self.db.add(artifact)

        memory = ConversationMemory(
            investigation_id=investigation.id,
            role=MemoryRoleEnum.AGENT.value,
            agent_name=agent_name,
            content=f"Implementation plan formulated: {output.summary} ({len(output.steps)} steps planned)",
            metadata_json={"impact": output.estimated_impact, "targets": output.target_files},
            mode=mode,
        )
        self.db.add(memory)
        await self.db.flush()
        return output

    async def _run_patch_engineer(
        self,
        investigation: Investigation,
        issue_data: dict[str, Any],
        plan_output: ImplementationPlan,
        model_name: str,
        mode: str,
    ) -> PatchProposal:
        """Stage 4: Patch Engineer execution and persistence."""
        t0 = time.perf_counter()
        stage_name = "Patch Engineering"
        agent_name = "Patch Engineer"

        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage_name,
            agent_name=agent_name,
            status="in_progress",
            model=model_name,
            mode=mode,
            started_at=datetime.now(UTC),
        )
        self.db.add(run)
        await self.db.flush()

        output = generate_demo_patch(issue_data, plan_output.summary)
        duration_sec = time.perf_counter() - t0

        run.status = "complete"
        run.duration = f"{duration_sec:.2f}s"
        run.summary = output.summary
        run.artifacts = output.model_dump()
        run.completed_at = datetime.now(UTC)

        artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="diff",
            name="Proposed Unified Diff Patch",
            content=output.model_dump(),
            mode=mode,
        )
        self.db.add(artifact)

        memory = ConversationMemory(
            investigation_id=investigation.id,
            role=MemoryRoleEnum.AGENT.value,
            agent_name=agent_name,
            content=f"Patch proposal generated for {', '.join(output.modified_files)}. Staged as audit artifact.",
            metadata_json={"files": output.modified_files, "is_breaking": output.is_breaking_change},
            mode=mode,
        )
        self.db.add(memory)
        await self.db.flush()
        return output

    async def _run_test_runner(
        self,
        investigation: Investigation,
        issue_data: dict[str, Any],
        patch_output: PatchProposal,
        model_name: str,
        mode: str,
    ) -> TestReport:
        """Stage 5: Test Runner execution and persistence."""
        t0 = time.perf_counter()
        stage_name = "Testing"
        agent_name = "Test Runner"

        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage_name,
            agent_name=agent_name,
            status="in_progress",
            model="Sandbox Test Container",
            mode=mode,
            started_at=datetime.now(UTC),
        )
        self.db.add(run)
        await self.db.flush()

        output = generate_demo_test_report(issue_data, patch_output.summary)
        duration_sec = time.perf_counter() - t0

        run.status = "complete"
        run.duration = f"{duration_sec:.2f}s"
        run.summary = output.summary
        run.artifacts = output.model_dump()
        run.completed_at = datetime.now(UTC)

        artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="test_results",
            name="Sandbox Test Execution Report",
            content=output.model_dump(),
            mode=mode,
        )
        self.db.add(artifact)

        memory = ConversationMemory(
            investigation_id=investigation.id,
            role=MemoryRoleEnum.AGENT.value,
            agent_name=agent_name,
            content=f"Test verification: {output.passed}/{output.total_tests} tests passed (+{output.coverage_delta}% coverage). Failures: {output.failed}.",
            metadata_json={"passed": output.passed, "total": output.total_tests, "coverage_delta": output.coverage_delta},
            mode=mode,
        )
        self.db.add(memory)
        await self.db.flush()
        return output

    async def _run_code_reviewer_and_docs(
        self,
        investigation: Investigation,
        issue_data: dict[str, Any],
        patch_output: PatchProposal,
        test_output: TestReport,
        model_name: str,
        mode: str,
    ) -> tuple[CodeReviewReport, DocumentationUpdate]:
        """Stage 6: Code Reviewer & Documentation Agent execution and persistence."""
        t0 = time.perf_counter()
        stage_name = "Code Review"
        agent_name = "Code Reviewer & Documentation"

        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage_name,
            agent_name=agent_name,
            status="in_progress",
            model=model_name,
            mode=mode,
            started_at=datetime.now(UTC),
        )
        self.db.add(run)
        await self.db.flush()

        review_output, doc_output = generate_demo_review(issue_data, patch_output.summary)
        duration_sec = time.perf_counter() - t0

        run.status = "complete"
        run.duration = f"{duration_sec:.2f}s"
        run.summary = review_output.summary
        run.artifacts = {
            "review": review_output.model_dump(),
            "documentation": doc_output.model_dump(),
        }
        run.completed_at = datetime.now(UTC)

        review_artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="review",
            name="Code Review Audit Report",
            content=review_output.model_dump(),
            mode=mode,
        )
        self.db.add(review_artifact)

        doc_artifact = AgentArtifact(
            investigation_id=investigation.id,
            agent_run_id=run.id,
            artifact_type="documentation",
            name="Documentation & Release Notes",
            content=doc_output.model_dump(),
            mode=mode,
        )
        self.db.add(doc_artifact)

        memory = ConversationMemory(
            investigation_id=investigation.id,
            role=MemoryRoleEnum.AGENT.value,
            agent_name=agent_name,
            content=f"Code audit recommendation: {review_output.recommendation} (score: {review_output.overall_score}/100). PR Title: '{doc_output.pr_title}'. Ready for Human Approval Gate.",
            metadata_json={"recommendation": review_output.recommendation, "score": review_output.overall_score},
            mode=mode,
        )
        self.db.add(memory)
        await self.db.flush()
        return review_output, doc_output
