# BugBunny Security Specification & Guardrails

This document outlines the security architecture, strict read-only design guarantees, sandboxing restrictions, and live model safety policies implemented in BugBunny Milestone 3.

---

## 1. Core Security Principles

BugBunny adheres to three non-negotiable security rules:
1. **Zero Unapproved Changes**: BugBunny proposes fixes; it does not commit, push, or modify target repositories.
2. **Read-Only GitHub Ingestion**: All remote repository and issue imports use HTTP `GET` exclusively. Zero write APIs or mutation endpoints exist.
3. **No Code Execution on Untrusted Repositories**: Remote codebase test runners never execute arbitrary shell commands.

---

## 2. Read-Only GitHub Integration Architecture

### Strict HTTP GET Guarantee
The GitHub service layer (`app.services.github_service.GitHubService`) dispatches requests using a strictly bounded HTTP transport that only invokes HTTP `GET`.
- **No Repository Mutations**: No branch creation, commit creation, tag creation, or repo forks.
- **No Pull Request Creation**: Patches are generated and stored as database artifacts for human review.
- **No Issue Modifications**: BugBunny does not add comments, edit labels, or close issues.

### Strict URL Validation
Every GitHub URL imported through `POST /api/v1/github/import-repository` or `POST /api/v1/github/import-issue` is validated strictly:
- Hostname must be exactly `github.com` or `www.github.com`.
- Repository path must adhere to `^([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)$`.
- Issue path must adhere to `^([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/issues/(\d+)$`.
- Path traversal sequences (`..`), URL encoding escapes (`%2e%2e`), or shell metacharacters are strictly rejected with an explicit 400 error.
- Private repositories are rejected upfront (`400 Bad Request`) to avoid accidental ingestion of private source code.

### Safe File Tree Filtering & Ingestion Limits
When indexing public repositories, BugBunny downloads bounded file tree metadata from GitHub's Git Trees API. Any unsafe file is filtered out before caching in PostgreSQL:

| Category | Filter Rule / Blocked Pattern | Security Reason |
| :--- | :--- | :--- |
| **Environment & Secrets** | `.env*`, `*.pem`, `*.key`, `id_rsa*` | Prevents ingestion of sensitive keys |
| **Dependencies & Virtualenvs** | `node_modules`, `.venv`, `venv`, `vendor`, `__pycache__` | Prevents bloat and untrusted vendor scripts |
| **Package Lockfiles** | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock` | Prevents excessive memory and token usage |
| **Binaries & Compiled Code** | `.png`, `.jpg`, `.so`, `.dylib`, `.dll`, `.exe`, `.wasm`, `.zip` | Prevents binary execution / corruption |
| **Oversized Files** | Files exceeding `100 KB` (`102,400 bytes`) | Bounds memory and free tier token limits |
| **Tree Depth & Count** | Max 100 safe files indexed | Limits token usage and API exhaustion |

---

## 3. Remote Sandbox & Code Execution Guard

### The Problem
When investigating an imported third-party GitHub issue, the codebase contains arbitrary code written by external authors. Running `pytest` or `npm test` against remote code could execute malicious test fixtures or setup scripts.

### The Guardrail
The test runner tool (`app.tools.codebase_tools.run_test_command`) and orchestrator verify if the active issue belongs to a remote repository (`mode == "connected_read_only"`):
- If `mode == "connected_read_only"`, **subprocess execution is strictly bypassed**.
- The Test Runner agent synthesizes recommended test command suites and test cases based on the plan and diff analysis.
- Subprocess commands are permitted **only** in local development environments where the developer has explicitly opted in and configured local allowlists.

---

## 4. Live Gemini Model Integration & Free Tier Protections

BugBunny supports both **Demo Mode** (default) and **Live Gemini Mode** via the OpenAI Agents SDK provider adapter.

### Demo Mode Isolation
- In Demo Mode (`AGENT_MODE=demo`), BugBunny makes **zero external HTTP or network calls**.
- All agent turns execute deterministically using seeded domain intelligence.
- Unit tests verify that `httpx.AsyncClient.send` is never invoked during Demo Mode.

### Live Mode Guardrails & Rate Limits
When `AGENT_MODE=live` is configured:
1. **Credential Secrecy**:
   - `GEMINI_API_KEY` and `GITHUB_TOKEN` are server-side only.
   - Credentials are never returned in JSON endpoints, logs, or error responses.
2. **15 RPM Rate Limiting**:
   - Free Gemini API tiers enforce strict request-per-minute limits.
   - `ModelProvider.check_rate_limit()` maintains a sliding-window rate limiter restricting execution to 15 RPM.
   - Exceeding the limit raises `RateLimitExceededError` before making an external call.
3. **Input / Output Token Bounds**:
   - Agent prompt inputs are bounded to `12,000` characters (`MAX_INPUT_CHARS`).
   - Generation parameters enforce `max_tokens=2048` to prevent quota drain.
4. **Error Sanitization**:
   - Raw provider exceptions (such as Google API tracebacks, internal IPs, or auth error dumps) are intercepted by `sanitize_error()`.
   - Users and browsers receive standardized, human-readable error messages without internal disclosures.

---

## 5. Human Approval Gate

Every investigation culminates in the **Human Approval Gate**:
- The final investigation status is set to `awaiting_approval`.
- Proposed diffs and changelogs remain proposals.
- Approval requires an authenticated reviewer action via `POST /api/v1/investigations/{id}/decision`.
- If rejected, the reason is logged in `ApprovalDecision` and the issue marked `Rejected`.
