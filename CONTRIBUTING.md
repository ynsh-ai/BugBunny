# Contributing to BugBunny

Thank you for your interest in contributing to BugBunny! We welcome contributions from developers of all experience levels.

Please review this guide before opening an issue or submitting a pull request.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with respect and professionalism.

---

## Development Setup

### 1. Prerequisites
- **Git** 2.30+
- **Python** 3.11+ (Python 3.12 recommended)
- **Node.js** 20+ (with npm)
- **Docker & Docker Compose** (optional for local database containerization)

### 2. Fork and Clone
```bash
git clone https://github.com/ynsh-ai/BugBunny.git
cd BugBunny
```

### 3. Setup Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 4. Setup Frontend
```bash
cd frontend
npm install
cd ..
```

---

## Branching Conventions

Create feature or fix branches from `main`. Use descriptive, hyphen-separated branch names prefixed by category:

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feat/` | New feature or capability | `feat/gemini-provider-adapter` |
| `fix/` | Bug fix or error resolution | `fix/db-connection-retry` |
| `docs/` | Documentation updates | `docs/agent-architecture-diagrams` |
| `refactor/` | Code refactoring without behavior changes | `refactor/pydantic-v2-schemas` |
| `test/` | Adding or updating tests | `test/investigation-flow-e2e` |

```bash
git checkout -b feat/my-new-feature
```

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <short imperative summary>

[optional body explaining context and rationale]

[optional footer(s) referencing issue numbers]
```

### Common Types:
- `feat`: A new feature or capability
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Changes that do not affect code meaning (formatting, whitespace)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependency updates, or tooling

### Examples:
- `feat(agents): implement tool definition for AST symbol extraction`
- `fix(backend): resolve serialization deadlock in demo seed transaction`
- `docs(readme): add system architecture diagram and feature matrix`

---

## Quality & Verification Checklist

Before submitting a pull request, verify all automated checks pass locally:

```bash
# 1. Run backend tests (all must pass)
./backend/.venv/bin/pytest backend/tests -v

# 2. Run backend Ruff linter
./backend/.venv/bin/ruff check backend

# 3. Run frontend linter
cd frontend && npm run lint

# 4. Run frontend production build (verifies TypeScript types & routes)
cd frontend && npm run build
```

---

## Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/my-new-feature
   ```
2. Open a Pull Request against the `main` branch of `ynsh-ai/BugBunny`.
3. Fill out the PR description template:
   - **Summary of Changes**: What was added, fixed, or changed?
   - **Motivation / Problem**: Why was this change needed?
   - **Testing Performed**: Which unit or integration tests were executed?
   - **Linked Issues**: Reference related issues (e.g., `Fixes #12`).
4. Ensure CI checks pass. Maintainers will review your PR and provide constructive feedback.

---

## Questions and Discussions

If you have questions about system architecture or feature proposals before writing code, feel free to open a [GitHub Issue](https://github.com/ynsh-ai/BugBunny/issues) marked with the `question` or `proposal` label.
