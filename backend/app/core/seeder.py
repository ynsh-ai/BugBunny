import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_artifact import AgentArtifact
from app.models.agent_run import AgentRun
from app.models.approval import ApprovalDecision
from app.models.investigation import Investigation
from app.models.issue import Issue
from app.models.repository import Repository

logger = logging.getLogger("bugbunny.seeder")

DEMO_REPOSITORIES = [
    {
        "name": "demo-ecommerce-app",
        "owner": "ynsh-ai",
        "github_url": "https://github.com/ynsh-ai/demo-ecommerce-app",
        "default_branch": "main",
    },
    {
        "name": "payments-gateway",
        "owner": "ynsh-ai",
        "github_url": "https://github.com/ynsh-ai/payments-gateway",
        "default_branch": "main",
    },
    {
        "name": "storefront-api",
        "owner": "ynsh-ai",
        "github_url": "https://github.com/ynsh-ai/storefront-api",
        "default_branch": "main",
    },
    {
        "name": "auth-service",
        "owner": "ynsh-ai",
        "github_url": "https://github.com/ynsh-ai/auth-service",
        "default_branch": "main",
    },
    {
        "name": "media-processor",
        "owner": "ynsh-ai",
        "github_url": "https://github.com/ynsh-ai/media-processor",
        "default_branch": "main",
    },
]

