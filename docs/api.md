# BugBunny — API Reference Specification

The BugBunny Backend API is built using **FastAPI** and provides asynchronous REST endpoints for querying repositories, ingesting GitHub issues, and retrieving multi-agent investigation traces.

All requests and responses use standard JSON payloads validated by **Pydantic v2** schemas.

---

## 1. General Conventions

- **Base URL (Local)**: `http://localhost:8000`
- **Interactive OpenAPI UI**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`
- **Content-Type**: `application/json`
- **Error Format**: All non-2xx responses return standard FastAPI error bodies:
  ```json
  {
    "detail": "Error description message"
  }
  ```

---

## 2. Health & Diagnostic Endpoints

### 2.1 Service Health Check
Returns the operational status, project name, environment, and current UTC timestamp.

- **Route**: `GET /health` (also aliased at `GET /api/health`)
- **Status**: `200 OK`
- **Response Schema** (`HealthResponse`):
  ```json
  {
    "status": "healthy",
    "service": "BugBunny",
    "version": "0.1.0-alpha",
    "environment": "development",
    "timestamp": "2026-10-23T12:00:00.000000Z"
  }
  ```

### 2.2 Root Index
Provides discovery links to documentation, health, and API routes.

- **Route**: `GET /`
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "name": "BugBunny",
    "version": "0.1.0-alpha",
    "docs": "/docs",
    "health": "/health",
    "api": "/api"
  }
  ```

---

## 3. Issues API

### 3.1 List Issues
Retrieves a paginated list of GitHub issues ingested into BugBunny, including their associated repository name and latest investigation status.

- **Route**: `GET /api/issues`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `status` | `string` | No | `None` | Filter by status (`open`, `in_progress`, `completed`, `failed`) |
  | `limit` | `integer`| No | `50` | Maximum number of records to return (1-100) |
  | `offset` | `integer`| No | `0` | Offset for pagination |
- **Status**: `200 OK`
- **Response Schema** (`list[IssueListItem]`):
  ```json
  [
    {
      "id": 1,
      "issue_key": "PP-101",
      "repository_id": 1,
      "repository_name": "demo-ecommerce-app",
      "github_issue_number": 101,
      "title": "Profile update returns 500 error",
      "author": "alex.chen@company.internal",
      "status": "completed",
      "priority": "high",
      "created_at": "2026-10-23T08:14:22Z",
      "updated_at": "2026-10-23T09:41:05Z",
      "latest_investigation_id": 1,
      "latest_investigation_status": "completed"
    }
  ]
  ```

---

### 3.2 Get Issue Detail
Fetches detailed metadata for a specific issue by its numeric database ID or string issue key (e.g., `PP-101`).

- **Route**: `GET /api/issues/{issue_id}`
- **Path Parameters**:
  - `issue_id`: `string` or `integer` — Database ID (e.g., `1`) or issue key (e.g., `PP-101`).
- **Status Codes**:
  - `200 OK`: Issue found.
  - `404 Not Found`: Issue does not exist.
- **Response Schema** (`IssueDetailResponse`):
  ```json
  {
    "id": 1,
    "issue_key": "PP-101",
    "repository_id": 1,
    "repository_name": "demo-ecommerce-app",
    "github_issue_number": 101,
    "title": "Profile update returns 500 error",
    "description": "Users encounter intermittent HTTP 500 Internal Server Errors when updating their profile avatar while actively refreshing authentication tokens.",
    "author": "alex.chen@company.internal",
    "status": "completed",
    "priority": "high",
    "created_at": "2026-10-23T08:14:22Z",
    "updated_at": "2026-10-23T09:41:05Z",
    "latest_investigation": {
      "id": 1,
      "status": "completed",
      "branch_name": "bugbunny/pp-101-profile-deadlock-fix",
      "target_commit": "8f2a9e1",
      "started_at": "2026-10-23T08:14:25Z",
      "completed_at": "2026-10-23T08:38:45Z"
    }
  }
  ```

---

### 3.3 Trigger New Investigation
Initiates an asynchronous multi-agent investigation pipeline for a given issue.

- **Route**: `POST /api/issues/{issue_id}/investigations`
- **Path Parameters**:
  - `issue_id`: `string` or `integer` — Target issue key or ID.
