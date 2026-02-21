import React from 'react';
import { Key, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const hasKey = (key) => Boolean(key && String(key).trim().length > 0);

export default function ApiKeyBanner() {
  const claude = import.meta.env.VITE_CLAUDE_API_KEY ?? import.meta.env.VITE_ANTHROPIC_API_KEY ?? process.env.REACT_APP_CLAUDE_API_KEY;
  const openai = import.meta.env.VITE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const hasAny = hasKey(claude) || hasKey(openai);
  const [dismissed, setDismissed] = React.useState(false);

  if (hasAny || dismissed) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700 px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <Key className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <strong>AI agents need API keys.</strong> Add <code className="text-xs bg-amber-200/60 dark:bg-amber-800/60 px-1 rounded">VITE_CLAUDE_API_KEY</code> or <code className="text-xs bg-amber-200/60 dark:bg-amber-800/60 px-1 rounded">VITE_OPENAI_API_KEY</code> to <code className="text-xs bg-amber-200/60 dark:bg-amber-800/60 px-1 rounded">.env.local</code> in the project root, then <strong>restart the dev server</strong> (stop and run <code className="text-xs">npm run dev</code> again).
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild variant="outline" size="sm" className="border-amber-600 text-amber-800 hover:bg-amber-200 dark:border-amber-500 dark:text-amber-200 dark:hover:bg-amber-800/60">
          <Link to={createPageUrl('Settings')}>Settings → API status</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-amber-700 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-800/60">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
