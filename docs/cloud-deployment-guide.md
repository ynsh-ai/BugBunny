# BugBunny — 100% Free Cloud Deployment Walkthrough
### Vercel (Frontend) + Render (Backend) + Neon (Database)
**Zero local Docker required — Everything is hosted in the cloud.**

---

## Architecture

```mermaid
flowchart LR
    Browser([User Browser]) -->|HTTPS| Vercel[Frontend: Vercel (Next.js 16)]
    Vercel -->|REST API / HTTPS| Render[Backend: Render.com (FastAPI)]
    Render -->|SSL asyncpg| Neon[(Database: Neon.tech Serverless Postgres)]
```

---

## Phase 1: Database Setup on Neon (Free Tier)
*Time required: ~1 minute*

1. Go to **[neon.tech](https://neon.tech)** and sign up (or log in with GitHub).
2. Click **Create Project**:
   - **Name**: `bugbunny-db`
   - **Postgres version**: `16`
   - **Region**: Choose closest to you or `US East (Ohio)` (matches Render US East).
3. In your project dashboard, copy the **Connection string**:
   ```text
   postgresql://alex:AbC123_xyz@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this string — you will paste it into Render in Phase 2.

> [!NOTE]
> BugBunny's backend includes an automated normalizer and SSL handler: whether you paste `postgres://`, `postgresql://`, or `postgresql+asyncpg://`, it automatically negotiates the connection and SSL certificate with Neon.

---

## Phase 2: Backend Setup on Render (Free Tier)
*Time required: ~3 minutes*

1. Go to **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your repository: `ynsh-ai/patchpilot-ai` (or your fork).
4. Configure the service settings:
   - **Name**: `bugbunny-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Expand **Advanced** → Click **Add Environment Variable**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `ENVIRONMENT` | `production` | Production mode |
   | `DATABASE_URL` | `postgresql://...` *(from Phase 1)* | Your Neon connection string |
   | `SYNC_DATABASE_URL`| `postgresql://...` *(from Phase 1)* | Same Neon connection string |
   | `CORS_ORIGINS` | `*` | Allows your Vercel frontend to talk to this API |
6. Click **Create Web Service**.
7. Render will build and deploy the backend. On first startup, BugBunny automatically:
   - Connects to Neon via SSL
   - Creates database tables (`repositories`, `issues`, `investigations`, `agent_runs`)
   - Seeds the demo repository (`demo-ecommerce-app`) and issue (`PP-101`)
8. Once deployed, note down your Render service URL (e.g., `https://bugbunny-backend.onrender.com`).
   - Test it by visiting: `https://bugbunny-backend.onrender.com/health`

---

## Phase 3: Frontend Setup on Vercel (Free Tier)
*Time required: ~2 minutes*

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your repository (`patchpilot-ai`).
4. In the configuration screen:
   - **Project Name**: `bugbunny`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend` (crucial!)
5. Expand **Environment Variables**:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Render backend URL from Phase 2 (e.g., `https://bugbunny-backend.onrender.com`)
6. Click **Deploy**.
7. In ~60 seconds, Vercel will complete the build and give you a live production URL:
   `https://bugbunny.vercel.app` (or similar).

---

## Phase 4: Verification Checklist

1. Open your live Vercel URL in your browser:
   - **Overview page**: Displays system metrics, active repositories, and BugBunny branding.
   - **Issues page**: Displays the issue list (`/issues`).
   - **Investigation page**: Opens `PP-101` (`/issues/PP-101`) showcasing the 6-stage multi-agent timeline, diff viewer, and PR payload.
2. Test the API connection:
   - Open your browser's Developer Tools (Console / Network).
   - In the top navigation bar, the indicator will display: **`Orchestrator: Ready`** with green status.

Congratulations! Your entire multi-agent stack is deployed on the cloud with zero local Docker overhead.
