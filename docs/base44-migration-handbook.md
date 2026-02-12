# Base44 to Self-Hosted Migration Handbook (Beginner Friendly)

This guide is written for this specific repository and is designed for someone new to coding.

## What this app is today


## Beginner click-by-click setup (VPS path)

This section is intentionally detailed for first-time users.

## Step 0 — Timeline (so you know what to expect)

- Account creation: **30 to 60 minutes**
- Tool installation on your computer: **30 to 90 minutes**
- Supabase project + env setup: **20 to 45 minutes**
- Database push + function deploy: **15 to 45 minutes**
- First local test: **10 to 30 minutes**

**Total beginner setup time:** about **2 to 4 hours**.

**Migration completion estimate (from current repo state):**
- Core migration to working self-hosted baseline: **1 to 2 weeks**
- Finish AI agents + key modules (Projects, Tasks, Expenses, Docs): **2 to 4 weeks**
- SaaS hardening (roles, billing, monitoring, backups, tenant isolation audits): **2 to 4 more weeks**

## Step 1 — Create required accounts

Do these one by one.

### 1.1 GitHub account
1. Go to https://github.com.
2. Click **Sign up**.
3. Verify your email.
4. Turn on 2FA in account security settings.
5. Create a test private repo (optional, good practice).

### 1.2 VPS provider account (choose one)
Pick one provider first (DigitalOcean, Hetzner, Linode are all fine).

What to buy for now:
- Ubuntu 22.04 LTS VPS
- 2 vCPU / 4 GB RAM minimum
- 60 GB SSD+

### 1.3 Domain provider account
1. Create account at Cloudflare/Namecheap/Porkbun.
2. Buy a domain name you control.
3. Keep domain login safe (you will later add DNS records).

### 1.4 OpenAI account (optional but needed for AI responses)
1. Create account at https://platform.openai.com.
2. Add billing method (even if low usage).
3. Create an API key.
4. Save key in password manager (you’ll use it as `OPENAI_API_KEY`).

## Step 2 — Install software on your computer

Install in this order:
1. Node.js 20+
2. Git
3. Docker
4. Supabase CLI
5. VS Code

Tip: after each install, close and reopen your terminal.

## Step 3 — Verify installs (must pass)

Run these exact commands:

```bash
node -v
git --version
docker --version
supabase --version
```

If one command fails, do not continue. Fix that tool first.

## Step 4 — Configure `.env.local`

In project root, create/edit `.env.local`:

```env
VITE_BACKEND_PROVIDER=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

How to find values:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in Supabase project settings → API.

## Step 5 — Push database schema

In terminal, from repo root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Where to get `YOUR_PROJECT_REF`:
- In Supabase dashboard URL or project settings.

## Step 6 — Deploy AI function

Run:

```bash
supabase secrets set OPENAI_API_KEY=YOUR_KEY
supabase functions deploy invoke-llm
```

If you skip OpenAI key, AI responses will not work.

## Step 7 — Run and test locally

Run:

```bash
npm install
npm run dev
```

Then test these manually:
1. App opens.
2. Login flow is visible (no blank screen).
3. Dashboard loads.
4. Open AI agent page.
5. Send one short prompt and confirm reply appears.

---

## Your required setup checklist (accounts + software)

Before migration work, prepare this once:

### Accounts
- GitHub
- VPS provider (Hetzner / DigitalOcean / Linode)
- Domain + DNS provider
- OpenAI (if using AI agents)

### Software on your computer
- Node.js 20+
- Git
- Docker
- Supabase CLI
- VS Code (recommended)

### Verification commands

```bash
node -v
git --version
docker --version
supabase --version
```

---

- Frontend: **React + Vite**.
- Styling/UI: Tailwind + Radix UI components.
- Data/Auth/Serverless backend: **Base44 SDK and Base44 cloud functions**.
- The frontend talks to Base44 through `src/api/base44Client.js`.

In short: your UI code is already yours, but your backend operations (auth, database entities, file upload, AI calls, and serverless tasks) are tightly coupled to Base44.

---

## Big picture migration strategy

Use this order to reduce risk:

1. **Stabilize local development** (so you can run the app consistently).
2. **Create your own backend** (recommended: Supabase + Edge Functions).
3. **Create one compatibility layer** in the frontend so pages do not all need immediate rewrites.
4. **Migrate data entity-by-entity** (Projects, Tasks, Expenses, etc.).
5. **Replace Base44 functions** with your own backend functions.
6. **Deploy frontend + backend + storage + domain**.
7. **Cut over traffic only after final QA**.

---

## Phase 1: Get your current project running locally

### 1.1 Install and run

```bash
npm install
cp .env.local.example .env.local   # if example exists
npm run dev
```

If no `.env.local.example` exists, create `.env.local` manually using current README variables:

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_base44_backend_url
VITE_BASE44_FUNCTIONS_VERSION=prod
```

