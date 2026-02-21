# API keys and seeing your changes

## Why "No LLM configured" or no changes?

1. **API keys** – Vite only reads `.env.local` when the dev server **starts**. If you added or changed keys:
   - Stop the dev server (Ctrl+C).
   - Run `npm run dev` (or `pnpm dev`) again.
   - Refresh the browser.

2. **Code changes** – If you don’t see UI or behavior updates:
   - Save the file and wait for Vite to hot-reload, or
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R).

## Where to put keys

- **File:** `.env.local` in the project root (same folder as `package.json`).
- **Variables:** `VITE_CLAUDE_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_SAM_GOV_API_KEY`.
- Copy from `.env.example` and replace the placeholder values with your real keys.

After editing `.env.local`, **restart the dev server** so the app picks up the new values.