DEMO_ISSUES: list[dict[str, Any]] = [
    {
        "issue_key": "PP-101",
        "repo_name": "demo-ecommerce-app",
        "github_issue_number": 101,
        "title": "Profile update returns 500 error",
        "description": (
            "Users encounter intermittent HTTP 500 Internal Server Errors when updating their profile "
            "avatar while actively refreshing authentication tokens."
        ),
        "author": "alex.chen@company.internal",
        "status": "Investigation complete",
        "priority": "high",
        "assigned_agent": "BugBunny Orchestrator v1.4",
        "branch": "bugbunny/pp-101-profile-deadlock-fix",
        "target_commit": "8f2a9e1",
        "investigation_status": "completed",
        "root_cause_summary": (
            "A database transaction serialization deadlock occurs when updating user profiles "
            "concurrently with background token refresh workers. In services/user_service.py, "
            "the function update_user_profile() initiates an open transaction before performing "
            "an external network call to S3 for avatar storage. While the transaction remains uncommitted "
            "for ~320ms, an auth refresh worker attempts to update users.last_active_at without row-level locking. "
            "Under moderate concurrency, PostgreSQL detects circular wait locks (error code 40P01) "
            "and aborts the profile transaction, which the API controller catches as an unhandled generic exception "
            "and returns as HTTP 500."
        ),
        "evidence": [
            {
                "id": "ev-1",
                "type": "stack_trace",
                "title": "Production Sentry Exception Log",
                "location": "demo-ecommerce-app / prod-us-east-1",
                "timestamp": "2026-10-23 07:58:14 UTC",
                "description": "PostgreSQL 40P01 serialization failure detected inside update_user_profile transaction block.",
                "snippet": (
                    "psycopg2.errors.DeadlockDetected: deadlock detected\n"
                    "DETAIL: Process 24102 waits for ShareLock on transaction 89104; blocked by process 24109.\n"
                    "Process 24109 waits for ExclusiveLock on tuple (42, 18) of relation 'users'; blocked by process 24102.\n"
                    "LOCATION: user_service.py:142 in update_user_profile\n"
                    "  File 'app/api/v1/routes/users.py', line 88, in handle_update_profile\n"
                    "    result = await user_service.update_user_profile(user_id, payload)"
                ),
            },
            {
                "id": "ev-2",
                "type": "code_reference",
                "title": "Anti-Pattern: Network I/O Inside Active DB Transaction",
                "location": "services/user_service.py:136-148",
                "timestamp": "2026-10-23 08:18:02 UTC",
                "description": "Storage client upload executes while active transaction lock is held open.",
                "snippet": (
                    "async with db.transaction():\n"
                    "    # BUG: External HTTP call inside transaction locks users table row\n"
                    "    avatar_url = await s3_client.upload_file(avatar_stream)\n"
                    "    user.avatar_url = avatar_url\n"
                    "    await db.commit()"
                ),
            },
        ],
        "proposed_plan": [
            {
                "stepNumber": 1,
                "title": "Decouple S3 storage upload from database transaction boundary",
                "description": "Perform S3 network upload prior to opening transaction block. Pass finalized URL into DB update context.",
                "riskLevel": "Low",
                "estimatedImpact": "Eliminates ~320ms lock duration window completely.",
                "files": ["services/user_service.py"],
            },
            {
                "stepNumber": 2,
                "title": "Acquire row-level pessimistic lock for user profile mutation",
                "description": "Execute select for update with skip locked or timeout backoff when retrieving user record for mutation.",
                "riskLevel": "Medium",
                "estimatedImpact": "Guarantees deterministic serialization without table-wide or index-level lock contention.",
                "files": ["services/user_service.py", "db/queries/users.py"],
            },
            {
                "stepNumber": 3,
                "title": "Implement exponential retry backoff on transient 40P01 failures",
                "description": "Attach automatic retry decorator with jitter for remaining serialization contention anomalies.",
                "riskLevel": "Low",
                "estimatedImpact": "Zero user-facing 500 errors during peak concurrent token rotations.",
                "files": ["services/user_service.py"],
            },
            {
                "stepNumber": 4,
                "title": "Add regression integration test suite with concurrent async worker stress testing",
                "description": "Write pytest integration test firing 100 concurrent avatar updates alongside background token refreshes.",
                "riskLevel": "Low",
                "estimatedImpact": "Verifies 100% deadlock prevention in CI pipeline.",
                "files": ["tests/integration/test_user_profile_concurrency.py"],
            },
        ],
        "code_diff": (
            "diff --git a/services/user_service.py b/services/user_service.py\n"
            "--- a/services/user_service.py\n"
            "+++ b/services/user_service.py\n"
            "@@ -134,14 +134,16 @@ async def update_user_profile(user_id: str, avatar_stream: BinaryIO):\n"
            "-    async with db.begin() as transaction:\n"
            "-        # Issue: S3 upload inside transaction holds lock during external IO\n"
            "-        avatar_url = await s3_storage.upload_avatar(user_id, avatar_stream)\n"
            "-        user = await db.get(User, user_id)\n"
            "-        user.avatar_url = avatar_url\n"
            "-        user.updated_at = datetime.utcnow()\n"
            "-        await transaction.commit()\n"
            "+    # Fix: Move network upload outside transaction boundary\n"
            "+    avatar_url = await s3_storage.upload_avatar(user_id, avatar_stream)\n"
            "+\n"
            "+    async with db.begin() as transaction:\n"
            "+        user = await db.get(User, user_id, with_for_update=True)\n"
            "+        user.avatar_url = avatar_url\n"
            "+        user.updated_at = datetime.utcnow()\n"
            "+        await transaction.commit()\n"
            "     return user\n"
        ),
        "test_results": {
            "suiteName": "pytest (Concurrency & Regression)",
            "totalTests": 24,
            "passed": 24,
            "failed": 0,
            "skipped": 0,
            "durationSeconds": 3.42,
            "coverage": {"before": 88.5, "after": 94.2, "delta": 5.7},
            "testCases": [
                {
                    "name": "test_concurrent_profile_updates_no_deadlock",
                    "status": "passed",
                    "duration": "1.24s",
                    "assertions": 100,
                },
                {
                    "name": "test_s3_upload_failure_rollback",
                    "status": "passed",
                    "duration": "0.45s",
                    "assertions": 12,
                },
                {
                    "name": "test_profile_token_refresh_race_condition",
                    "status": "passed",
                    "duration": "0.88s",
                    "assertions": 50,
                },
            ],
        },
        "review_audit": {
            "reviewerName": "CodeReviewerAgent",
            "overallScore": 98,
            "recommendation": "Approve",
            "checks": [
                {
                    "category": "Concurrency & Safety",
                    "description": "Row-level lock with_for_update prevents dirty reads and deadlock cycle.",
                    "status": "pass",
                },
                {
                    "category": "Performance",
                    "description": "Transaction duration reduced by 94% (from 320ms to 18ms).",
                    "status": "pass",
                },
                {
                    "category": "Error Handling",
                    "description": "S3 failure properly aborts before entering DB transaction.",
                    "status": "pass",
                },
            ],
            "automatedSummary": "Validated diff against security and architecture guidelines. Zero regression footprint.",
        },
        "documentation": {
            "prTitle": "fix(user-service): decouple S3 avatar upload from database transaction to resolve 40P01 deadlock",
            "branchName": "bugbunny/pp-101-profile-deadlock-fix",
            "targetBranch": "main",
            "prBody": (
                "### Summary\n\n"
                "Resolves intermittent HTTP 500 error on profile update caused by PostgreSQL transaction serialization deadlock (40P01).\n\n"
                "### Key Changes\n"
                "- Moved S3 storage IO outside database transaction boundary.\n"
                "- Added row-level `with_for_update=True` locking on User record.\n"
                "- Added 24 concurrency tests verifying 100 parallel workers."
            ),
            "changelogEntry": "Fixed database transaction serialization deadlock in user profile avatar update service.",
            "releaseNotes": "Critical fix for concurrent profile updates and background token refreshes.",
            "affectedComponents": ["services/user_service.py", "tests/integration/test_user_profile_concurrency.py"],
        },
        "agent_runs": [
            {
                "stage": "Requirements Analysis",
                "agent_name": "RequirementsAnalystAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "1m 45s",
                "summary": "Analyzed user bug report and API telemetry. Isolated error trigger to HTTP PUT /api/v1/users/profile with avatar image payload under concurrent session token refreshes.",
            },
            {
                "stage": "Bug Investigation",
                "agent_name": "CodeInvestigatorAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "6m 28s",
                "summary": "Traced call tree across services/user_service.py and database session manager. Discovered transaction boundary holds table locks across asynchronous S3 storage uploads.",
            },
            {
                "stage": "Coding Assistant",
                "agent_name": "PatchEngineerAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "6m 33s",
                "summary": "Refactored avatar upload IO outside database transaction block. Applied row-level locking (with_for_update) during profile attribute writes with exponential backoff on retry.",
            },
            {
                "stage": "Testing",
                "agent_name": "TestRunnerAgent",
                "status": "complete",
                "model": "Isolated Runner Sandbox",
                "duration": "4m 44s",
                "summary": "Executed 24 unit and concurrency integration tests. Verified zero deadlocks across 100 concurrent workers updating identical user records. 100% tests passed.",
            },
            {
                "stage": "Code Review",
                "agent_name": "CodeReviewerAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "3m 25s",
                "summary": "Validated diff against security, OWASP, and architectural guidelines. Confirmed memory safety, error handling, and zero regression footprint.",
            },
            {
                "stage": "Documentation",
                "agent_name": "DocGeneratorAgent",
                "status": "complete",
                "model": "Gemini 1.5 Flash",
                "duration": "1m 38s",
                "summary": "Generated PR draft, detailed release changelog, inline docstrings, and architectural rationale for the transaction boundary refactoring.",
            },
        ],
    },
    {
        "issue_key": "PP-102",
        "repo_name": "payments-gateway",
        "github_issue_number": 102,
        "title": "Payment webhook retry causes duplicate charge",
        "description": "Incoming Stripe retry webhooks without idempotency keys create duplicate entries in payment ledger under high network latency.",
        "author": "sarah.m@company.internal",
        "status": "Testing",
        "priority": "critical",
        "assigned_agent": "TestRunnerAgent",
        "branch": "bugbunny/pp-102-idempotency-key",
        "target_commit": "3c7b119",
        "investigation_status": "in_progress",
        "root_cause_summary": "Missing idempotency validation check before ledger balance write during incoming webhook retries.",
        "evidence": [],
        "proposed_plan": [
            {
                "stepNumber": 1,
                "title": "Add distributed lock on incoming event ID",
                "description": "Enforce atomic Redis lock based on Stripe event ID before dispatching to settlement queue.",
                "riskLevel": "Medium",
                "estimatedImpact": "Prevents race conditions on concurrent webhook replays.",
                "files": ["services/webhook_service.py"],
            }
        ],
        "code_diff": None,
        "test_results": {
            "suiteName": "pytest (Payments)",
            "totalTests": 42,
            "passed": 38,
            "failed": 0,
            "skipped": 0,
            "durationSeconds": 4.8,
            "coverage": {"before": 91.0, "after": 93.4, "delta": 2.4},
            "testCases": [],
        },
        "review_audit": {
            "reviewerName": "CodeReviewerAgent",
            "overallScore": 0,
            "recommendation": "Comment",
            "checks": [],
            "automatedSummary": "In progress",
        },
        "documentation": {
            "prTitle": "fix(webhook): enforce distributed lock on stripe webhook ingestion",
            "branchName": "bugbunny/pp-102-idempotency-key",
            "targetBranch": "main",
            "prBody": "Pending completion",
            "changelogEntry": "Pending",
            "releaseNotes": "Pending",
            "affectedComponents": ["services/webhook_service.py"],
        },
        "agent_runs": [
            {
                "stage": "Requirements Analysis",
                "agent_name": "RequirementsAnalystAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "1m 15s",
                "summary": "Parsed Stripe webhook retry documentation and idempotency specs.",
            },
            {
                "stage": "Bug Investigation",
                "agent_name": "CodeInvestigatorAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "4m 10s",
                "summary": "Located missing unique constraint on stripe_event_id in webhook_events table.",
            },
            {
                "stage": "Coding Assistant",
                "agent_name": "PatchEngineerAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "5m 20s",
                "summary": "Added Redis distributed lock and unique database index on idempotency key.",
            },
            {
                "stage": "Testing",
                "agent_name": "TestRunnerAgent",
                "status": "in_progress",
                "model": "Isolated Runner Sandbox",
                "duration": "running...",
                "summary": "Running 100 simultaneous webhook replay attacks in test container.",
            },
            {
                "stage": "Code Review",
                "agent_name": "CodeReviewerAgent",
                "status": "pending",
                "model": "Gemini 1.5 Pro",
                "duration": None,
                "summary": "Awaiting test suite completion.",
            },
            {
                "stage": "Documentation",
                "agent_name": "DocGeneratorAgent",
                "status": "pending",
                "model": "Gemini 1.5 Flash",
                "duration": None,
                "summary": "Queued.",
            },
        ],
    },
    {
        "issue_key": "PP-103",
        "repo_name": "storefront-api",
        "github_issue_number": 103,
        "title": "Cart checkout latency spikes above 2500ms",
        "description": "Customers experience slow checkout responses during high volume promotional flash sales.",
        "author": "dave.k@company.internal",
        "status": "In progress",
        "priority": "high",
        "assigned_agent": "CodeInvestigatorAgent",
        "branch": "bugbunny/pp-103-cart-n-plus-one",
        "target_commit": "7b4c810",
        "investigation_status": "in_progress",
        "root_cause_summary": "N+1 SQL queries triggered when querying supplier inventories individually inside cart item loop.",
        "evidence": [],
        "proposed_plan": [],
        "code_diff": None,
        "test_results": {
            "suiteName": "pytest (Storefront)",
            "totalTests": 16,
            "passed": 16,
            "failed": 0,
            "skipped": 0,
            "durationSeconds": 1.8,
            "coverage": {"before": 84.0, "after": 84.0, "delta": 0.0},
            "testCases": [],
        },
        "review_audit": {
            "reviewerName": "CodeReviewerAgent",
            "overallScore": 0,
            "recommendation": "Comment",
            "checks": [],
            "automatedSummary": "Pending",
        },
        "documentation": {
            "prTitle": "perf(cart): batch inventory lookup queries during checkout",
            "branchName": "bugbunny/pp-103-cart-n-plus-one",
            "targetBranch": "main",
            "prBody": "Pending",
            "changelogEntry": "Pending",
            "releaseNotes": "Pending",
            "affectedComponents": ["services/cart_service.py"],
        },
        "agent_runs": [
            {
                "stage": "Requirements Analysis",
                "agent_name": "RequirementsAnalystAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "2m 01s",
                "summary": "Profiled p99 response times exceeding SLA on checkout completion endpoint.",
            },
            {
                "stage": "Bug Investigation",
                "agent_name": "CodeInvestigatorAgent",
                "status": "in_progress",
                "model": "Gemini 1.5 Pro",
                "duration": "running...",
                "summary": "Detected N+1 database queries on inventory reservation during checkout.",
            },
            {
                "stage": "Coding Assistant",
                "agent_name": "PatchEngineerAgent",
                "status": "pending",
                "model": "Gemini 1.5 Pro",
                "duration": None,
                "summary": "Queued for batch query refactoring.",
            },
            {
                "stage": "Testing",
                "agent_name": "TestRunnerAgent",
                "status": "pending",
                "model": "Isolated Runner Sandbox",
                "duration": None,
                "summary": "Queued.",
            },
            {
                "stage": "Code Review",
                "agent_name": "CodeReviewerAgent",
                "status": "pending",
                "model": "Gemini 1.5 Pro",
                "duration": None,
                "summary": "Queued.",
            },
            {
                "stage": "Documentation",
                "agent_name": "DocGeneratorAgent",
                "status": "pending",
                "model": "Gemini 1.5 Flash",
                "duration": None,
                "summary": "Queued.",
            },
        ],
    },
    {
        "issue_key": "PP-104",
        "repo_name": "auth-service",
        "github_issue_number": 104,
        "title": "OAuth2 refresh token expiration edge-case",
        "description": "Intermittent session logouts observed on client reconnects after token rotation with minor clock skew.",
        "author": "rachel.w@company.internal",
        "status": "In progress",
        "priority": "medium",
        "assigned_agent": "RequirementsAnalystAgent",
        "branch": "bugbunny/pp-104-oauth-refresh",
        "target_commit": "1f8e402",
        "investigation_status": "in_progress",
        "root_cause_summary": "Clock skew between microservices causes token validation to reject valid tokens issued within 30-second window.",
        "evidence": [],
        "proposed_plan": [],
        "code_diff": None,
        "test_results": {
            "suiteName": "pytest (Auth)",
            "totalTests": 30,
            "passed": 30,
            "failed": 0,
            "skipped": 0,
            "durationSeconds": 2.1,
            "coverage": {"before": 94.0, "after": 94.0, "delta": 0.0},
            "testCases": [],
        },
        "review_audit": {
            "reviewerName": "CodeReviewerAgent",
            "overallScore": 0,
            "recommendation": "Comment",
            "checks": [],
            "automatedSummary": "Pending",
        },
        "documentation": {
            "prTitle": "fix(auth): add 60-second leeway to jwt expiration verification",
            "branchName": "bugbunny/pp-104-oauth-refresh",
            "targetBranch": "main",
            "prBody": "Pending",
            "changelogEntry": "Pending",
            "releaseNotes": "Pending",
            "affectedComponents": ["core/jwt_handler.py"],
        },
        "agent_runs": [
            {
                "stage": "Requirements Analysis",
                "agent_name": "RequirementsAnalystAgent",
                "status": "in_progress",
                "model": "Gemini 1.5 Pro",
                "duration": "running...",
                "summary": "Deconstructing refresh token rotation specs under clock skew.",
            },
            {
                "stage": "Bug Investigation",
                "agent_name": "CodeInvestigatorAgent",
                "status": "pending",
                "model": "Gemini 1.5 Pro",
                "duration": None,
                "summary": "Queued.",
            },
            {
                "stage": "Coding Assistant",
                "agent_name": "PatchEngineerAgent",
                "status": "pending",
                "model": "Gemini 1.5 Pro",
                "duration": None,
                "summary": "Queued.",
            },
            {
                "stage": "Testing",
                "agent_name": "TestRunnerAgent",
                "status": "pending",
                "model": "Isolated Runner Sandbox",
                "duration": None,
                "summary": "Queued.",
            },
            {
                "stage": "Code Review",
                "agent_name": "CodeReviewerAgent",
                "status": "pending",
                "model": "Gemini 1.5 Pro",
                "duration": None,
                "summary": "Queued.",
            },
            {
                "stage": "Documentation",
                "agent_name": "DocGeneratorAgent",
                "status": "pending",
                "model": "Gemini 1.5 Flash",
                "duration": None,
                "summary": "Queued.",
            },
        ],
    },
    {
        "issue_key": "PP-105",
        "repo_name": "media-processor",
        "github_issue_number": 105,
        "title": "Memory leak in background image processing worker",
        "description": "Background image transcoding workers gradually consume host memory until OOM killed by container supervisor.",
        "author": "kevin.t@company.internal",
        "status": "Review required",
        "priority": "high",
        "assigned_agent": "CodeReviewerAgent",
        "branch": "bugbunny/pp-105-pillow-buffer-leak",
        "target_commit": "9c3e551",
        "investigation_status": "in_progress",
        "root_cause_summary": "Image buffers opened via PIL were not deterministically released inside worker process threadpool.",
        "evidence": [],
        "proposed_plan": [],
        "code_diff": None,
        "test_results": {
            "suiteName": "pytest (Media)",
            "totalTests": 14,
            "passed": 14,
            "failed": 0,
            "skipped": 0,
            "durationSeconds": 5.2,
            "coverage": {"before": 87.0, "after": 89.5, "delta": 2.5},
            "testCases": [],
        },
        "review_audit": {
            "reviewerName": "CodeReviewerAgent",
            "overallScore": 92,
            "recommendation": "Approve",
            "checks": [],
            "automatedSummary": "Under final review",
        },
        "documentation": {
            "prTitle": "fix(media): close in-memory image buffers to prevent worker leak",
            "branchName": "bugbunny/pp-105-pillow-buffer-leak",
            "targetBranch": "main",
            "prBody": "Pending",
            "changelogEntry": "Pending",
            "releaseNotes": "Pending",
            "affectedComponents": ["workers/transcoder.py"],
        },
        "agent_runs": [
            {
                "stage": "Requirements Analysis",
                "agent_name": "RequirementsAnalystAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "1m 30s",
                "summary": "Profiled memory growth in Celery worker handling high-res TIFF/WEBP transcoding.",
            },
            {
                "stage": "Bug Investigation",
                "agent_name": "CodeInvestigatorAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "5m 12s",
                "summary": "Identified unclosed BytesIO buffers retained in image metadata cache.",
            },
            {
                "stage": "Coding Assistant",
                "agent_name": "PatchEngineerAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "3m 45s",
                "summary": "Wrapped buffer transformations in contextmanager with explicit .close() calls.",
            },
            {
                "stage": "Testing",
                "agent_name": "TestRunnerAgent",
                "status": "complete",
                "model": "Isolated Runner Sandbox",
                "duration": "6m 10s",
                "summary": "Ran 1,000 image transformation benchmark; memory footprint held constant at 140MB.",
            },
            {
                "stage": "Code Review",
                "agent_name": "CodeReviewerAgent",
                "status": "in_progress",
                "model": "Gemini 1.5 Pro",
                "duration": "running...",
                "summary": "Automated review checklist verification underway.",
            },
            {
                "stage": "Documentation",
                "agent_name": "DocGeneratorAgent",
                "status": "pending",
                "model": "Gemini 1.5 Flash",
                "duration": None,
                "summary": "Queued.",
            },
        ],
    },
    {
        "issue_key": "PP-106",
        "repo_name": "payments-gateway",
        "github_issue_number": 106,
        "title": "Missing idempotency key on refund endpoint",
        "description": "Refund endpoint does not validate idempotency keys, risking duplicate payouts when merchant triggers network retries.",
        "author": "sarah.m@company.internal",
        "status": "Investigation complete",
        "priority": "medium",
        "assigned_agent": "BugBunny Orchestrator v1.4",
        "branch": "bugbunny/pp-106-refund-idempotency",
        "target_commit": "5d2b77a",
        "investigation_status": "completed",
        "root_cause_summary": "Refund endpoint did not enforce or record customer idempotency headers during duplicate network submissions.",
        "evidence": [],
        "proposed_plan": [],
        "code_diff": None,
        "test_results": {
            "suiteName": "pytest (Refunds)",
            "totalTests": 18,
            "passed": 18,
            "failed": 0,
            "skipped": 0,
            "durationSeconds": 2.4,
            "coverage": {"before": 89.0, "after": 91.0, "delta": 2.0},
            "testCases": [],
        },
        "review_audit": {
            "reviewerName": "CodeReviewerAgent",
            "overallScore": 96,
            "recommendation": "Approve",
            "checks": [],
            "automatedSummary": "Ready for deployment",
        },
        "documentation": {
            "prTitle": "feat(payments): require idempotency key for refund requests",
            "branchName": "bugbunny/pp-106-refund-idempotency",
            "targetBranch": "main",
            "prBody": "Ready",
            "changelogEntry": "Ready",
            "releaseNotes": "Ready",
            "affectedComponents": ["api/v1/routes/refunds.py"],
        },
        "agent_runs": [
            {
                "stage": "Requirements Analysis",
                "agent_name": "RequirementsAnalystAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "1m 10s",
                "summary": "Analyzed refund API contract and gateway payload standards.",
            },
            {
                "stage": "Bug Investigation",
                "agent_name": "CodeInvestigatorAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "3m 40s",
                "summary": "Found refund controller lacked Idempotency-Key header inspection.",
            },
            {
                "stage": "Coding Assistant",
                "agent_name": "PatchEngineerAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "4m 15s",
                "summary": "Added Idempotency-Key validation header and cache check.",
            },
            {
                "stage": "Testing",
                "agent_name": "TestRunnerAgent",
                "status": "complete",
                "model": "Isolated Runner Sandbox",
                "duration": "3m 30s",
                "summary": "12 unit tests verifying duplicate refund prevention passed.",
            },
            {
                "stage": "Code Review",
                "agent_name": "CodeReviewerAgent",
                "status": "complete",
                "model": "Gemini 1.5 Pro",
                "duration": "2m 50s",
                "summary": "Code review approved.",
            },
            {
                "stage": "Documentation",
                "agent_name": "DocGeneratorAgent",
                "status": "complete",
                "model": "Gemini 1.5 Flash",
                "duration": "1m 15s",
                "summary": "PR and API schema docs generated.",
            },
        ],
    },
]