### 1.2 Create a backup branch immediately

```bash
git checkout -b migration/prep-baseline
```

### 1.3 Record current behavior (important)

Create a checklist of what works now:

- Login/logout
- Dashboard loads
- Create project
- Create task
- Upload photo/document
- Generate bid analysis

Do this before changing anything so you can compare later.

---


## AI agents first fix path (recommended before feature polish)

Your current `AgentChat` uses `base44.agents.*` methods. In self-host mode, implement these compatibility methods first so chats work end-to-end:

- `agents.listConversations`
- `agents.createConversation`
- `agents.addMessage`
- `agents.subscribeToConversation`

Then wire agent messages to your own LLM function and store chat history in DB tables. Once this works, continue polishing agent features.

---

## Phase 2: Understand exactly what must be replaced

### 2.1 Base44 entry point in this repo

All frontend calls flow through:

- `src/api/base44Client.js`
- `src/lib/AuthContext.jsx`
- pages/components that call `base44.entities.*`, `base44.functions.invoke(...)`, `base44.integrations.Core.*`

### 2.2 Entities currently used

Your code references these data models (40 total):

`Alert, AlertThreshold, Bid, BidDocument, BidOpportunity, BidRequirement, CalendarEvent, CashFlowForecast, ChangeOrder, ClientUpdate, CostCode, CustomPhase, DailyLog, Document, Expense, Issue, Material, OperationalTask, Organization, PendingUser, Permit, PhaseBudget, PhaseChangeOrder, PhaseFile, PhaseGate, PhaseNote, PhaseRequirement, Project, ProjectCalendar, ProjectDecision, ProjectRole, ProjectTeam, PurchaseOrder, SafetyIncident, Submittal, Task, TemplateLibrary, VehicleLog, Worker, WorkerAssignment`

### 2.3 Backend functions currently used

These Base44 serverless functions exist in `functions/*.ts` and need to be reimplemented:

- `setupOrganization`
- `submitSignupRequest`
- `analyzeBidDocuments`
- `autoGenerateTasksFromBid`
- `seedConstructionTemplates`
- `generateTemplateFile`
- `generate1000Templates`
- `scrapeBidSites`
- `scrapeLAUSDBids`
- `scrapeCaCounties`
- `scrapeCaliforniaBids`

---

## Phase 3: Choose your self-hosted stack (recommended)


## Supabase free-tier warning (important for your case)

You are correct: free-tier projects can be paused or removed after inactivity. So treat free tier as a **testing/staging** environment, not your final production safety net.

Use one of these production-safe paths:

1. **Supabase paid plan** (easiest path, lowest migration friction).
2. **Self-host Postgres + backend** on a VPS (more ops work, no vendor inactivity deletion).
3. **Hybrid low-cost stack**: Neon (DB) + Cloudflare R2 (files) + Railway/Render/Fly backend.

Recommended for you:
- Start migration on Supabase free tier to move fast.
- Before final cutover, switch to paid plan or an always-on provider.
- Keep nightly backups (`pg_dump` or Supabase backup/export).

---

For fastest migration with low monthly cost, use:

