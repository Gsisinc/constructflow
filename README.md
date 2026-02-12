**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)


## Base44-only quick reset (recommended while migration is paused)

If you are staying on Base44 for now, keep your local config in Base44 mode:

```env
# .env.local
VITE_BACKEND_PROVIDER=base44
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

Do not set Supabase vars unless you are actively testing migration.

> Safety guard: Supabase mode now requires both `VITE_BACKEND_PROVIDER=supabase` and `VITE_ENABLE_SUPABASE_EXPERIMENTAL=true`.

## Self-hosted migration mode (Supabase)

### Beginner path (one step at a time)

If you are new to coding, follow these exact steps in order. Do **not** skip ahead.

1. Create accounts (GitHub, VPS provider, domain provider, OpenAI).
2. Install tools (Node 20+, Git, Docker, Supabase CLI, VS Code).
3. Verify tools with 4 commands.
4. Configure `.env.local`.
5. Link Supabase project and push schema.
6. Deploy `invoke-llm` function.
7. Run app locally and test login + one AI prompt.

Estimated time for this setup: **2 to 4 hours** for a beginner.

For a click-by-click walkthrough, open:
- `docs/base44-migration-handbook.md` (section: **Beginner click-by-click setup (VPS path)**)


### What you need to do on your side (VPS path)

Create these accounts:
- GitHub (for repo + deployment workflow)
- VPS provider account (Hetzner, DigitalOcean, Linode, or similar)
- Domain registrar account (Cloudflare, Namecheap, Porkbun, etc.)
- OpenAI account (only if you want AI agent responses)

Install these tools on your computer:
- Node.js 20+
- Git
- Docker Desktop (or Docker Engine)
- Supabase CLI (for SQL/function deployment in this migration scaffold)
- A code editor (VS Code recommended)

Quick install checks:

```bash
node -v
git --version
docker --version
supabase --version
```

This repo now includes a migration-compatible API layer so you can run without Base44.

### 1) Set provider and Supabase variables

Create/update `.env.local`:

```env
VITE_BACKEND_PROVIDER=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

If `VITE_BACKEND_PROVIDER` is not set, the app defaults to Base44.

### 2) Create schema

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Schema file included:
- `supabase/migrations/202602111820_initial_self_host_schema.sql`

### 3) Deploy AI function (replacement for Base44 InvokeLLM)

```bash
supabase secrets set OPENAI_API_KEY=YOUR_KEY
supabase functions deploy invoke-llm
```

Function file included:
- `supabase/functions/invoke-llm/index.ts`


### Important: Supabase free-tier inactivity

Supabase can pause or remove inactive free projects after a period of inactivity. If you want to avoid this risk:

- Upgrade to a paid Supabase plan, **or**
- Keep regular activity/exports/backups, **or**
- Use a non-expiring alternative stack (example: Neon Postgres + Cloudflare R2 + your own API server), **or**
- Self-host Supabase/Postgres on a VPS.

If long-term retention is your top priority, do not rely on an inactive free-tier project as your only production database.

### 4) Start app

```bash
npm install
npm run dev
```

For the complete migration playbook, see:
- `docs/base44-migration-handbook.md`

## No-Supabase path (fully self-hosted on your VPS)

If you want to avoid Supabase free-tier deactivation risk entirely, use this stack on your DigitalOcean VPS:

- Postgres (database)
- MinIO (S3-compatible file storage)
- Node API (auth/data/functions)
- Worker service (AI/long-running jobs)
- Nginx + SSL (public entrypoint)
- Existing React app (this repo frontend)

### Decision lock

This is the locked path when your priority is:
- no third-party free-tier database deactivation
- no vendor lock-in for core app data

### Immediate next step (server bootstrap)

Run these commands on your VPS after SSH login:

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

Then reconnect SSH and verify:

```bash
docker --version
docker compose version
```

### VPS bootstrap troubleshooting (important for beginners)

If `apt upgrade` asks about replacing `/etc/ssh/sshd_config`, choose:

- **"keep the local version currently installed"**

This avoids accidentally changing SSH defaults while you are connected remotely.

If Docker commands fail right after install, disconnect and reconnect SSH first (group changes from `usermod -aG docker` only apply after a new session).

**Windows PowerShell gotcha:** `cat > file <<'EOF'` is Bash heredoc syntax and fails in PowerShell with `Missing file specification after redirection operator` or `The '<' operator is reserved for future use`.

- Quick check: VPS prompt looks like `root@...:~#`; local Windows prompt looks like `PS C:\...>`. Run Linux commands only at the VPS prompt.
- If PowerShell shows `>>`, press `Ctrl+C` to cancel multiline mode before typing anything else.
- Fastest path on Windows: run the helper script from your local repo. It injects passwords, copies the file, validates config, and starts containers:

  ```powershell
  ./deploy/push-compose.ps1 -ServerIp YOUR_DROPLET_IP -DbPassword "YOUR_DB_PASSWORD" -MinioPassword "YOUR_MINIO_PASSWORD"
  ```

- If PowerShell blocks local scripts in that terminal, run:

  ```powershell
  Set-ExecutionPolicy -Scope Process Bypass
  ```

- Manual fallback: copy the template file and edit on VPS:

  ```powershell
  scp deploy/docker-compose.vps.yml root@YOUR_DROPLET_IP:/root/apps/constructflow/docker-compose.yml
  ssh root@YOUR_DROPLET_IP
  cd ~/apps/constructflow
  nano docker-compose.yml
  ```

- Replace `CHANGE_THIS_DB_PASSWORD` and `CHANGE_THIS_MINIO_PASSWORD`, then save (`Ctrl+O`, `Enter`, `Ctrl+X`).
- Validate before startup:

  ```bash
  docker compose config
  docker compose up -d
  docker compose ps
  ```

- If your SSH session drops (`Connection reset`), reconnect first: `ssh root@YOUR_DROPLET_IP`.

> Note: the current repository still contains Supabase migration scaffolding. On this no-Supabase path, we will replace that runtime backend with VPS-hosted services step-by-step.

## Security quick rule (important)
- Never paste API keys, GitHub personal access tokens, or server root passwords into chat, tickets, or commits.
- If a secret is accidentally shared, revoke/rotate it immediately before continuing deployment.
