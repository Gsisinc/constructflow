# Run ConstructFlow with Supabase

## 1. Get Supabase credentials

1. Go to [supabase.com](https://supabase.com) → create or open a project.
2. **Project Settings** → **API**:
   - Copy **Project URL** (e.g. `https://xxxx.supabase.co`).
   - Copy **anon public** key.

## 2. Set env

Edit **`.env.local`** and set (replace with your values):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Keep these as-is:

```env
VITE_BACKEND_PROVIDER=supabase
VITE_ENABLE_SUPABASE_EXPERIMENTAL=true
```

## 3. Push database schema

In the project root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

(`YOUR_PROJECT_REF` is in the Supabase project URL, e.g. `https://abcdefgh.supabase.co` → `abcdefgh`.)

## 4. Create a user and profile

1. Supabase **Authentication** → **Users** → **Add user** (email + password).
2. Copy the user **UUID**.
3. **Table Editor** → **organizations** → **Insert**:
   - `name`: e.g. "My Company"
   - `owner_id`: paste the user UUID
   - `owner_email`: user's email (optional)
4. Copy the new organization **id**.
5. **Table Editor** → **profiles** → **Insert**:
   - `id`: user UUID (same as step 2)
   - `full_name`: e.g. "Your Name"
   - `organization_id`: organization id from step 4

## 5. (Optional) Deploy AI function

```bash
npx supabase secrets set OPENAI_API_KEY=your_openai_key
npx supabase functions deploy invoke-llm
```

## 6. Start the app

```bash
npm run dev
```

Open the URL (e.g. http://localhost:5173), go to **/Login**, sign in with the Supabase user email and password.