- **Supabase**: Postgres DB + Auth + Storage + Edge Functions.
- **Vercel** (or Netlify): host the existing Vite frontend.
- Optional AI provider: OpenAI/Anthropic for LLM features replacing `InvokeLLM`.

Why this is practical for beginners:

- SQL + dashboard UI is easier than building auth/storage from scratch.
- Generous free tier to test.
- Well-documented JS client.

---

## Phase 4: Build a compatibility API in your frontend

Instead of rewriting every page now, add one internal API wrapper and migrate page-by-page.

### 4.1 Create new file: `src/api/appClient.js`

```js
import { supabase } from './supabaseClient';

export const appClient = {
  auth: {
    async me() {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },

  entities: {
    Project: {
      async list() {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      async create(payload) {
        const { data, error } = await supabase
          .from('projects')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
  }
};
```

Then, migrate imports from:

```js
import { base44 } from '@/api/base44Client';
```

to:

```js
import { appClient } from '@/api/appClient';
```

### 4.2 Why this helps

You can keep page logic similar while changing internals gradually.

---

## Phase 5: Database migration sequence (safe order)

Do not migrate all 40 tables at once. Use this order:

1. **Core auth/org**: users, organizations, project_team
2. **Core delivery**: projects, tasks, issues
3. **Financials**: expenses, purchase_orders, change_orders
4. **Field ops**: daily_logs, safety_incidents, permits, submittals
5. **Bids/templates**: bid_opportunities, bids, template_library
6. **Remaining specialist tables**

For each table:

1. Create SQL table.
2. Add row-level security policy.
3. Migrate old records.
4. Swap one page to Supabase.
5. Verify create/read/update/delete.

---

## Phase 6: Replace Base44 function calls

Map function-by-function:

- Base44 `functions/*.ts` -> Supabase Edge Functions (`supabase/functions/*`)
- Base44 `integrations.Core.InvokeLLM` -> direct OpenAI/Anthropic SDK call
- Base44 `UploadFile` -> Supabase Storage `bucket.upload(...)`

Example (pseudo-route):

