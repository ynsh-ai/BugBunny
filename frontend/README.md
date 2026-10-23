# BugBunny — Frontend Dashboard

Autonomous multi-agent software engineering assistant user interface built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

## Features
- **Developer-Focused UI**: Dark theme, high density, accessible contrast, restrained motion.
- **Agent Lifecycle Visualizer**: Requirements Analysis → Bug Investigation → Coding Assistant → Testing → Code Review → Documentation.
- **Root Cause & Patch Inspector**: Interactive file diffs, test regression output, reproduction command runner, and PR generator.
- **Production Container**: Docker multi-stage standalone output.

## Getting Started

### Local Development
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t bugbunny-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 bugbunny-frontend
```
