# BugBunny — Frontend Workflow & Implementation Checklist

**Status:** Agreed product workflow / implementation specification  
**Scope:** Frontend only  
**Purpose:** Make the frontend's page structure and user journey clear before implementing the real backend integrations.

> This document defines the intended product experience. It is not a claim that every listed page, route, or integration already exists. Before changing code, inspect the current frontend and compare the actual implementation against this specification.

---

## 1. Product experience

BugBunny is an AI-powered engineering workspace that helps developers investigate GitHub issues, understand likely root causes, plan fixes, and review proposed changes with the help of specialized AI agents.

The frontend should make this journey understandable:

1. A visitor learns what BugBunny does.
2. The visitor signs up or logs in.
3. The user completes a short onboarding flow.
4. The user can connect GitHub and select a repository during onboarding, or skip these steps.
5. The user reaches the dashboard.
6. The user can manage GitHub and repositories later from the dashboard.
7. The user opens an issue and starts an investigation.
8. The user follows the investigation and reviews its findings and artifacts.
9. The user can return later to previously saved investigations.

The landing page is a public product introduction. It must not behave like a logged-in dashboard.

---

## 2. Main user journey

```text
Public landing page
        |
        v
   Get Started
        |
        v
  Login / Sign up
        |
        v
    Onboarding
        |
        +---- Welcome and profile
        |
        +---- Connect GitHub (optional)
        |
        +---- Select repository (optional)
        |
        v
     Dashboard
        |
        +---- Overview
        +---- Repositories
        |        |
        |        +---- Repository workspace
        |
        +---- Issues
        |        |
        |        +---- Issue details
        |                 |
        |                 +---- Start investigation
        |
        +---- Investigations
        |        |
        |        +---- Investigation details
        |
        +---- Settings
                 |
                 +---- Account and preferences
                 +---- GitHub connection
                 +---- Repository management
```

A user who skips GitHub connection or repository selection must still be able to finish onboarding and enter the dashboard. The dashboard should then show a useful empty state and explain how to connect GitHub or add a repository.

---

## 3. Target route structure

Use this as the intended route structure. First inspect the actual Next.js app and its existing routes. Do not assume these paths already exist.

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Product landing page |
| `/login` | Public | Existing user login |
| `/signup` | Public | New account registration |
| `/onboarding` | Authenticated | Short first-time setup |
| `/dashboard` | Authenticated | Workspace overview |
| `/dashboard/repositories` | Authenticated | Connected repositories |
| `/dashboard/repositories/[id]` | Authenticated | Repository workspace |
| `/dashboard/issues` | Authenticated | Issues across connected repositories |
| `/dashboard/issues/[id]` | Authenticated | Issue details and investigation entry point |
| `/dashboard/investigations` | Authenticated | Investigation history |
| `/dashboard/investigations/[id]` | Authenticated | Investigation progress and results |
| `/dashboard/settings` | Authenticated | Account, integrations, and preferences |

### Route rules

- Keep one canonical route for each feature.
- Inspect imports, links, navigation, and redirects before removing or renaming existing routes.
- If older duplicate routes exist, migrate their links and add redirects where appropriate rather than breaking existing URLs.
- Protect authenticated routes.
- A signed-in user who has not completed onboarding should be directed to onboarding.
- A user who has completed onboarding should be directed to the dashboard after login.
- Do not expose private workspace data on public routes.

---

## 4. Page requirements

### 4.1 Public landing page — `/`

**Goal:** Explain BugBunny clearly and encourage visitors to get started.

Include:
- BugBunny name and a concise product statement.
- A clear explanation of the problem it solves: understanding and investigating software issues.
- A simple explanation of the investigation workflow.
- An overview of the specialized agents and their responsibilities.
- A primary **Get Started** action.
- A login action for returning users.
- A clean, responsive layout consistent with the existing design system.

Do not put logged-in workspace controls on this page. In particular, do not show repository import, issue management, investigation history, or dashboard actions as if the visitor were already authenticated.

### 4.2 Login and signup — `/login`, `/signup`

Include:
- Clear login and account-creation states.
- GitHub and Google sign-in options, if the existing authentication architecture supports them.
- Appropriate validation and error messages.
- Loading and disabled states while submitting.
- A clear route between login and signup.

