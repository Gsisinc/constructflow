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
import { Plus, Loader2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CATEGORIES = ['deficiency', 'incomplete_work', 'correction', 'touch_up', 'cleanup', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in_progress', 'completed', 'verified', 'closed'];
const statusColor = { open: 'bg-red-100 text-red-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', closed: 'bg-slate-200 text-slate-600' };
const priColor = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' };

export default function PunchListTab({ projectId }) {
  const [showCreate, setShowCreate] = useState(false);
  const [fStatus, setFStatus] = useState('open');
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['punchlist', projectId],
    queryFn: async () => (await base44.entities.Punchlist.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });
  const filtered = fStatus === 'all' ? items : items.filter(p => p.status === fStatus);
  const openCount = items.filter(p => p.status === 'open' || p.status === 'in_progress').length;

  const updateStatus = async (id, status) => {
    try { await base44.entities.Punchlist.update(id, { status, completed_date: status === 'completed' || status === 'verified' || status === 'closed' ? new Date().toISOString().split('T')[0] : undefined }); qc.invalidateQueries({ queryKey: ['punchlist', projectId] }); }
    catch (e) { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Punch List</h2>
          {openCount > 0 && <Badge className="bg-red-100 text-red-700">{openCount} open</Badge>}
        </div>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-1.5 text-sm bg-white" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            {['all', ...STATUSES].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Item</Button>
        </div>
      </div>
      {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : filtered.length === 0 ? <div className="text-center py-10"><ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">No punch list items.</p></div>
        : (
          <div className="space-y-2">
            {filtered.map(p => (
              <Card key={p.id}><CardContent className="pt-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.item_number && <Badge variant="outline" className="text-xs">{p.item_number}</Badge>}
                      <Badge className={priColor[p.priority] || 'bg-slate-100'}>{p.priority}</Badge>
                      <p className="font-semibold text-slate-900 text-sm">{p.description}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{p.location ? `📍 ${p.location} · ` : ''}{p.category ? p.category.replace('_',' ') : ''} {p.assigned_to ? `· ${p.assigned_to}` : ''} {p.due_date ? `· Due ${format(new Date(p.due_date), 'MMM d')}` : ''}</p>
                  </div>
                  <select className="border rounded px-2 py-1 text-xs bg-white w-auto" value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      <PunchDialog open={showCreate} onOpenChange={setShowCreate} projectId={projectId} onSaved={() => qc.invalidateQueries({ queryKey: ['punchlist', projectId] })} />
    </div>
  );
}

function PunchDialog({ open, onOpenChange, projectId, onSaved }) {
  const [form, setForm] = useState({ description: '', location: '', category: 'deficiency', priority: 'medium', assigned_to: '', responsible_contractor: '', due_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { if (open) setForm({ description: '', location: '', category: 'deficiency', priority: 'medium', assigned_to: '', responsible_contractor: '', due_date: '', notes: '' }); }, [open]);
  const submit = async () => {
    if (!form.description) { toast.error('Description is required'); return; }
    setSaving(true);
    try { await base44.entities.Punchlist.create({ ...form, project_id: projectId, status: 'open' }); toast.success('Punch list item created'); onSaved(); onOpenChange(false); }
    catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Add Punch List Item</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Category</Label><select className="w-full border rounded p-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}</select></div>
          <div><Label>Priority</Label><select className="w-full border rounded p-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Assigned To</Label><Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} /></div>
          <div><Label>Responsible Contractor</Label><Input value={form.responsible_contractor} onChange={(e) => setForm({ ...form, responsible_contractor: e.target.value })} /></div>
        </div>
        <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
        <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Add</Button></div>
      </div>
    </DialogContent></Dialog>
  );
}