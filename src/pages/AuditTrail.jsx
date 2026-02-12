import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function AuditTrail() {
  const { data: user } = useQuery({
    queryKey: ['currentUser', 'auditTrail'],
    queryFn: () => base44.auth.me()
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['auditLogs', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return base44.entities.AuditLog.filter({ organization_id: user.organization_id }, '-created_date');
    },
    enabled: !!user?.organization_id
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit Trail</h1>
        <p className="text-sm text-slate-600 mt-1">Immutable-style activity feed for Phase 1 governance.</p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-slate-500">No audit events logged yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline">{log.action || 'event'}</Badge>
                  <span className="text-slate-800">{log.entity_type || 'Entity'}</span>
                  <span className="text-slate-500 text-sm">#{log.entity_id || 'n/a'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  {log.logged_at || log.created_date
                    ? formatDistanceToNow(new Date(log.logged_at || log.created_date), { addSuffix: true })
                    : 'Unknown time'}
                </p>
                {log.user_id && <p>User: {log.user_id}</p>}
                {log.metadata && (
                  <details className="rounded bg-slate-50 p-2">
                    <summary className="cursor-pointer font-medium">Metadata</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
