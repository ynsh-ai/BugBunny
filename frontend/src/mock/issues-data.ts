import { IssueDetail } from "./types";

export const ISSUE_PP_101: IssueDetail = {
  id: "PP-101",
  title: "Profile update returns 500 error",
  repository: "demo-ecommerce-app",
  status: "Investigation complete",
  priority: "high",
  author: "alex.chen@company.internal",
  assignedAgent: "PatchPilot Orchestrator v1.4",
  createdAt: "2026-10-23T08:14:22Z",
  updatedAt: "2026-10-23T09:41:05Z",
  branch: "patchpilot/pp-101-profile-deadlock-fix",
  targetCommit: "8f2a9e1",
  timeline: [
    {
      stage: "Requirements Analysis",
      agentName: "RequirementsAnalystAgent",
      status: "complete",
      startedAt: "08:14:25",
      completedAt: "08:16:10",
      duration: "1m 45s",
      model: "Gemini 1.5 Pro",
      summary:
        "Analyzed user bug report and API telemetry. Isolated error trigger to HTTP PUT /api/v1/users/profile with avatar image payload under concurrent session token refreshes.",
    },
    {
      stage: "Bug Investigation",
      agentName: "CodeInvestigatorAgent",
      status: "complete",
      startedAt: "08:16:12",
      completedAt: "08:22:40",
      duration: "6m 28s",
      model: "Gemini 1.5 Pro",
      summary:
        "Traced call tree across services/user_service.py and database session manager. Discovered transaction boundary holds table locks across asynchronous S3 storage uploads.",
    },
    {
      stage: "Coding Assistant",
      agentName: "PatchEngineerAgent",
      status: "complete",
      startedAt: "08:22:42",
      completedAt: "08:29:15",
      duration: "6m 33s",
      model: "Gemini 1.5 Pro",
      summary:
        "Refactored avatar upload IO outside database transaction block. Applied row-level locking (with_for_update) during profile attribute writes with exponential backoff on retry.",
    },
    {
      stage: "Testing",
      agentName: "TestRunnerAgent",
      status: "complete",
      startedAt: "08:29:18",
      completedAt: "08:34:02",
      duration: "4m 44s",
      model: "Isolated Runner Sandbox",
      summary:
        "Executed 24 unit and concurrency integration tests. Verified zero deadlocks across 100 concurrent workers updating identical user records. 100% tests passed.",
    },
    {
      stage: "Code Review",
      agentName: "CodeReviewerAgent",
      status: "complete",
      startedAt: "08:34:05",
      completedAt: "08:37:30",
      duration: "3m 25s",
      model: "Gemini 1.5 Pro",
      summary:
        "Validated diff against security, OWASP, and architectural guidelines. Confirmed memory safety, error handling, and zero regression footprint.",
    },
    {
      stage: "Documentation",
      agentName: "DocGeneratorAgent",
      status: "complete",
      startedAt: "08:37:32",
      completedAt: "08:39:10",
      duration: "1m 38s",
      model: "Gemini 1.5 Flash",
      summary:
        "Generated PR draft, detailed release changelog, inline docstrings, and architectural rationale for the transaction boundary refactoring.",
    },
  ],
  rootCauseSummary:
    "A database transaction serialization deadlock occurs when updating user profiles concurrently with background token refresh workers. In services/user_service.py, the function update_user_profile() initiates an open transaction before performing an external network call to S3 for avatar storage. While the transaction remains uncommitted for ~320ms, an auth refresh worker attempts to update users.last_active_at without row-level locking. Under moderate concurrency, PostgreSQL detects circular wait locks (error code 40P01) and aborts the profile transaction, which the API controller catches as an unhandled generic exception and returns as HTTP 500.",
  evidence: [
    {
      id: "ev-1",
      type: "stack_trace",
      title: "Production Sentry Exception Log",
      location: "demo-ecommerce-app / prod-us-east-1",
      timestamp: "2026-10-23 07:58:14 UTC",
      description:
        "PostgreSQL 40P01 serialization failure detected inside update_user_profile transaction block.",
      snippet: `psycopg2.errors.DeadlockDetected: deadlock detected
DETAIL: Process 24102 waits for ShareLock on transaction 89104; blocked by process 24109.
Process 24109 waits for ExclusiveLock on tuple (42, 18) of relation "users"; blocked by process 24102.
HINT: See server log for query details.
LOCATION: user_service.py:142 in update_user_profile
  File "app/api/v1/routes/users.py", line 88, in handle_update_profile
    result = await user_service.update_user_profile(user_id, payload)`,
    },
    {
      id: "ev-2",
      type: "code_reference",
      title: "Anti-Pattern: Network I/O Inside Active DB Transaction",
      location: "services/user_service.py:136-148",
      timestamp: "Git Commit: 8f2a9e1",
      description:
        "Database session begins at line 136, but avatar storage upload occurs asynchronously at line 140 before commit, keeping row locks open for >300ms.",
      snippet: `async with db_session.begin():  # <-- Opens transaction lock prematurely
    user = await db_session.get(User, user_id)
    if avatar_file:
        # VULNERABILITY: External network I/O holds DB lock open
        avatar_url = await storage_client.upload_avatar(user_id, avatar_file)
        user.avatar_url = avatar_url
    user.display_name = payload.display_name
    await db_session.commit()`,
    },
    {
      id: "ev-3",
      type: "test_output",
      title: "Synthetic Concurrency Reproduction Test",
      location: "tests/reproduce_issue_101.py",
      timestamp: "2026-10-23 08:21:04 UTC",
      description:
        "Triggered 50 parallel requests alternating profile avatar updates and auth session refresh on the same test user ID.",
      snippet: `[Runner] Executing ConcurrencyStressSuite (threads=50, target=user_104)...
  Request #01..12: HTTP 200 OK (latency: 42ms)
  Request #13:     HTTP 500 Internal Server Error [DeadlockDetected: 40P01]
  Request #14..27: HTTP 200 OK
  Request #28:     HTTP 500 Internal Server Error [DeadlockDetected: 40P01]
Failure rate: 14.0% (7/50 requests failed with PostgreSQL deadlock)`,
    },
  ],
  proposedPlan: [
    {
      stepNumber: 1,
      title: "Decouple Network Storage I/O from Database Transaction",
      description:
        "Upload avatar binary to object storage and compute its public CDN URL prior to acquiring any database transaction connection.",
      targetFile: "services/user_service.py",
      action: "modify",
      risk: "low",
      status: "applied",
    },
    {
      stepNumber: 2,
      title: "Acquire Row with Pessimistic Lock (SELECT FOR UPDATE)",
      description:
        "Query user record using with_for_update(nowait=False) to ensure deterministic lock acquisition order across all mutating endpoints.",
      targetFile: "services/user_service.py",
      action: "modify",
      risk: "low",
      status: "applied",
    },
    {
      stepNumber: 3,
      title: "Implement Transient Deadlock Retry Mechanism",
      description:
        "Wrap transaction execution in a lightweight retry loop with exponential jitter (max 3 retries) for transient concurrency collisions.",
      targetFile: "core/db_resilience.py",
      action: "modify",
      risk: "low",
      status: "applied",
    },
    {
      stepNumber: 4,
      title: "Add Automated Concurrency Regression Test",
      description:
        "Synthesize unit integration test in test_user_service.py firing 50 concurrent profile updates + token refreshes to ensure zero 500s.",
      targetFile: "tests/services/test_user_service.py",
      action: "test",
      risk: "low",
      status: "verified",
    },
  ],
  diffs: [
    {
      filename: "services/user_service.py",
      oldPath: "a/services/user_service.py",
      newPath: "b/services/user_service.py",
      additions: 19,
      deletions: 7,
      lines: [
        {
          type: "header",
          content: "@@ -134,18 +134,30 @@ async def update_user_profile(",
        },
        {
          type: "context",
          oldLineNumber: 134,
          newLineNumber: 134,
          content: "    user_id: int,",
        },
        {
          type: "context",
          oldLineNumber: 135,
          newLineNumber: 135,
          content: "    payload: ProfileUpdateSchema,",
        },
        {
          type: "context",
          oldLineNumber: 136,
          newLineNumber: 136,
          content: "    avatar_file: UploadFile | None = None,",
        },
        {
          type: "context",
          oldLineNumber: 137,
          newLineNumber: 137,
          content: ") -> UserResponse:",
        },
        {
          type: "addition",
          newLineNumber: 138,
          content: "    # Perform slow network I/O outside of the database transaction window",
        },
        {
          type: "addition",
          newLineNumber: 139,
          content: "    avatar_url: str | None = None",
        },
        {
          type: "addition",
          newLineNumber: 140,
          content: "    if avatar_file:",
        },
        {
          type: "addition",
          newLineNumber: 141,
          content: "        avatar_url = await storage_client.upload_avatar(user_id, avatar_file)",
        },
        {
          type: "addition",
          newLineNumber: 142,
          content: "",
        },
        {
          type: "deletion",
          oldLineNumber: 138,
          content: "-    async with db_session.begin():",
        },
        {
          type: "deletion",
          oldLineNumber: 139,
          content: "-        user = await db_session.get(User, user_id)",
        },
        {
          type: "deletion",
          oldLineNumber: 140,
          content: "-        if avatar_file:",
        },
        {
          type: "deletion",
          oldLineNumber: 141,
          content: "-            avatar_url = await storage_client.upload_avatar(user_id, avatar_file)",
        },
        {
          type: "deletion",
          oldLineNumber: 142,
          content: "-            user.avatar_url = avatar_url",
        },
        {
          type: "addition",
          newLineNumber: 143,
          content: "+    # Execute bounded, atomic transaction with row-level lock",
        },
        {
          type: "addition",
          newLineNumber: 144,
          content: "+    async with db_session.begin():",
        },
        {
          type: "addition",
          newLineNumber: 145,
          content: "+        stmt = select(User).where(User.id == user_id).with_for_update()",
        },
        {
          type: "addition",
          newLineNumber: 146,
          content: "+        result = await db_session.execute(stmt)",
        },
        {
          type: "addition",
          newLineNumber: 147,
          content: "+        user = result.scalar_one_or_none()",
        },
        {
          type: "addition",
          newLineNumber: 148,
          content: "+        if not user:",
        },
        {
          type: "addition",
          newLineNumber: 149,
          content: "+            raise EntityNotFoundError(f'User {user_id} not found')",
        },
        {
          type: "addition",
          newLineNumber: 150,
          content: "+",
        },
        {
          type: "addition",
          newLineNumber: 151,
          content: "+        if avatar_url:",
        },
        {
          type: "addition",
          newLineNumber: 152,
          content: "+            user.avatar_url = avatar_url",
        },
        {
          type: "context",
          oldLineNumber: 143,
          newLineNumber: 153,
          content: "        if payload.display_name is not None:",
        },
        {
          type: "context",
          oldLineNumber: 144,
          newLineNumber: 154,
          content: "            user.display_name = payload.display_name",
        },
        {
          type: "context",
          oldLineNumber: 145,
          newLineNumber: 155,
          content: "        if payload.bio is not None:",
        },
        {
          type: "context",
          oldLineNumber: 146,
          newLineNumber: 156,
          content: "            user.bio = payload.bio",
        },
        {
          type: "deletion",
          oldLineNumber: 147,
          content: "-        await db_session.commit()",
        },
        {
          type: "addition",
          newLineNumber: 157,
          content: "+        await db_session.flush()",
        },
        {
          type: "context",
          oldLineNumber: 148,
          newLineNumber: 158,
          content: "    return UserResponse.model_validate(user)",
        },
      ],
    },
    {
      filename: "tests/services/test_user_service.py",
      oldPath: "a/tests/services/test_user_service.py",
      newPath: "b/tests/services/test_user_service.py",
      additions: 22,
      deletions: 0,
      lines: [
        {
          type: "header",
          content: "@@ -210,6 +210,28 @@ async def test_update_profile_display_name(test_db, user_fixture):",
        },
        {
          type: "context",
          oldLineNumber: 210,
          newLineNumber: 210,
          content: "    assert updated.display_name == 'Jane Doe'",
        },
        {
          type: "context",
          oldLineNumber: 211,
          newLineNumber: 211,
          content: "",
        },
        {
          type: "addition",
          newLineNumber: 212,
          content: "+@pytest.mark.asyncio",
        },
        {
          type: "addition",
          newLineNumber: 213,
          content: "+async def test_concurrent_profile_and_token_refresh(test_db, user_fixture):",
        },
        {
          type: "addition",
          newLineNumber: 214,
          content: "+    '''Regression test for Issue PP-101: ensure 0 deadlocks under parallel writes.'''",
        },
        {
          type: "addition",
          newLineNumber: 215,
          content: "+    user_id = user_fixture.id",
        },
        {
          type: "addition",
          newLineNumber: 216,
          content: "+    tasks = []",
        },
        {
          type: "addition",
          newLineNumber: 217,
          content: "+    for i in range(25):",
        },
        {
          type: "addition",
          newLineNumber: 218,
          content: "+        tasks.append(update_user_profile(user_id, ProfileUpdateSchema(display_name=f'User {i}')))",
        },
        {
          type: "addition",
          newLineNumber: 219,
          content: "+        tasks.append(touch_user_session(user_id))",
        },
        {
          type: "addition",
          newLineNumber: 220,
          content: "+",
        },
        {
          type: "addition",
          newLineNumber: 221,
          content: "+    results = await asyncio.gather(*tasks, return_exceptions=True)",
        },
        {
          type: "addition",
          newLineNumber: 222,
          content: "+    exceptions = [r for r in results if isinstance(r, Exception)]",
        },
        {
          type: "addition",
          newLineNumber: 223,
          content: "+    assert len(exceptions) == 0, f'Encountered unexpected exceptions: {exceptions}'",
        },
      ],
    },
  ],
  testResults: {
    suiteName: "pytest (Unit & Concurrency Regressions)",
    totalTests: 24,
    passed: 24,
    failed: 0,
    skipped: 0,
    durationSeconds: 3.12,
    coverage: {
      before: 88.4,
      after: 92.1,
      delta: 3.7,
    },
    testCases: [
      {
        id: "tc-1",
        name: "test_concurrent_profile_and_token_refresh",
        file: "tests/services/test_user_service.py",
        status: "passed",
        durationMs: 780,
        isNewRegressionTest: true,
      },
      {
        id: "tc-2",
        name: "test_update_user_profile_success",
        file: "tests/services/test_user_service.py",
        status: "passed",
        durationMs: 45,
      },
      {
        id: "tc-3",
        name: "test_update_user_avatar_upload_decoupled",
        file: "tests/services/test_user_service.py",
        status: "passed",
        durationMs: 95,
        isNewRegressionTest: true,
      },
      {
        id: "tc-4",
        name: "test_update_profile_user_not_found",
        file: "tests/services/test_user_service.py",
        status: "passed",
        durationMs: 18,
      },
      {
        id: "tc-5",
        name: "test_pessimistic_lock_release_on_error",
        file: "tests/services/test_user_service.py",
        status: "passed",
        durationMs: 62,
        isNewRegressionTest: true,
      },
      {
        id: "tc-6",
        name: "test_auth_session_touch_idempotency",
        file: "tests/services/test_auth_service.py",
        status: "passed",
        durationMs: 34,
      },
    ],
  },
  review: {
    reviewerName: "CodeReviewerAgent (Automated Architecture & Security Auditor)",
    overallScore: 98,
    recommendation: "Approve",
    automatedSummary:
      "All automated quality gates passed. Decoupling remote storage I/O from database transactions resolves the root cause safely without schema changes. Row-level pessimistic locking eliminates the circular wait condition.",
    checks: [
      {
        category: "Security",
        status: "pass",
        title: "Zero SQL Injection or Query Injection",
        details:
          "Statements utilize parameterized SQLAlchemy ORM select() constructs with strict type constraints.",
      },
      {
        category: "Performance",
        status: "pass",
        title: "Transaction Hold Time Reduced by 98.5%",
        details:
          "Database connection lock duration dropped from ~320ms down to ~4.2ms by moving S3 IO out of session block.",
      },
      {
        category: "Correctness",
        status: "pass",
        title: "Atomicity Maintained on Entity Attributes",
        details:
          "If database write fails, no stale avatar URL is stored; previous profile record remains cleanly unchanged.",
      },
      {
        category: "Maintainability",
        status: "pass",
        title: "Zero Database Migration Required",
        details:
          "Fix is entirely logic-layer and transactional. Backward-compatible with all existing clients.",
      },
    ],
  },
  documentation: {
    prTitle: "fix(profile): decouple avatar upload IO and prevent 500 serialization deadlock",
    branchName: "patchpilot/pp-101-profile-deadlock-fix",
    targetBranch: "main",
    prBody: `### Summary of Changes

Resolves issue **#PP-101** where concurrent user profile updates triggered intermittent HTTP 500 errors in production.

#### Root Cause
\`services/user_service.py\` previously initiated an open transaction context prior to invoking the asynchronous S3 avatar storage upload. This held row-level database locks open for >300ms. Concurrent token refresh workers updating \`users.last_active_at\` caused circular wait conditions (PostgreSQL error \`40P01: deadlock detected\`).

#### Key Modifications
1. **I/O Decoupling**: Moved avatar upload to external object store before acquiring database transaction.
2. **Pessimistic Row Locking**: Used \`select(User).with_for_update()\` to guarantee orderly lock acquisition during updates.
3. **Regression Test**: Added \`test_concurrent_profile_and_token_refresh\` with 50 parallel asynchronous tasks.

#### Verification
- **Unit & Concurrency Tests**: 24/24 passing in 3.12s.
- **Coverage**: +3.7% in \`services/user_service.py\`.
- **Breaking Changes**: None. Zero database migrations required.`,
    changelogEntry:
      "Fix: Resolved database deadlock during concurrent profile updates and auth session refreshes (#PP-101).",
    releaseNotes:
      "Improved profile update API resilience under high concurrent load by decoupling network IO from database transactions.",
    affectedComponents: [
      "services/user_service.py",
      "tests/services/test_user_service.py",
      "api/v1/routes/users.py",
    ],
  },
};

