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
import { Plus, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TYPES = ['shop_drawings', 'product_data', 'samples', 'test_reports', 'certificates', 'other'];
const STATUSES = ['preparing', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'revise_and_resubmit', 'rejected'];
const statusColor = {
  preparing: 'bg-slate-100 text-slate-700', submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700',
  approved_as_noted: 'bg-emerald-100 text-emerald-700', revise_and_resubmit: 'bg-orange-100 text-orange-700', rejected: 'bg-red-100 text-red-700',
};

export default function SubmittalsTab({ projectId }) {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['submittals', projectId],
    queryFn: async () => (await base44.entities.Submittal.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Submittals</h2>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Submittal</Button>
      </div>
      {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : items.length === 0 ? <div className="text-center py-10"><FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">No submittals yet.</p></div>
        : (
          <div className="space-y-2">
            {items.map(s => (
              <Card key={s.id}><CardContent className="pt-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      {s.submittal_number && <Badge variant="outline" className="text-xs">{s.submittal_number}</Badge>}
                      <Badge className={statusColor[s.status] || 'bg-slate-100'}>{(s.status || 'preparing').replace('_',' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{s.submittal_type ? s.submittal_type.replace('_',' ') : ''} {s.specification_section ? `· Spec ${s.specification_section}` : ''} {s.required_date ? `· Due ${format(new Date(s.required_date), 'MMM d')}` : ''}</p>
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      <SubmittalDialog open={showCreate} onOpenChange={setShowCreate} projectId={projectId} onSaved={() => qc.invalidateQueries({ queryKey: ['submittals', projectId] })} />
    </div>
  );
}

function SubmittalDialog({ open, onOpenChange, projectId, onSaved }) {
  const [form, setForm] = useState({ title: '', submittal_number: '', submittal_type: 'shop_drawings', specification_section: '', status: 'preparing', required_date: '', description: '' });
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { if (open) setForm({ title: '', submittal_number: '', submittal_type: 'shop_drawings', specification_section: '', status: 'preparing', required_date: '', description: '' }); }, [open]);
  const submit = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try { await base44.entities.Submittal.create({ ...form, project_id: projectId }); toast.success('Submittal created'); onSaved(); onOpenChange(false); }
    catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>New Submittal</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Submittal #</Label><Input value={form.submittal_number} onChange={(e) => setForm({ ...form, submittal_number: e.target.value })} /></div>
          <div><Label>Spec Section</Label><Input value={form.specification_section} onChange={(e) => setForm({ ...form, specification_section: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Type</Label><select className="w-full border rounded p-2 text-sm" value={form.submittal_type} onChange={(e) => setForm({ ...form, submittal_type: e.target.value })}>{TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}</select></div>
          <div><Label>Status</Label><select className="w-full border rounded p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
        </div>
        <div><Label>Required Date</Label><Input type="date" value={form.required_date} onChange={(e) => setForm({ ...form, required_date: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Create</Button></div>
      </div>
    </DialogContent></Dialog>
  );
}