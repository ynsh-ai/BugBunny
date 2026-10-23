import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_run import AgentRun
from app.models.investigation import Investigation
from app.models.issue import GitHubIssue
from app.models.repository import Repository

logger = logging.getLogger("patchpilot.seeder")


async def seed_demo_data(session: AsyncSession) -> None:
    """Seeds the initial demo repository, issue PP-101, and associated investigation."""
    # Check if demo repo already exists
    repo_result = await session.execute(
        select(Repository).where(Repository.name == "demo-ecommerce-app")
    )
    repo = repo_result.scalar_one_or_none()

    if not repo:
        logger.info("Seeding demo repository: demo-ecommerce-app")
        repo = Repository(
            name="demo-ecommerce-app",
            owner="ynsh-ai",
            github_url="https://github.com/ynsh-ai/demo-ecommerce-app",
            default_branch="main",
            is_active=True,
        )
        session.add(repo)
        await session.flush()

    # Check if demo issue PP-101 exists
    issue_result = await session.execute(
        select(GitHubIssue).where(GitHubIssue.issue_key == "PP-101")
    )
    issue = issue_result.scalar_one_or_none()

    if not issue:
        logger.info("Seeding demo issue: PP-101")
        issue = GitHubIssue(
            issue_key="PP-101",
            repository_id=repo.id,
            github_issue_number=101,
            title="Profile update returns 500 error",
            description=(
                "Users encounter intermittent HTTP 500 Internal Server Errors when updating their profile "
                "avatar while actively refreshing authentication tokens."
            ),
            author="alex.chen@company.internal",
            status="completed",
            priority="high",
        )
        session.add(issue)
        await session.flush()

    # Check if demo investigation exists for PP-101
    inv_result = await session.execute(
        select(Investigation).where(Investigation.issue_id == issue.id)
    )
    investigation = inv_result.scalar_one_or_none()

    if not investigation:
        logger.info("Seeding initial investigation and agent runs for PP-101")
        now = datetime.now(UTC)
        investigation = Investigation(
            issue_id=issue.id,
            status="completed",
            root_cause_summary=(
                "A database transaction serialization deadlock occurs when updating user profiles "
                "concurrently with background token refresh workers. In services/user_service.py, "
                "the function update_user_profile() initiates an open transaction before performing "
                "an external network call to S3 for avatar storage. While the transaction remains uncommitted "
                "for ~320ms, an auth refresh worker attempts to update users.last_active_at without row-level locking. "
                "Under moderate concurrency, PostgreSQL detects circular wait locks (error code 40P01) "
                "and aborts the profile transaction, which the API controller catches as an unhandled generic exception "
                "and returns as HTTP 500."
            ),
            evidence=[
                {
                    "id": "ev-1",
                    "type": "stack_trace",
                    "title": "Production Sentry Exception Log",
                    "location": "demo-ecommerce-app / prod-us-east-1",
                    "description": "PostgreSQL 40P01 serialization failure detected inside update_user_profile.",
                    "snippet": (
                        "psycopg2.errors.DeadlockDetected: deadlock detected\n"
                        "DETAIL: Process 24102 waits for ShareLock on transaction 89104; blocked by process 24109.\n"
                        "Process 24109 waits for ExclusiveLock on tuple (42, 18) of relation 'users'; blocked by process 24102.\n"
                        "LOCATION: user_service.py:142 in update_user_profile"
                    ),
                },
                {
                    "id": "ev-2",
                    "type": "code_reference",
                    "title": "Anti-Pattern: Network I/O Inside Active DB Transaction",
                    "location": "services/user_service.py:136-148",
                    "description": "Storage client upload executes while active transaction lock is held open.",
                    "snippet": (
                        "async with db_session.begin():\n"
                        "    user = await db_session.get(User, user_id)\n"
                        "    if avatar_file:\n"
                        "        avatar_url = await storage_client.upload_avatar(user_id, avatar_file)\n"
                        "        user.avatar_url = avatar_url"
                    ),
                },
            ],
            proposed_plan=[
                {
                    "stepNumber": 1,
                    "title": "Decouple Network Storage I/O from Database Transaction",
                    "targetFile": "services/user_service.py",
                    "action": "modify",
                    "risk": "low",
                    "status": "applied",
                },
                {
                    "stepNumber": 2,
                    "title": "Acquire Row with Pessimistic Lock (SELECT FOR UPDATE)",
                    "targetFile": "services/user_service.py",
                    "action": "modify",
                    "risk": "low",
                    "status": "applied",
                },
                {
                    "stepNumber": 3,
                    "title": "Implement Transient Deadlock Retry Mechanism",
                    "targetFile": "core/db_resilience.py",
                    "action": "modify",
                    "risk": "low",
                    "status": "applied",
                },
                {
                    "stepNumber": 4,
                    "title": "Add Automated Concurrency Regression Test",
                    "targetFile": "tests/services/test_user_service.py",
                    "action": "test",
                    "risk": "low",
                    "status": "verified",
                },
            ],
            code_diff=(
                "--- a/services/user_service.py\n"
                "+++ b/services/user_service.py\n"
                "@@ -136,12 +136,16 @@ async def update_user_profile(user_id, payload, avatar_file=None):\n"
                "-    async with db_session.begin():\n"
                "+    avatar_url = None\n"
                "+    if avatar_file:\n"
                "+        avatar_url = await storage_client.upload_avatar(user_id, avatar_file)\n"
                "+\n"
                "+    async with db_session.begin():\n"
                "+        stmt = select(User).where(User.id == user_id).with_for_update()\n"
                "+        result = await db_session.execute(stmt)\n"
                "+        user = result.scalar_one()\n"
                "         if avatar_url:\n"
                "             user.avatar_url = avatar_url\n"
                "         user.display_name = payload.display_name\n"
                "-        await db_session.commit()\n"
                "+        await db_session.flush()\n"
            ),
            test_results={
                "suiteName": "pytest (Unit & Concurrency Regressions)",
                "totalTests": 24,
                "passed": 24,
                "failed": 0,
                "durationSeconds": 3.12,
                "coverage": {"before": 88.4, "after": 92.1, "delta": 3.7},
            },
            review_audit={
                "reviewerName": "CodeReviewerAgent",
                "overallScore": 98,
                "recommendation": "Approve",
                "checks": [
                    {"category": "Security", "status": "pass", "title": "Zero SQL injection risk"},
                    {"category": "Performance", "status": "pass", "title": "Lock duration reduced by 98.5%"},
                ],
            },
            documentation={
                "prTitle": "fix(profile): decouple avatar upload IO and prevent 500 serialization deadlock",
                "branchName": "patchpilot/pp-101-profile-deadlock-fix",
                "targetBranch": "main",
                "prBody": "Resolves PP-101: decouples remote IO from transactional boundary.",
                "changelogEntry": "Fix: Prevent serialization deadlock during profile avatar updates (#PP-101).",
            },
            branch_name="patchpilot/pp-101-profile-deadlock-fix",
            target_commit="8f2a9e1",
            started_at=now,
            completed_at=now,
        )
        session.add(investigation)
        await session.flush()

        # Seed the 6 pipeline stages as AgentRuns
        stages = [
            ("Requirements Analysis", "RequirementsAnalystAgent", "complete", "1m 45s", "Gemini 1.5 Pro"),
            ("Bug Investigation", "CodeInvestigatorAgent", "complete", "6m 28s", "Gemini 1.5 Pro"),
            ("Coding Assistant", "PatchEngineerAgent", "complete", "6m 33s", "Gemini 1.5 Pro"),
            ("Testing", "TestRunnerAgent", "complete", "4m 44s", "Isolated Runner Sandbox"),
            ("Code Review", "CodeReviewerAgent", "complete", "3m 25s", "Gemini 1.5 Pro"),
            ("Documentation", "DocGeneratorAgent", "complete", "1m 38s", "Gemini 1.5 Flash"),
        ]

        for stage, agent, status, duration, model in stages:
            run = AgentRun(
                investigation_id=investigation.id,
                stage=stage,
                agent_name=agent,
                status=status,
                duration=duration,
                model=model,
                summary=f"Automated execution completed for stage {stage}.",
                started_at=now,
                completed_at=now,
            )
            session.add(run)

    await session.commit()
    logger.info("Demo database seeding complete.")
