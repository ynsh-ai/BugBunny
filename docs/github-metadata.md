# GitHub Repository Metadata Guide

This document defines the recommended metadata, topics, description, and settings for the **BugBunny** GitHub repository to ensure optimal discoverability and portfolio presentation.

---

## 1. Repository Description

```text
Multi-agent AI engineering assistant that turns GitHub issues into evidence-backed implementation plans, tests, reviews, and documentation.
```

---

## 2. Suggested GitHub Topics (13 Topics)

Add these topics under your repository's "About" section to index the project under relevant AI engineering, multi-agent, and full-stack categories:

```text
ai-agents
multi-agent
openai-agents-sdk
gemini-api
fastapi
nextjs
typescript
python
github-api
developer-tools
software-engineering
llm
agentic-ai
```

---

## 3. Repository Website / Homepage URL

Leave blank until a real deployed production application URL exists and is ready for public traffic.

---

## 4. Updating Metadata via GitHub CLI (`gh`)

If you have the [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated on your machine, you can update the repository description and topics in a single command.

### Safe Command Preview:
```bash
gh repo edit ynsh-ai/BugBunny \
  --description "Multi-agent AI engineering assistant that turns GitHub issues into evidence-backed implementation plans, tests, reviews, and documentation." \
  --add-topic ai-agents \
  --add-topic multi-agent \
  --add-topic openai-agents-sdk \
  --add-topic gemini-api \
  --add-topic fastapi \
  --add-topic nextjs \
  --add-topic typescript \
  --add-topic python \
  --add-topic github-api \
  --add-topic developer-tools \
  --add-topic software-engineering \
  --add-topic llm \
  --add-topic agentic-ai
```

### Manual Configuration via Web Browser:
1. Navigate to your repository at **[https://github.com/ynsh-ai/BugBunny](https://github.com/ynsh-ai/BugBunny)**.
2. In the top right of the main code tab, click the **⚙️ Settings icon** next to **About**.
3. Paste the **Description** above.
4. Add the **Topics** one by one.
5. Click **Save changes**.