async def seed_demo_data(session: AsyncSession, reset: bool = False) -> dict[str, Any]:
    """Seeds the demo repositories, six dashboard issues, investigations, and agent runs."""
    if reset:
        logger.info("Resetting existing demo mode records...")
        await session.execute(delete(Issue).where(Issue.mode == "demo"))
        await session.execute(delete(Repository).where(Repository.mode == "demo"))
        await session.flush()

    # 1. Ensure Repositories exist
    repo_map: dict[str, Repository] = {}
    for repo_data in DEMO_REPOSITORIES:
        stmt = select(Repository).where(Repository.name == repo_data["name"])
        res = await session.execute(stmt)
        repo = res.scalar_one_or_none()
        if not repo:
            repo = Repository(
                name=repo_data["name"],
                owner=repo_data["owner"],
                github_url=repo_data["github_url"],
                default_branch=repo_data["default_branch"],
                is_active=True,
                mode="demo",
            )
            session.add(repo)
            await session.flush()
        repo_map[repo.name] = repo

    # 2. Seed Issues & Investigations
    seeded_issues_count = 0
    seeded_inv_count = 0

    now = datetime.now(UTC)

    for item in DEMO_ISSUES:
        issue_key = item["issue_key"]
        repo = repo_map[item["repo_name"]]

        stmt = select(Issue).where(Issue.issue_key == issue_key)
        res = await session.execute(stmt)
        issue = res.scalar_one_or_none()

        if not issue:
            issue = Issue(
                issue_key=issue_key,
                repository_id=repo.id,
                github_issue_number=item["github_issue_number"],
                title=item["title"],
                description=item["description"],
                author=item["author"],
                status=item["status"],
                priority=item["priority"],
                assigned_agent=item["assigned_agent"],
                branch=item["branch"],
                target_commit=item["target_commit"],
                mode="demo",
            )
            session.add(issue)
            await session.flush()
            seeded_issues_count += 1

        # Check investigation
        inv_stmt = select(Investigation).where(Investigation.issue_id == issue.id)
        inv_res = await session.execute(inv_stmt)
        investigation = inv_res.scalar_one_or_none()

        if not investigation:
            investigation = Investigation(
                issue_id=issue.id,
                status=item["investigation_status"],
                root_cause_summary=item["root_cause_summary"],
                evidence=item.get("evidence"),
                proposed_plan=item.get("proposed_plan"),
                code_diff=item.get("code_diff"),
                diffs=[],
                test_results=item.get("test_results"),
                review_audit=item.get("review_audit"),
                documentation=item.get("documentation"),
                branch_name=item["branch"],
                target_commit=item["target_commit"],
                mode="demo",
                started_at=now,
                completed_at=now if item["investigation_status"] == "completed" else None,
            )
            session.add(investigation)
            await session.flush()
            seeded_inv_count += 1

            # Seed agent runs
            for agent_run_data in item.get("agent_runs", []):
                run = AgentRun(
                    investigation_id=investigation.id,
                    stage=agent_run_data["stage"],
                    agent_name=agent_run_data["agent_name"],
                    status=agent_run_data["status"],
                    model=agent_run_data.get("model", "Gemini 1.5 Pro"),
                    duration=agent_run_data.get("duration"),
                    summary=agent_run_data.get("summary"),
                    mode="demo",
                    started_at=now,
                    completed_at=now if agent_run_data["status"] == "complete" else None,
                )
                session.add(run)

            # Seed sample artifact if diff exists
            if item.get("code_diff"):
                artifact = AgentArtifact(
                    investigation_id=investigation.id,
                    artifact_type="diff",
                    name="unified_diff.patch",
                    content={"diff": item["code_diff"]},
                    mode="demo",
                )
                session.add(artifact)

            # Seed approval decision if completed
            if item["investigation_status"] == "completed":
                approval = ApprovalDecision(
                    investigation_id=investigation.id,
                    decision="approved",
                    reviewer="alex.chen@company.internal",
                    notes="Automated tests and zero deadlock verified in sandbox.",
                    mode="demo",
                )
                session.add(approval)

    await session.commit()
    logger.info("Demo database seeding complete.")
    return {
        "status": "seeded",
        "mode": "demo",
        "repositories_count": len(repo_map),
        "issues_count": len(DEMO_ISSUES),
        "new_issues_seeded": seeded_issues_count,
        "new_investigations_seeded": seeded_inv_count,
    }