```ts
// supabase/functions/analyze-bid/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  const { project_name, bid_text } = await req.json();
  // 1) call LLM
  // 2) parse structured response
  // 3) insert rows into postgres
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## Phase 7: File uploads and documents

Anywhere you currently do:

- `base44.integrations.Core.UploadFile(...)`

Replace with Supabase Storage bucket uploads, then persist metadata in `documents` table.

Example flow:

1. User picks file.
2. Upload to bucket path: `org-id/project-id/<filename>`.
3. Store public/signed URL + metadata row in DB.

---

## Phase 8: Auth migration path

Current app relies heavily on `base44.auth.me()` checks. Keep same concept:

1. Enforce sign-in with Supabase Auth.
2. On login, ensure user has organization membership row.
3. Gate pages by auth + org just like current `AuthContext` behavior.

---

## Phase 9: Deployment and cutover

1. Deploy backend (Supabase project, DB migrated, functions deployed).
2. Deploy frontend (Vercel/Netlify).
3. Set new env vars in frontend:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Run full QA checklist.
5. Move domain to new app.
6. Keep Base44 running 1-2 weeks read-only as rollback safety.

---

## Phase 10: Cost control checklist

- Enable DB and function usage alerts.
- Add rate limits to scraping/AI endpoints.
- Cache expensive bid-scrape results.
- Queue long-running jobs (don’t run in browser).
- Log top 10 expensive operations weekly.

---

## Minimum 30-day execution plan (simple)

- **Week 1:** Setup Supabase, migrate auth + org + projects tables.
- **Week 2:** Migrate tasks/issues/expenses + corresponding pages.
- **Week 3:** Migrate uploads + core server functions.
- **Week 4:** Final QA, deploy, cut over, monitor.

---

## “Do this first today” checklist

1. Run app locally and confirm baseline.
2. Create Supabase project.
3. Create `appClient` wrapper.
4. Migrate only `Project` list/create first.
5. Verify it works end-to-end.
6. Continue table-by-table.

If you follow this sequence, you will avoid the most common migration failure: trying to replace everything in one big rewrite.

---

## Alternative execution path: fully self-hosted on DigitalOcean (no Supabase)

This section is for your explicit requirement: avoid free-tier project deactivation risk.

### Locked architecture
- VPS: DigitalOcean Droplet (Ubuntu 22.04)
- Reverse proxy + TLS: Nginx + Let's Encrypt
- Database: PostgreSQL (Docker)
- Object storage: MinIO (Docker)
- Backend API: Node service (Docker)
- Worker: Node queue worker (Docker)
- Frontend: this React app (Vite build served via Nginx)

### Step A — Bootstrap server
SSH into your VPS and run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg ufw
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Reconnect SSH, then verify:

```bash
docker --version
docker compose version
```

> Beginner note: if `apt upgrade` shows a prompt about `/etc/ssh/sshd_config`, choose **"keep the local version currently installed"**. This is safer during remote setup and helps prevent SSH lockout from unexpected config replacement.

> If `docker --version` fails right after install, disconnect and reconnect SSH first so your new group membership is applied.

### Step B — Prepare app directory

```bash
mkdir -p ~/apps/constructflow
cd ~/apps/constructflow
```

### Step C — DNS (GoDaddy)
Create DNS records pointing your domain to droplet public IP:
- `A` record for `@`
- `A` record for `www`
- optional `A` record for `api`

### Step D — Deploy containers
Create a `docker-compose.yml` in `~/apps/constructflow`.

> If you are on Windows: `cat > docker-compose.yml <<'EOF'` is Bash syntax and fails in PowerShell with errors like `Missing file specification after redirection operator`.
> Use the template file from this repo instead of typing YAML manually.

1) Fast path (Windows): run helper script from your local repo root:

```powershell
./deploy/push-compose.ps1 -ServerIp YOUR_DROPLET_IP -DbPassword "YOUR_DB_PASSWORD" -MinioPassword "YOUR_MINIO_PASSWORD"
```

If PowerShell blocks local scripts, run once in that terminal:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

This command:
- loads `deploy/docker-compose.vps.yml`
- replaces password placeholders
- copies file to `/root/apps/constructflow/docker-compose.yml`
- runs `docker compose config`, `up -d`, and `ps` over SSH.

2) Manual fallback (if script is blocked by execution policy):

```powershell
scp deploy/docker-compose.vps.yml root@YOUR_DROPLET_IP:/root/apps/constructflow/docker-compose.yml
ssh root@YOUR_DROPLET_IP
cd ~/apps/constructflow
nano docker-compose.yml
```

Replace:
- `CHANGE_THIS_DB_PASSWORD`
- `CHANGE_THIS_MINIO_PASSWORD`

Then save (`Ctrl+O`, `Enter`) and exit (`Ctrl+X`).

3) Validate + run:

```bash
docker compose config
docker compose up -d
docker compose ps
```

If `docker compose config` fails, rebuild from template and retry:

```bash
cp ~/apps/constructflow/docker-compose.yml ~/apps/constructflow/docker-compose.yml.bak || true
```

Then re-copy the template with `scp`, re-edit passwords, and rerun `docker compose config`.

If your terminal shows `Connection reset`, your SSH session ended. Reconnect first:

```bash
ssh root@YOUR_DROPLET_IP
cd ~/apps/constructflow
```

If you see a `>>` prompt in PowerShell, press `Ctrl+C` to cancel multiline mode.
Only run Linux commands when your prompt looks like `root@...:~#`.

### Step E — Cut frontend to new backend
In `.env.local` for frontend deployment target, stop using Supabase provider and point to your own API URL.

### Step F — Data/function migration
Migrate in this order:
1. Auth + organizations
2. Projects + tasks + issues
3. Expenses + documents
4. Agent conversations + messages
5. Replace Base44 functions with internal API routes

### Timeline for this no-Supabase path
- Server bootstrap + DNS + HTTPS: 1 to 2 days
- Backend base services (db/storage/api/worker): 2 to 5 days
- App endpoint migration (core modules + agents): 2 to 4 weeks
- QA + cutover: 2 to 4 days