export const MOCK_ISSUES_LIST: IssueDetail[] = [
  ISSUE_PP_101,
  {
    id: "PP-102",
    title: "Payment webhook retry causes duplicate charge",
    repository: "payments-gateway",
    status: "Testing",
    priority: "critical",
    author: "sarah.m@company.internal",
    assignedAgent: "TestRunnerAgent",
    createdAt: "2026-10-23T06:20:10Z",
    updatedAt: "2026-10-23T09:30:15Z",
    branch: "patchpilot/pp-102-idempotency-key",
    targetCommit: "3c7b119",
    timeline: [
      {
        stage: "Requirements Analysis",
        agentName: "RequirementsAnalystAgent",
        status: "complete",
        duration: "1m 15s",
        model: "Gemini 1.5 Pro",
        summary: "Parsed Stripe webhook retry documentation and idempotency specs.",
      },
      {
        stage: "Bug Investigation",
        agentName: "CodeInvestigatorAgent",
        status: "complete",
        duration: "4m 10s",
        model: "Gemini 1.5 Pro",
        summary: "Located missing unique constraint on stripe_event_id in webhook_events table.",
      },
      {
        stage: "Coding Assistant",
        agentName: "PatchEngineerAgent",
        status: "complete",
        duration: "5m 20s",
        model: "Gemini 1.5 Pro",
        summary: "Added Redis distributed lock and unique database index on idempotency key.",
      },
      {
        stage: "Testing",
        agentName: "TestRunnerAgent",
        status: "in_progress",
        duration: "running...",
        model: "Isolated Runner Sandbox",
        summary: "Running 100 simultaneous webhook replay attacks in test container.",
      },
      {
        stage: "Code Review",
        agentName: "CodeReviewerAgent",
        status: "pending",
        model: "Gemini 1.5 Pro",
        summary: "Awaiting test suite completion.",
      },
      {
        stage: "Documentation",
        agentName: "DocGeneratorAgent",
        status: "pending",
        model: "Gemini 1.5 Flash",
        summary: "Queued.",
      },
    ],
    rootCauseSummary:
      "Missing idempotency validation check before ledger balance write during incoming webhook retries.",
    evidence: [],
    proposedPlan: [],
    diffs: [],
    testResults: {
      suiteName: "pytest (Payments)",
      totalTests: 42,
      passed: 38,
      failed: 0,
      skipped: 0,
      durationSeconds: 4.8,
      coverage: { before: 91.0, after: 93.4, delta: 2.4 },
      testCases: [],
    },
    review: {
      reviewerName: "CodeReviewerAgent",
      overallScore: 0,
      recommendation: "Comment",
      checks: [],
      automatedSummary: "In progress",
    },
    documentation: {
      prTitle: "fix(webhook): enforce distributed lock on stripe webhook ingestion",
      branchName: "patchpilot/pp-102-idempotency-key",
      targetBranch: "main",
      prBody: "Pending completion",
      changelogEntry: "Pending",
      releaseNotes: "Pending",
      affectedComponents: ["services/webhook_service.py"],
    },
  },
  {
    id: "PP-103",
    title: "Cart checkout latency spikes above 2500ms",
    repository: "storefront-api",
    status: "In progress",
    priority: "high",
    author: "dave.k@company.internal",
    assignedAgent: "CodeInvestigatorAgent",
    createdAt: "2026-10-23T07:11:00Z",
    updatedAt: "2026-10-23T09:12:44Z",
    branch: "patchpilot/pp-103-cart-n-plus-one",
    targetCommit: "7b4c810",
    timeline: [
      {
        stage: "Requirements Analysis",
        agentName: "RequirementsAnalystAgent",
        status: "complete",
        duration: "2m 01s",
        model: "Gemini 1.5 Pro",
        summary: "Profiled p99 response times exceeding SLA on checkout completion endpoint.",
      },
      {
        stage: "Bug Investigation",
        agentName: "CodeInvestigatorAgent",
        status: "in_progress",
        duration: "running...",
        model: "Gemini 1.5 Pro",
        summary: "Detected N+1 database queries on inventory reservation during checkout.",
      },
      {
        stage: "Coding Assistant",
        agentName: "PatchEngineerAgent",
        status: "pending",
        model: "Gemini 1.5 Pro",
        summary: "Queued for batch query refactoring.",
      },
      {
        stage: "Testing",
        agentName: "TestRunnerAgent",
        status: "pending",
        model: "Isolated Runner Sandbox",
        summary: "Queued.",
      },
      {
        stage: "Code Review",
        agentName: "CodeReviewerAgent",
        status: "pending",
        model: "Gemini 1.5 Pro",
        summary: "Queued.",
      },
      {
        stage: "Documentation",
        agentName: "DocGeneratorAgent",
        status: "pending",
        model: "Gemini 1.5 Flash",
        summary: "Queued.",
      },
    ],
    rootCauseSummary:
      "N+1 SQL queries triggered when querying supplier inventories individually inside cart item loop.",
    evidence: [],
    proposedPlan: [],
    diffs: [],
    testResults: {
      suiteName: "pytest (Storefront)",
      totalTests: 16,
      passed: 16,
      failed: 0,
      skipped: 0,
      durationSeconds: 1.8,
      coverage: { before: 84.0, after: 84.0, delta: 0.0 },
      testCases: [],
    },
    review: {
      reviewerName: "CodeReviewerAgent",
      overallScore: 0,
      recommendation: "Comment",
      checks: [],
      automatedSummary: "Pending",
    },
    documentation: {
      prTitle: "perf(cart): batch inventory lookup queries during checkout",
      branchName: "patchpilot/pp-103-cart-n-plus-one",
      targetBranch: "main",
      prBody: "Pending",
      changelogEntry: "Pending",
      releaseNotes: "Pending",
      affectedComponents: ["services/cart_service.py"],
    },
  },
  {
    id: "PP-104",
    title: "OAuth2 refresh token expiration edge-case",
    repository: "auth-service",
    status: "In progress",
    priority: "medium",
    author: "rachel.w@company.internal",
    assignedAgent: "RequirementsAnalystAgent",
    createdAt: "2026-10-23T08:50:33Z",
    updatedAt: "2026-10-23T09:05:12Z",
    branch: "patchpilot/pp-104-oauth-refresh",
    targetCommit: "1f8e402",
    timeline: [
      {
        stage: "Requirements Analysis",
        agentName: "RequirementsAnalystAgent",
        status: "in_progress",
        duration: "running...",
        model: "Gemini 1.5 Pro",
        summary: "Deconstructing refresh token rotation specs under clock skew.",
      },
      {
        stage: "Bug Investigation",
        agentName: "CodeInvestigatorAgent",
        status: "pending",
        model: "Gemini 1.5 Pro",
        summary: "Queued.",
      },
      {
        stage: "Coding Assistant",
        agentName: "PatchEngineerAgent",
        status: "pending",
        model: "Gemini 1.5 Pro",
        summary: "Queued.",
      },
      {
        stage: "Testing",
        agentName: "TestRunnerAgent",
        status: "pending",
        model: "Isolated Runner Sandbox",
        summary: "Queued.",
      },
      {
        stage: "Code Review",
        agentName: "CodeReviewerAgent",
        status: "pending",
        model: "Gemini 1.5 Pro",
        summary: "Queued.",
      },
      {
        stage: "Documentation",
        agentName: "DocGeneratorAgent",
        status: "pending",
        model: "Gemini 1.5 Flash",
        summary: "Queued.",
      },
    ],
    rootCauseSummary:
      "Clock skew between microservices causes token validation to reject valid tokens issued within 30-second window.",
    evidence: [],
    proposedPlan: [],
    diffs: [],
    testResults: {
      suiteName: "pytest (Auth)",
      totalTests: 30,
      passed: 30,
      failed: 0,
      skipped: 0,
      durationSeconds: 2.1,
      coverage: { before: 94.0, after: 94.0, delta: 0.0 },
      testCases: [],
    },
    review: {
      reviewerName: "CodeReviewerAgent",
      overallScore: 0,
      recommendation: "Comment",
      checks: [],
      automatedSummary: "Pending",
    },
    documentation: {
      prTitle: "fix(auth): add 60-second leeway to jwt expiration verification",
      branchName: "patchpilot/pp-104-oauth-refresh",
      targetBranch: "main",
      prBody: "Pending",
      changelogEntry: "Pending",
      releaseNotes: "Pending",
      affectedComponents: ["core/jwt_handler.py"],
    },
  },
  {
    id: "PP-105",
    title: "Memory leak in background image processing worker",
    repository: "media-processor",
    status: "Review required",
    priority: "high",
    author: "kevin.t@company.internal",
    assignedAgent: "CodeReviewerAgent",
    createdAt: "2026-10-22T19:40:11Z",
    updatedAt: "2026-10-23T06:14:02Z",
    branch: "patchpilot/pp-105-pillow-buffer-leak",
    targetCommit: "9c3e551",
    timeline: [
      {
        stage: "Requirements Analysis",
        agentName: "RequirementsAnalystAgent",
        status: "complete",
        duration: "1m 30s",
        model: "Gemini 1.5 Pro",
        summary: "Profiled memory growth in Celery worker handling high-res TIFF/WEBP transcoding.",
      },
      {
        stage: "Bug Investigation",
        agentName: "CodeInvestigatorAgent",
        status: "complete",
        duration: "5m 12s",
        model: "Gemini 1.5 Pro",
        summary: "Identified unclosed BytesIO buffers retained in image metadata cache.",
      },
      {
        stage: "Coding Assistant",
        agentName: "PatchEngineerAgent",
        status: "complete",
        duration: "3m 45s",
        model: "Gemini 1.5 Pro",
        summary: "Wrapped buffer transformations in contextmanager with explicit .close() calls.",
      },
      {
        stage: "Testing",
        agentName: "TestRunnerAgent",
        status: "complete",
        duration: "6m 10s",
        model: "Isolated Runner Sandbox",
        summary: "Ran 1,000 image transformation benchmark; memory footprint held constant at 140MB.",
      },
      {
        stage: "Code Review",
        agentName: "CodeReviewerAgent",
        status: "in_progress",
        duration: "running...",
        model: "Gemini 1.5 Pro",
        summary: "Automated review checklist verification underway.",
      },
      {
        stage: "Documentation",
        agentName: "DocGeneratorAgent",
        status: "pending",
        model: "Gemini 1.5 Flash",
        summary: "Queued.",
      },
    ],
    rootCauseSummary:
      "Image buffers opened via PIL were not deterministically released inside worker process threadpool.",
    evidence: [],
    proposedPlan: [],
    diffs: [],
    testResults: {
      suiteName: "pytest (Media)",
      totalTests: 14,
      passed: 14,
      failed: 0,
      skipped: 0,
      durationSeconds: 5.2,
      coverage: { before: 87.0, after: 89.5, delta: 2.5 },
      testCases: [],
    },
    review: {
      reviewerName: "CodeReviewerAgent",
      overallScore: 92,
      recommendation: "Approve",
      checks: [],
      automatedSummary: "Under final review",
    },
    documentation: {
      prTitle: "fix(media): close in-memory image buffers to prevent worker leak",
      branchName: "patchpilot/pp-105-pillow-buffer-leak",
      targetBranch: "main",
      prBody: "Pending",
      changelogEntry: "Pending",
      releaseNotes: "Pending",
      affectedComponents: ["workers/transcoder.py"],
    },
  },
  {
    id: "PP-106",
    title: "Missing idempotency key on refund endpoint",
    repository: "payments-gateway",
    status: "Investigation complete",
    priority: "medium",
    author: "sarah.m@company.internal",
    assignedAgent: "PatchPilot Orchestrator v1.4",
    createdAt: "2026-10-22T14:10:00Z",
    updatedAt: "2026-10-22T17:35:19Z",
    branch: "patchpilot/pp-106-refund-idempotency",
    targetCommit: "5d2b77a",
    timeline: [
      {
        stage: "Requirements Analysis",
        agentName: "RequirementsAnalystAgent",
        status: "complete",
        duration: "1m 10s",
        model: "Gemini 1.5 Pro",
        summary: "Analyzed refund API contract and gateway payload standards.",
      },
      {
        stage: "Bug Investigation",
        agentName: "CodeInvestigatorAgent",
        status: "complete",
        duration: "3m 40s",
        model: "Gemini 1.5 Pro",
        summary: "Found refund controller lacked Idempotency-Key header inspection.",
      },
      {
        stage: "Coding Assistant",
        agentName: "PatchEngineerAgent",
        status: "complete",
        duration: "4m 15s",
        model: "Gemini 1.5 Pro",
        summary: "Added Idempotency-Key validation header and cache check.",
      },
      {
        stage: "Testing",
        agentName: "TestRunnerAgent",
        status: "complete",
        duration: "3m 30s",
        model: "Isolated Runner Sandbox",
        summary: "12 unit tests verifying duplicate refund prevention passed.",
      },
      {
        stage: "Code Review",
        agentName: "CodeReviewerAgent",
        status: "complete",
        duration: "2m 50s",
        model: "Gemini 1.5 Pro",
        summary: "Code review approved.",
      },
      {
        stage: "Documentation",
        agentName: "DocGeneratorAgent",
        status: "complete",
        duration: "1m 15s",
        model: "Gemini 1.5 Flash",
        summary: "PR and API schema docs generated.",
      },
    ],
    rootCauseSummary:
      "Refund endpoint did not enforce or record customer idempotency headers during duplicate network submissions.",
    evidence: [],
    proposedPlan: [],
    diffs: [],
    testResults: {
      suiteName: "pytest (Refunds)",
      totalTests: 18,
      passed: 18,
      failed: 0,
      skipped: 0,
      durationSeconds: 2.4,
      coverage: { before: 89.0, after: 91.0, delta: 2.0 },
      testCases: [],
    },
    review: {
      reviewerName: "CodeReviewerAgent",
      overallScore: 96,
      recommendation: "Approve",
      checks: [],
      automatedSummary: "Ready for deployment",
    },
    documentation: {
      prTitle: "feat(payments): require idempotency key for refund requests",
      branchName: "patchpilot/pp-106-refund-idempotency",
      targetBranch: "main",
      prBody: "Ready",
      changelogEntry: "Ready",
      releaseNotes: "Ready",
      affectedComponents: ["api/v1/routes/refunds.py"],
    },
  },
];

export const SYSTEM_METRICS = {
  activeInvestigations: 3,
  resolvedToday: 5,
  testSuitePassRate: "99.4%",
  meanInvestigationDuration: "18m 42s",
  totalRepositoriesConnected: 8,
  activeWorkerAgents: 6,
};
