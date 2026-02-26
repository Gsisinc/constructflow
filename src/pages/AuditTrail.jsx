import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { exportAuditAsCsv, exportAuditAsJsonl, buildAuditHashChain, verifyAuditHashChain } from '@/lib/auditExport';

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

  const chained = React.useMemo(() => buildAuditHashChain(logs), [logs]);
  const chainStatus = React.useMemo(() => verifyAuditHashChain(chained), [chained]);

  const download = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit Trail</h1>
        <p className="text-sm text-slate-600 mt-1">Immutable-style activity feed for Phase 1 governance.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className={chainStatus.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {chainStatus.valid ? 'Hash chain verified' : `Chain broken at row ${chainStatus.broken_index + 1}`}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => download('audit-export.csv', exportAuditAsCsv(chained), 'text/csv;charset=utf-8;')}>
            Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => download('audit-export.jsonl', exportAuditAsJsonl(chained), 'application/x-ndjson;charset=utf-8;')}>
            Export JSONL
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-slate-500">No audit events logged yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chained.map((log) => (
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
