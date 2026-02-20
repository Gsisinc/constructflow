import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Key } from 'lucide-react';

const hasKey = (key) => Boolean(key && String(key).trim().length > 0);

export default function ApiStatusCard() {
  const claude = import.meta.env.VITE_CLAUDE_API_KEY ?? process.env.REACT_APP_CLAUDE_API_KEY;
  const openai = import.meta.env.VITE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const samGov = import.meta.env.VITE_SAM_GOV_API_KEY ?? process.env.SAM_GOV_API_KEY;

  const items = [
    { name: 'Claude (AI agents & estimate generator)', configured: hasKey(claude) },
    { name: 'OpenAI (bid/doc & drawing analysis)', configured: hasKey(openai) },
    { name: 'SAM.gov (live bid discovery)', configured: hasKey(samGov) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4" />
          API status
        </CardTitle>
        <p className="text-xs text-slate-500">
          Keys are read from .env.local (VITE_*). Values are never shown here.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(({ name, configured }) => (
          <div key={name} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-700 dark:text-slate-300">{name}</span>
            {configured ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                <XCircle className="h-3 w-3" />
                Not set
              </Badge>
            )}
          </div>
        ))}
        <p className="text-xs text-slate-500 pt-2">
          Add keys to .env.local and restart the dev server. See .env.example.
        </p>
      </CardContent>
    </Card>
  );
}
