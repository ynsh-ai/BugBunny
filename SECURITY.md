# Security Policy

## Supported Versions

Only the latest release and active development branch receive security updates.

| Version | Supported |
| :--- | :--- |
| `0.1.0-alpha` (Current main) | :white_check_mark: |
| `< 0.1.0` | :x: |

---

## Reporting a Vulnerability

We take the security of BugBunny seriously. If you discover a vulnerability or potential security concern, please disclose it responsibly.

### Responsible Disclosure Process
1. **Do not create a public GitHub issue** for undisclosed security vulnerabilities.
2. Email full vulnerability details to **ynsh.ai.codes@gmail.com** with the subject line:
   `[SECURITY] BugBunny Vulnerability Report`
3. Include:
   - Description of the vulnerability and affected component(s)
   - Step-by-step reproduction instructions or proof-of-concept
   - Impact assessment
   - Any suggested mitigations or patches
4. **Acknowledgement**: You will receive an initial response within 48 hours acknowledging receipt.
5. **Resolution**: We will coordinate verification, patch development, and a coordinated public disclosure date.

---

## Core Security Architecture & Principles

BugBunny enforces defense-in-depth principles across its AI agent pipeline and infrastructure:

### 1. Zero Committed Secrets
- API keys (OpenAI, Gemini, GitHub Tokens), database passwords, and session secrets are **never committed** to version control.
- Configuration is loaded strictly from environment variables via Pydantic `BaseSettings`.
- Git repositories enforce strict `.gitignore` rules covering `.env`, `.env*.local`, credentials, and temporary build outputs.

### 2. Server-Side Model Invocations Only
- Clients (web browser, external consumers) never directly communicate with LLM providers or retain provider API keys.
- All model calls, tool executions, and orchestration logic execute strictly within the FastAPI backend service.

### 3. Human Approval Gate
- Autonomous agents generate implementation plans, unified diffs, and verification reports, but **cannot apply code changes to production branches or merge pull requests autonomously**.
- A developer approval decision (`ApprovalDecision` record) is required before any persistent repository modification is committed.

### 4. Sandbox Isolation for Code Execution
- Agent investigations and automated test runs execute inside ephemeral, isolated Git worktree sandboxes (`/tmp/bugbunny_workspaces/`).
- Sandboxes are temporary, discarded after run completion, and prevent pollution of the primary working repository.

### 5. Safe Development Datasets
- During early development and testing, all issue streams, repository snapshots, and execution logs use sanitized, synthetic demo fixtures (`PP-101`, `demo-ecommerce-app`).
- No proprietary code or private personal data is ingested during test runs.
