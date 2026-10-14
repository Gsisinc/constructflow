import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CATEGORIES = ['design', 'specification', 'schedule', 'cost', 'safety', 'quality', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['draft', 'submitted', 'under_review', 'answered', 'closed'];
const statusColor = { draft: 'bg-slate-100 text-slate-700', submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-700', answered: 'bg-green-100 text-green-700', closed: 'bg-slate-200 text-slate-600' };
const priColor = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-700' };

export default function RFITab({ projectId }) {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['rfis', projectId],
    queryFn: async () => (await base44.entities.RFI.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });
  const openCount = items.filter(r => r.status === 'submitted' || r.status === 'under_review').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">RFIs</h2>
          {openCount > 0 && <Badge className="bg-amber-100 text-amber-700">{openCount} open</Badge>}
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New RFI</Button>
      </div>
      {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : items.length === 0 ? <div className="text-center py-10"><HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">No RFIs yet.</p></div>
        : (
          <div className="space-y-2">
            {items.map(r => (
              <Card key={r.id}><CardContent className="pt-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.rfi_number && <Badge variant="outline" className="text-xs">{r.rfi_number}</Badge>}
                      <p className="font-semibold text-slate-900">{r.subject}</p>
                      <Badge className={priColor[r.priority] || 'bg-slate-100'}>{r.priority}</Badge>
                      <Badge className={statusColor[r.status] || 'bg-slate-100'}>{(r.status || 'draft').replace('_',' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.question}</p>
                    <p className="text-xs text-slate-500 mt-1">{r.category ? r.category : ''} {r.directed_to ? `· To: ${r.directed_to}` : ''} {r.due_date ? `· Due ${format(new Date(r.due_date), 'MMM d')}` : ''} {(r.cost_impact || r.schedule_impact_days) ? `· Impact $${(r.cost_impact||0).toLocaleString()}/${r.schedule_impact_days||0}d` : ''}</p>
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      <RFIDialog open={showCreate} onOpenChange={setShowCreate} projectId={projectId} onSaved={() => qc.invalidateQueries({ queryKey: ['rfis', projectId] })} />
    </div>
  );
}

function RFIDialog({ open, onOpenChange, projectId, onSaved }) {
  const [form, setForm] = useState({ subject: '', question: '', category: 'design', priority: 'medium', status: 'draft', directed_to: '', due_date: '' });
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { if (open) setForm({ subject: '', question: '', category: 'design', priority: 'medium', status: 'draft', directed_to: '', due_date: '' }); }, [open]);
  const submit = async () => {
    if (!form.subject || !form.question) { toast.error('Subject and question are required'); return; }
    setSaving(true);
    try { await base44.entities.RFI.create({ ...form, project_id: projectId, submitted_date: new Date().toISOString().split('T')[0] }); toast.success('RFI created'); onSaved(); onOpenChange(false); }
    catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>New RFI</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div><Label>Question *</Label><Textarea rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Category</Label><select className="w-full border rounded p-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><Label>Priority</Label><select className="w-full border rounded p-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><Label>Status</Label><select className="w-full border rounded p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Directed To</Label><Input value={form.directed_to} onChange={(e) => setForm({ ...form, directed_to: e.target.value })} /></div>
          <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Create</Button></div>
      </div>
    </DialogContent></Dialog>
  );
}