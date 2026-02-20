# Running ConstructFlow Without Base44 (Your Own Backend)

You can run the app **fully locally** with your own backend and no Base44 dependency. Two options:

---

## Option A: Supabase as Your Backend (recommended)

The app already supports **Supabase** as a drop-in backend: auth, database, storage, and an edge function for AI (InvokeLLM).

### 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a project.
- In **Settings → API**: copy **Project URL** and **anon public** key.

### 2. Configure the app

Create or edit **`.env.local`**:

```env
VITE_BACKEND_PROVIDER=supabase
VITE_ENABLE_SUPABASE_EXPERIMENTAL=true
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Remove or leave unset Base44 vars (`VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL`). The app will not call Base44.

### 3. Push the database schema

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migrations in `supabase/migrations/` will create tables (organizations, profiles, projects, **bid_opportunitys**, **bid_documents**, **bid_estimates**, **purchase_orders**, etc.).

### 4. Create a user and profile

- In Supabase: **Authentication → Users → Add user** (email + password).
- In **Table Editor → `profiles`**: add a row with `id` = the user’s UUID (from Auth → Users), and set `full_name`, `organization_id`.
- Create an **organization** in `organizations` and set its `id` as `organization_id` in the profile. Optionally set `owner_email` on the organization to the user’s email.

### 5. Deploy the AI (LLM) function

```bash
npx supabase secrets set OPENAI_API_KEY=your_openai_key
npx supabase functions deploy invoke-llm
```

This replaces Base44’s InvokeLLM for drawing analysis and other AI features.

### 6. Run the app

```bash
npm run dev
```

Open the app; click **“Try login again”** or go to **/Login**. Sign in with the Supabase user email and password. No Base44 is used.

### Optional: Storage for file uploads

In Supabase: **Storage → New bucket** (e.g. `documents`, public if you want public URLs). The app uses the bucket name in `appClient.js` for uploads.

---

## Option B: Fully Custom Backend (Node/Express + DB)

If you want **no Supabase** (your own server and database):

1. **API surface to implement**  
   The frontend talks to the backend through the same shape the app uses today:
   - **Auth:** something like `GET /auth/me`, `POST /auth/login`, `POST /auth/logout`, and a way to get/set the auth token (e.g. cookie or header).
   - **Entities:** REST or RPC per entity, e.g.:
     - `BidOpportunity`: list, filter, create, update, delete
     - `BidDocument`, `BidEstimate`, `PurchaseOrder`, `Project`, `Organization`, etc.
   - **Files:** `POST /upload` returning a URL.
   - **AI:** `POST /invoke-llm` (or similar) that calls OpenAI/Claude and returns text.

2. **Frontend changes**  
   Add a second client (e.g. `src/api/customBackendClient.js`) that implements the same interface as `appClient` (auth.me, entities.*, integrations.Core.UploadFile, integrations.Core.InvokeLLM). Then in `rawBase44Client.js` (or a small env-based switch), use `customBackendClient` when e.g. `VITE_BACKEND_PROVIDER=custom`, and point the app’s API base URL to your server (e.g. `VITE_CUSTOM_API_URL=http://localhost:4000`).

3. **Database**  
   Use the Supabase migrations as a reference for tables and columns; re-create the same structure in your own DB (Postgres, SQLite, etc.) and implement the CRUD and auth logic in your backend.

This option is more work but gives you full control and no third-party backend.

---

## Summary

| Goal                         | Use |
|-----------------------------|-----|
| Run locally, no Base44      | **Option A** with Supabase. |
| Run locally, no Supabase    | **Option B**: build a small API that matches the app’s auth/entities/upload/LLM and wire it with `VITE_BACKEND_PROVIDER=custom`. |

For most cases, **Option A (Supabase)** is the fastest way to “copy the app locally and use your own backend” without Base44.
