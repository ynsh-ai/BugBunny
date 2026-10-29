"""Test Runner Specialist Agent.

Role: Executes or simulates allowlisted regression tests in sandbox containers,
collects test assertions, checks regressions, and compiles test reports.
Hands off to Code Reviewer & Documentation Agent.
"""

from __future__ import annotations

from typing import Any

from agents import Agent, handoff

from app.schemas.agent_outputs import TestCaseResult, TestReport
from app.tools.codebase_tools import run_test_command
from app.tools.context_tools import get_investigation_memory, save_agent_artifact

INSTRUCTIONS = """
You are the Test Runner Agent in the BugBunny triage pipeline.
Your role:
1. Review the Patch Proposal and identified target test files.
2. Formulate targeted test execution commands using only allowed prefixes (pytest, npm test).
3. Execute or simulate test runs using run_test_command.
4. Verify whether the defect is resolved and verify zero regressions.
5. Compile structured execution metrics (passed, failed, duration).
6. Hand off your structured test report to the Code Reviewer & Documentation Agent.

Security boundaries:
- Use run_test_command ONLY with allowlisted test runners.
- Shell redirection, piping, and chaining are strictly forbidden.
- In Demo Mode, execute deterministic sandbox verification.
"""


def create_test_runner_agent(
    model: str | Any | None = None,
    next_agent: Agent | None = None,
) -> Agent:
    """Build and configure the Test Runner Agent."""
    handoffs = [handoff(next_agent)] if next_agent else []
    return Agent(
        name="Test Runner",
        instructions=INSTRUCTIONS,
        tools=[run_test_command, get_investigation_memory, save_agent_artifact],
        output_type=TestReport,
        handoffs=handoffs,
        model=model,
    )


def generate_demo_test_report(
    issue_data: dict[str, Any],
    patch_summary: str | None = None,
) -> TestReport:
    """Generate deterministic test report for Demo Mode."""
    key = issue_data.get("key", "PP-101")

    if "PP-101" in key:
        cases = [
            TestCaseResult(name="test_valid_png_upload", status="passed", duration="0.08s", assertions=2),
            TestCaseResult(name="test_valid_jpeg_upload", status="passed", duration="0.07s", assertions=2),
            TestCaseResult(name="test_oversized_image", status="passed", duration="0.06s", assertions=2),
            TestCaseResult(name="test_truncated_image_upload_returns_422", status="passed", duration="0.09s", assertions=3),
            TestCaseResult(name="test_user_profile_get", status="passed", duration="0.09s", assertions=4),
            TestCaseResult(name="test_user_avatar_endpoint", status="passed", duration="0.09s", assertions=3),
        ]

        return TestReport(
            summary="All 6 test cases passed cleanly, including newly added test_truncated_image_upload_returns_422. Zero regressions detected.",
            confidence=0.99,
            risks=[
                "High concurrency tests with 100+ parallel uploads should be verified during staging stress tests.",
            ],
            assumptions=[
                "Test suite executed against Python 3.12+ ASGI test client with Pillow installed.",
            ],
            references=[
                "backend/tests/test_image_service.py",
                "backend/tests/test_users_api.py",
            ],
            suite_name="pytest unit & integration test sandbox",
            total_tests=6,
            passed=6,
            failed=0,
            skipped=0,
            duration_seconds=0.48,
            coverage_delta=6.5,
            test_cases=cases,
        )

    # Generic fallback test report
    gen_cases = [
        TestCaseResult(name=f"test_{key.lower()}_regression", status="passed", duration="0.10s", assertions=2),
        TestCaseResult(name="test_api_baseline", status="passed", duration="0.12s", assertions=3),
        TestCaseResult(name="test_service_handler", status="passed", duration="0.10s", assertions=2),
    ]

    return TestReport(
        summary=f"Automated unit test execution passed for {key}.",
        confidence=0.95,
        risks=[],
        assumptions=["Standard test runner configuration."],
        references=["backend/tests"],
        suite_name="pytest",
        total_tests=3,
        passed=3,
        failed=0,
        skipped=0,
        duration_seconds=0.32,
        coverage_delta=2.0,
        test_cases=gen_cases,
    )