Important distinction:
- **Signing in with GitHub** establishes the user's BugBunny identity.
- **Connecting GitHub for repository access** grants BugBunny permission to access the repositories the user selects.
- These are related but distinct concepts. Do not assume that a GitHub login automatically means repository access is fully configured.
- A user who signs in with Google must be able to connect GitHub separately.
- A user who signs in with GitHub should not be asked to repeat authorization if a valid grant with the required permissions already exists. The backend must confirm this.

Do not show a successful login or connected state unless the real authentication flow confirms it.

### 4.3 Onboarding — `/onboarding`

Keep onboarding short. Use four logical steps:

**Step 1 — Welcome**
- Briefly explain what happens next.
- Provide a clear Continue action.

**Step 2 — Developer profile**
- Ask only for useful initial information, such as the user's role and whether they are using BugBunny individually or with a team.
- Keep optional questions skippable.
- Do not ask for detailed agent configuration here.

**Step 3 — Connect GitHub (optional)**
- Explain why GitHub access is needed: to discover repositories and access the issues and code the user authorizes.
- Provide a Connect GitHub action.
- Clearly show connection success, failure, or cancellation.
- Provide **Skip for now**.
- Never mark GitHub as connected based only on a typed username, repository URL, or local UI state.

**Step 4 — Select a repository (optional)**
- If GitHub is connected, show repositories that the authenticated user is actually authorized to access.
- Allow the user to select a repository.
- If no repository is selected, allow the user to continue.
- If GitHub was skipped, explain that repositories can be added from the dashboard later.

At the end:
- Persist onboarding answers through the real API when available.
- Mark onboarding complete only after the required save succeeds.
- Send the user to `/dashboard`.

Do not make onboarding unnecessarily long. Agent behavior, autonomy, model settings, and detailed preferences belong in Settings and can be added later.

### 4.4 Dashboard overview — `/dashboard`

The dashboard is the authenticated home for the user's BugBunny workspace.

Include:
- A concise welcome/overview area.
- Connected repository summary.
- Recent issues or activity, when real data exists.
- Recent investigations and their statuses, when real data exists.
- A clear next action, such as adding a repository or investigating an issue.

**Empty state:** If the user skipped GitHub or has no repositories, explain what to do next and provide an action to connect GitHub or add a repository. Do not fill the dashboard with fake activity or invented metrics.

### 4.5 Repositories — `/dashboard/repositories`

Include:
- A list of repositories connected to the user's BugBunny workspace.
- Repository name and useful metadata when supplied by the API.
- Connection/import/indexing status where those states are supported.
- An action to add or connect another repository.
- An action to open a repository workspace.
- A safe way to remove a repository from the BugBunny workspace.

Removing a repository must not silently delete the user's historical investigations. Confirm destructive actions and explain their consequences.

### 4.6 Repository workspace — `/dashboard/repositories/[id]`

Show information about one connected repository.

Potential sections:
- Repository summary and connection status.
- Issues associated with the repository.
- Import or indexing status, if supported.
- Recent investigations for that repository.
- A clear way to open an issue and start an investigation.

Do not display indexing as complete unless the backend reports completion.

### 4.7 Issues — `/dashboard/issues`

Include:
- Issues from repositories connected to the current user.
- Useful issue information returned by the API, such as title, number, state, labels, repository, and update time.
- Filtering or search only where the underlying data supports it.
- Loading, empty, and error states.
- A link to the issue details page.

Do not show issues from repositories the user has not authorized.

### 4.8 Issue details — `/dashboard/issues/[id]`

Include:
- Issue title, number, description, labels, state, and repository context where available.
- A clear **Start Investigation** action.
- Existing investigation history for the issue, if available.
- A clear indication when an investigation is already running or has completed.

Starting an investigation must use the real API. Do not create a fake investigation record or show fabricated agent progress.

### 4.9 Investigations — `/dashboard/investigations`

Include:
- The user's saved investigations.
- Issue and repository context.
- Current status, such as queued, running, completed, failed, or awaiting user action, only if these statuses are supported by the backend.
- A way to reopen an investigation.

Do not invent investigation history or statuses.

### 4.10 Investigation details — `/dashboard/investigations/[id]`

This is a central product page.

