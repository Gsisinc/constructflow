import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PackageCheck, Users, ClipboardList, KeyRound, Plus, Loader2, FileText, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import OpsDocDialog from './OpsDocDialog';
import AttachmentLinks from './AttachmentLinks';

export const OPS_TYPES = ['dispatch_packet', 'resource_plan', 'daily_log', 'site_access_note'];
export const TYPE_CONFIG = {
  dispatch_packet: { label: 'Dispatch Packet', icon: PackageCheck, color: 'bg-navy-100 text-navy-700' },
  resource_plan: { label: 'Resource Plan', icon: Users, color: 'bg-amber-100 text-amber-700' },
  daily_log: { label: 'Daily Log', icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
  site_access_note: { label: 'Site Access Note', icon: KeyRound, color: 'bg-emerald-100 text-emerald-700' },
};
export const STANDARD_PHASES = [
  { value: 'preconstruction', label: 'Preconstruction' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'superstructure', label: 'Superstructure' },
  { value: 'enclosure', label: 'Enclosure' },
  { value: 'mep_rough', label: 'MEP Rough' },
  { value: 'interior_finishes', label: 'Interior Finishes' },
  { value: 'commissioning', label: 'Commissioning' },
  { value: 'closeout', label: 'Closeout' },
];

const money = (n) => '$' + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function OpsDocsTab({ projectId, project, customPhases = [] }) {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['opsdocs', projectId],
    queryFn: async () => (await base44.entities.OpsDoc.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });

  const phaseOptions = [
    ...STANDARD_PHASES,
    ...(customPhases || []).map((p) => ({ value: p.name || p.id, label: p.name || 'Custom' })),
  ];
  const phaseLabel = (v) => phaseOptions.find((p) => p.value === v)?.label || v || '—';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Ops / Field Docs</h2>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Ops Doc
        </Button>
      </div>
      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No ops / field docs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((d) => {
            const cfg = TYPE_CONFIG[d.type] || TYPE_CONFIG.dispatch_packet;
            const Icon = cfg.icon;
            return (
              <Card key={d.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" /> {cfg.label}
                        </span>
                        <p className="font-semibold text-slate-900">{d.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Phase: <span className="font-medium text-slate-700">{phaseLabel(d.linked_phase)}</span>
                        {d.entered_by ? ` · Entered by ${d.entered_by}` : ''}
                        {d.created_date ? ` · ${format(new Date(d.created_date), 'MMM d, yyyy')}` : ''}
                      </p>
                      {d.type === 'resource_plan' && (
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">{Number(d.hours) || 0} hrs</span> against a <span className="font-medium">{money(d.labor_budget)}</span> labor budget
                        </p>
                      )}
                      {d.notes && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{d.notes}</p>}
                      {d.file_attachments?.length > 0 && (
                        <div className="mt-2">
                          <AttachmentLinks attachments={d.file_attachments} />
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs flex items-center gap-1 self-start">
                      <Paperclip className="h-3 w-3" /> {d.file_attachments?.length || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <OpsDocDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        projectId={projectId}
        organizationId={project?.organization_id}
        phaseOptions={phaseOptions}
        onSaved={() => qc.invalidateQueries({ queryKey: ['opsdocs', projectId] })}
      />
    </div>
  );
}