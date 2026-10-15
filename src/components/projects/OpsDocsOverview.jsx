import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, Users, ClipboardList, KeyRound, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { TYPE_CONFIG } from './OpsDocsTab';

const money = (n) => '$' + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function OpsDocsOverview({ projectId, customPhases = [] }) {
  const phaseLabel = (v) => {
    const std = { preconstruction: 'Preconstruction', foundation: 'Foundation', superstructure: 'Superstructure', enclosure: 'Enclosure', mep_rough: 'MEP Rough', interior_finishes: 'Interior Finishes', commissioning: 'Commissioning', closeout: 'Closeout' };
    if (std[v]) return std[v];
    const c = (customPhases || []).find((p) => (p.name || p.id) === v);
    return c?.name || v || '—';
  };

  const { data: items = [] } = useQuery({
    queryKey: ['opsdocs-overview', projectId],
    queryFn: async () => (await base44.entities.OpsDoc.filter({ project_id: projectId }, { sort: '-created_date', limit: 4 }))?.items || [],
    enabled: !!projectId,
  });

  if (!items.length) return null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Latest Ops / Field Docs</h3>
          <Badge variant="outline" className="text-xs">{items.length} recent</Badge>
        </div>
        <div className="space-y-2">
          {items.map((d) => {
            const cfg = TYPE_CONFIG[d.type] || TYPE_CONFIG.dispatch_packet;
            const Icon = cfg.icon;
            return (
              <div key={d.id} className="flex items-start gap-2 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                <span className={`mt-0.5 inline-flex items-center justify-center rounded-md h-6 w-6 flex-shrink-0 ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                  <p className="text-xs text-slate-500">
                    {cfg.label} · Phase {phaseLabel(d.linked_phase)}
                    {d.entered_by ? ` · ${d.entered_by}` : ''}
                    {d.created_date ? ` · ${format(new Date(d.created_date), 'MMM d')}` : ''}
                    {d.type === 'resource_plan' ? ` · ${Number(d.hours) || 0} hrs / ${money(d.labor_budget)}` : ''}
                    {d.file_attachments?.length ? ` · ${d.file_attachments.length} file${d.file_attachments.length > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                {d.file_attachments?.length > 0 && <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}