Present the investigation in a way that a developer can understand:
- Issue and repository context.
- Overall investigation status.
- Agent activity and handoffs, when returned by the backend.
- Findings and supporting evidence.
- Likely root cause, clearly distinguished from confirmed facts.
- Proposed solution or implementation plan.
- Proposed patch/diff, if one exists.
- Test results, including actual output and failures.
- Code review findings and generated documentation/artifacts, if available.

Requirements:
- Make it clear which steps are complete, running, waiting, or failed.
- Show evidence and relevant file paths/line references when supplied.
- Distinguish generated suggestions from changes actually applied to a repository.
- Do not claim a patch was applied, tests passed, or an agent ran unless the backend confirms it.
- Handle failed or interrupted investigations honestly.
- Allow users to refresh or revisit saved results.

### 4.11 Settings — `/dashboard/settings`

Organize settings into understandable sections:

**Account**
- User profile and account information.

**GitHub connection**
- Current connection status.
- Connect or reconnect GitHub.
- Disconnect GitHub.
- Explain access problems or revoked permissions.

**Repositories**
- View and manage connected repositories.
- Add another repository.
- Remove a repository from the workspace.

**Preferences**
- Agent preferences and autonomy options, if supported.
- Other product preferences as they become available.

**Security and session**
- Sign-out and relevant account controls.

Settings must allow users to manage their setup after onboarding. Onboarding is not the only place where GitHub or repositories can be managed.

If GitHub access is revoked or expires, show the actual disconnected/error state and a reconnect action. Do not silently leave the UI showing a healthy connection.

---

## 5. Shared application layout

Authenticated pages should share a consistent dashboard shell.

Suggested navigation:
- Overview
- Repositories
- Issues
- Investigations
- Settings
- Account/profile menu

Requirements:
- Highlight the active section.
- Keep navigation consistent across authenticated routes.
- Provide responsive behavior for smaller screens.
- Include a clear sign-out action.
- Avoid duplicating navigation markup across every page if a shared layout can be used.

The landing page and authentication pages may use a separate public layout.

---

## 6. Required UI states

Every data-driven page must handle the states relevant to its operation:

- **Loading:** Show a clear loading indicator or skeleton.
- **Success:** Render data returned by the API.
- **Empty:** Explain why there is no content and provide a useful next action.
- **Error:** Explain what failed and provide retry or recovery guidance where possible.
- **Unauthenticated:** Direct the user to login when appropriate.
- **Forbidden:** Explain that the user does not have access.
- **Disconnected integration:** Explain how to reconnect GitHub.
- **In progress:** Show progress only when supported by actual backend status.
- **Partial result:** Clearly identify which information is available and which step failed.

Do not use hard-coded demo data as if it were the user's real workspace. If mock data is needed for isolated UI development, label it clearly and keep it out of production behavior.

---

## 7. Frontend/backend boundary

The frontend workflow can be implemented before the backend is repaired, but the UI must not pretend integrations are functional.

Before backend work:
- Inspect the existing API client and current endpoint usage.
- Reuse the existing API layer where practical.
- Identify missing endpoints and record them in a separate backend requirements document.
- Keep components ready to consume real API responses.
- Use explicit loading, unavailable, and integration-pending states where necessary.
- Do not invent API responses, authentication success, GitHub permissions, agent output, or test results.
- Do not add a second competing authentication or data-management system in the frontend.

The following require real backend confirmation:
- Account registration and login.
- GitHub OAuth and repository authorization.
- Listing authorized repositories.
- Adding/removing repositories.
- Fetching issues and repository data.
- Starting and tracking investigations.
- Saving and retrieving investigation results.
- Agent progress, evidence, patches, and test output.
- Persisting user settings and onboarding answers.

---

## 8. Design and implementation expectations

- Inspect and preserve the existing design system before introducing new styles.
- Keep the interface clean, professional, and consistent.
- Use the existing BugBunny visual direction: restrained off-white/light-grey surfaces, charcoal text, and lime/mint accents where appropriate.
- Avoid unnecessary gradients, excessive shadows, oversized cards, and dashboard clutter.
- Use consistent spacing, typography, buttons, forms, and status indicators.
- Make layouts responsive.
- Ensure keyboard accessibility, visible focus states, readable contrast, and descriptive labels.
- Reuse existing components when they are sound.
- Extract shared components only when doing so reduces duplication or improves consistency.
- Avoid adding paid services or dependencies. Prefer the current stack and existing packages.