- **Request Body** (`InvestigationCreateRequest` - Optional):
  ```json
  {
    "branch_name": "bugbunny/pp-101-investigation",
    "priority_override": "high"
  }
  ```
- **Status Codes**:
  - `201 Created`: Investigation initialized successfully.
  - `404 Not Found`: Target issue not found.
- **Response Schema** (`InvestigationResponse`):
  ```json
  {
    "id": 2,
    "issue_id": 1,
    "issue_key": "PP-101",
    "status": "in_progress",
    "branch_name": "bugbunny/pp-101-investigation",
    "target_commit": "HEAD",
    "started_at": "2026-10-23T12:00:00Z",
    "completed_at": null,
    "agent_runs": [
      {
        "id": 7,
        "stage": "Requirements Analysis",
        "agent_name": "RequirementsAnalystAgent",
        "status": "in_progress",
        "model": "Gemini 1.5 Pro",
        "duration": null,
        "summary": "Parsing acceptance criteria and reproduction scope...",
        "started_at": "2026-10-23T12:00:00Z",
        "completed_at": null
      }
    ]
  }
  ```

---

## 4. Investigations API

### 4.1 Get Investigation Details
Retrieves complete execution telemetry, root-cause evidence, plan steps, generated code diff, test suite metrics, and code review audit.

- **Route**: `GET /api/investigations/{investigation_id}`
- **Path Parameters**:
  - `investigation_id`: `integer` — Unique ID of the investigation entity.
- **Status Codes**:
  - `200 OK`: Investigation record found.
  - `404 Not Found`: Investigation record not found.
- **Response Schema**:
  ```json
  {
    "id": 1,
    "issue_id": 1,
    "issue_key": "PP-101",
    "status": "completed",
    "branch_name": "bugbunny/pp-101-profile-deadlock-fix",
    "target_commit": "8f2a9e1",
    "root_cause_summary": "A database transaction serialization deadlock occurs when updating user profiles concurrently with background token refresh workers...",
    "evidence": [
      {
        "id": "ev-1",
        "type": "stack_trace",
        "title": "Production Sentry Exception Log",
        "location": "demo-ecommerce-app / prod-us-east-1",
        "description": "psycopg2.errors.DeadlockDetected: deadlock detected during concurrent updates"
      }
    ],
    "proposed_plan": [
      {
        "stepNumber": 1,
        "title": "Decouple Network Storage I/O from Database Transaction",
        "targetFile": "services/user_service.py",
        "action": "modify",
        "risk": "medium"
      }
    ],
    "code_diff": "--- a/services/user_service.py\n+++ b/services/user_service.py\n@@ -136,12 +136,16 @@ async def update_user_profile(...)\n-        await db_session.commit()\n+        await db_session.flush()\n",
    "test_results": {
      "suiteName": "pytest (Unit & Concurrency Regressions)",
      "totalTests": 24,
      "passed": 24,
      "failed": 0,
      "durationSeconds": 3.12,
      "coverage": {
        "before": 88.4,
        "after": 92.1,
        "delta": 3.7
      }
    },
    "review_audit": {
      "reviewerName": "CodeReviewerAgent",
      "overallScore": 98,
      "recommendation": "Approve",
      "checks": [
        {"category": "Security", "status": "pass", "title": "Zero SQL injection risk"},
        {"category": "Performance", "status": "pass", "title": "Lock duration reduced by 98.5%"}
      ]
    },
    "documentation": {
      "prTitle": "fix(profile): decouple avatar upload IO and prevent 500 serialization deadlock",
      "branchName": "bugbunny/pp-101-profile-deadlock-fix",
      "targetBranch": "main",
      "prBody": "Resolves PP-101: decouples remote IO from transactional boundary.",
      "changelogEntry": "Fix: Prevent serialization deadlock during profile avatar updates (#PP-101)."
    },
    "started_at": "2026-10-23T08:14:25Z",
    "completed_at": "2026-10-23T08:38:45Z",
    "agent_runs": [
      {
        "id": 1,
        "stage": "Requirements Analysis",
        "agent_name": "RequirementsAnalystAgent",
        "status": "complete",
        "model": "Gemini 1.5 Pro",
        "duration": "1m 45s",
        "summary": "Analyzed user bug report and API telemetry...",
        "started_at": "2026-10-23T08:14:25Z",
        "completed_at": "2026-10-23T08:16:10Z"
      }
    ]
  }
  ```
