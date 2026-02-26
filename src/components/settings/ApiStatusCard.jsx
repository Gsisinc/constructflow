import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Key } from 'lucide-react';
import { hasClaudeKey, hasOpenAIKey, hasSamGovKey } from '@/lib/apiKeys';

export default function ApiStatusCard() {
  const items = [
    { name: 'Claude (AI agents & estimate generator)', configured: hasClaudeKey() },
    { name: 'OpenAI (bid/doc & blueprint analysis)', configured: hasOpenAIKey() },
    { name: 'SAM.gov (live bid discovery)', configured: hasSamGovKey() },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4" />
          API status
        </CardTitle>
        <p className="text-xs text-slate-500">
          Keys from .env (VITE_*) or set in AI Agents → OpenAI/Claude or Bid Discovery. Never shown.
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
          Add to .env and restart, or set in AI Agents (OpenAI/Claude) and Bid Discovery (SAM.gov).
        </p>
      </CardContent>
    </Card>
  );
}