---

## 9. Implementation sequence

Complete the frontend in this order. Do not start backend implementation as part of this frontend task.

### Phase 0 — Inspect before changing
- Map the actual App Router routes and layouts.
- Inspect page components, shared components, auth logic, API client, types, and styles.
- Identify duplicate/legacy routes.
- Identify mock data, placeholder actions, and fake success states.
- Record what already works, what is incomplete, and what is missing.
- Produce a short route/component audit before editing.

### Phase 1 — Finalize navigation and page structure
- Establish the canonical route structure.
- Establish public and authenticated layouts.
- Fix navigation links and route guards.
- Handle legacy routes safely.

### Phase 2 — Landing and authentication UI
- Finalize the public landing page.
- Ensure login/signup pages have consistent behavior and validation.
- Keep provider integration honest; do not simulate OAuth.

### Phase 3 — Onboarding
- Implement the four-step onboarding flow.
- Support optional GitHub connection and optional repository selection.
- Support skipping and completing setup later.
- Persist data only through the real available API.

### Phase 4 — Dashboard and workspace pages
- Implement dashboard overview and empty states.
- Implement repositories and repository workspace.
- Implement issues and issue details.
- Implement investigations list and investigation details.
- Implement settings, including later GitHub/repository management.

### Phase 5 — Consistency and quality
- Ensure loading, empty, error, and permission states.
- Check responsive layouts and accessibility.
- Remove dead links and duplicate UI.
- Ensure all buttons and controls have real, clearly defined behavior.
- Run lint, type checks, tests, and production build.

---

## 10. Acceptance checklist

The frontend workflow is ready for the backend phase when:

- [ ] A visitor can understand BugBunny from the public landing page.
- [ ] Get Started leads to login/signup.
- [ ] Public and authenticated routes are separated correctly.
- [ ] A signed-in user can complete the short onboarding flow.
- [ ] GitHub connection can be offered during onboarding without being mandatory.
- [ ] Repository selection can be offered during onboarding without being mandatory.
- [ ] A user can skip setup and still reach the dashboard.
- [ ] The dashboard has a useful empty state when no repository is connected.
- [ ] GitHub and repository management are available later in Settings/dashboard.
- [ ] Repository, issue, and investigation pages follow a consistent navigation structure.
- [ ] Issue details provide a clear investigation entry point.
- [ ] Investigation details can present progress, findings, evidence, patches, and test results without fabricating them.
- [ ] Legacy routes are handled without breaking existing links.
- [ ] No frontend action falsely claims that authentication, GitHub access, repository import, agent execution, patch application, or tests succeeded.
- [ ] Responsive layouts and accessibility basics are checked.
- [ ] Lint, type checks, tests, and production build have been run; actual results are recorded.

---

## 11. Instructions for the implementation agent

Before making changes:

1. Read this document fully.
2. Inspect the actual frontend source code and current Git state.
3. Compare the current routes and components against this specification.
4. Report the existing structure and proposed changes before making broad edits.
5. Reuse working components and styles. Do not rebuild the entire frontend unnecessarily.
6. Do not change backend code, database schema, migrations, OAuth configuration, deployment configuration, or secrets during this frontend phase.
7. Do not add paid dependencies or services.
8. Do not commit, push, merge, or deploy.
9. After each meaningful phase, run the relevant checks and report the exact results.
10. At completion, summarize changed files, routes added/updated/redirected, remaining backend dependencies, and test/build results.

**Stop condition:** If a frontend feature depends on an endpoint or authentication behavior that does not exist or cannot be verified, implement the honest UI state and document the required backend contract. Do not fake a working integration.

---

## 12. Handoff to backend phase

Once the frontend implementation is complete, create or update a separate backend requirements document based on the frontend's actual API needs.

The backend phase will then audit and implement the real integrations in this order:

1. Authentication and GitHub authorization.
2. Authorized repository listing and repository data access.
3. Issue retrieval and persistence.
4. Investigation creation and persistence.
5. Real agent orchestration and structured results.
6. Evidence, patch, review, and real test execution.
7. End-to-end verification from signup through a saved investigation.

The backend must support the workflow defined here. The frontend should not be redesigned around accidental limitations of placeholder backend behavior.
