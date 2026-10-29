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

- **Route**: `GET /api/v1/issues`
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

- **Route**: `GET /api/v1/issues/{issue_id}`
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
Initiates the multi-agent investigation workflow for a given issue. In Demo Mode, executes the six-agent pipeline deterministically and returns the full investigation with all agent runs and structured artifacts.

- **Route**: `POST /api/v1/issues/{issue_id}/investigations`
- **Path Parameters**:
  - `issue_id`: `string` or `integer` — Target issue key (e.g. `PP-101`) or integer ID.
- **Request Body** (`InvestigationCreateRequest` - Optional):
  ```json
  {
    "branch_name": "bugbunny/pp-101-investigation",
    "priority_override": "high"
  }
  ```
- **Status Codes**:
  - `200 OK` / `201 Created`: Investigation executed or initialized successfully.
  - `404 Not Found`: Target issue not found.
- **Response Schema** (`InvestigationResponse`): Returns complete investigation state, status (`awaiting_approval`), `agent_runs`, `artifacts`, and synthesized diff/evidence.

---

## 4. Investigations API

### 4.1 Get Investigation Details
Retrieves complete execution telemetry, root-cause evidence, plan steps, generated code diff, test suite metrics, and code review audit.

- **Route**: `GET /api/v1/investigations/{investigation_id}`
- **Path Parameters**:
  - `investigation_id`: `integer` — Unique ID of the investigation entity.
- **Status Codes**:
  - `200 OK`: Investigation record found.
  - `404 Not Found`: Investigation record not found.

---

### 4.2 List Agent Runs
Returns the chronological list of all agent runs executed for an investigation, including stage name, agent persona, status, model, execution duration, and stage summary.

- **Route**: `GET /api/v1/investigations/{investigation_id}/runs`
- **Path Parameters**:
  - `investigation_id`: `integer` — Unique ID of the investigation entity.
- **Status Codes**:
  - `200 OK`: Agent runs retrieved.
  - `404 Not Found`: Investigation record not found.
- **Response Schema** (`list[AgentRunResponse]`):
  ```json
  [
    {
      "id": 1,
      "investigation_id": 1,
      "stage": "requirements_analyst",
      "agent_name": "RequirementsAnalystAgent",
      "status": "completed",
      "model": "gemini-demo-deterministic",
      "duration": "1.2s",
      "summary": "Completed requirements analysis for PP-101 with 95% confidence.",
      "started_at": "2026-10-29T12:00:00Z",
      "completed_at": "2026-10-29T12:00:01Z"
    }
  ]
  ```

---

### 4.3 List Agent Artifacts
Returns all typed structured artifacts persisted by agents during the investigation stages (Requirements Analysis, Investigation Evidence, Implementation Plan, Patch Proposal, Test Report, Code Review Report, Documentation Update).

- **Route**: `GET /api/v1/investigations/{investigation_id}/artifacts`
- **Path Parameters**:
  - `investigation_id`: `integer` — Unique ID of the investigation entity.
- **Status Codes**:
  - `200 OK`: Artifacts retrieved.
  - `404 Not Found`: Investigation record not found.
- **Response Schema** (`list[AgentArtifactResponse]`):
  ```json
  [
    {
      "id": 1,
      "investigation_id": 1,
      "stage": "requirements_analyst",
      "artifact_type": "RequirementsAnalysis",
      "payload": {
        "issue_key": "PP-101",
        "problem_statement": "Profile update triggers intermittent HTTP 500...",
        "confidence": 0.95,
        "risks": ["Potential DB lock contention"],
        "assumptions": ["Storage backend operates asynchronously"]
      },
      "created_at": "2026-10-29T12:00:01Z"
    }
  ]
  ```

---

### 4.4 Submit Human Approval Decision
Submits a human reviewer approval or rejection decision. Approving transitions the investigation audit state to `approved_for_export` and the issue status to `Approved`. **Note:** This is strictly an audit and export authorization gate—it does not alter repository files or automatically merge pull requests.

- **Route**: `POST /api/v1/investigations/{investigation_id}/decision`
- **Path Parameters**:
  - `investigation_id`: `integer` — Target investigation ID.
- **Request Body** (`ApprovalDecisionCreate`):
  ```json
  {
    "decision": "approve",
    "reviewer": "maintainer@company.internal",
    "comments": "Patch proposal verified and regression tests pass. Approved for export."
  }
  ```
- **Status Codes**:
  - `200 OK`: Decision recorded and state transitioned to `approved_for_export`.
  - `404 Not Found`: Investigation not found.
- **Response Schema** (`ApprovalDecisionResponse`):
  ```json
  {
    "id": 1,
    "investigation_id": 1,
    "decision": "approve",
    "reviewer": "maintainer@company.internal",
    "comments": "Patch proposal verified and regression tests pass. Approved for export.",
    "created_at": "2026-10-29T12:05:00Z"
  }
  ```
