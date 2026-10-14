import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Loader2, Users, DollarSign, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost'];
const stageColor = {
  new: 'bg-slate-100 text-slate-700', contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-indigo-100 text-indigo-700', proposal_sent: 'bg-amber-100 text-amber-700',
  negotiating: 'bg-purple-100 text-purple-700', won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function Leads() {
  const [search, setSearch] = useState('');
  const [fStage, setFStage] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-list'],
    queryFn: async () => (await base44.entities.Lead.filter({}, { sort: '-created_date', limit: 200 }))?.items || [],
  });

  const filtered = useMemo(() => leads.filter(l => {
    const ms = (l.company_name || l.contact_name || '').toLowerCase().includes(search.toLowerCase());
    return ms && (fStage === 'all' || l.status === fStage);
  }), [leads, search, fStage]);

  const hot = leads.filter(l => l.priority === 'hot').length;
  const won = leads.filter(l => l.status === 'won').length;
  const pipelineValue = leads.filter(l => l.status !== 'lost' && l.status !== 'won').reduce((s, l) => s + (l.estimated_value || 0), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Track sales leads through the pipeline</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => { setEditing(null); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> New Lead
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total Leads" value={leads.length} icon={Users} tone="slate" />
        <KPI label="Hot Leads" value={hot} icon={Flame} tone="red" />
        <KPI label="Won" value={won} icon={Users} tone="green" />
        <KPI label="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`} icon={DollarSign} tone="blue" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search leads…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fStage} onChange={(e) => setFStage(e.target.value)}>
              <option value="all">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No leads yet.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(l => (
                <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 truncate">{l.company_name || l.contact_name}</p>
                      <Badge className={stageColor[l.status] || 'bg-slate-100'}>{(l.status || 'new').replace('_', ' ')}</Badge>
                      {l.priority === 'hot' && <Badge className="bg-red-100 text-red-700">Hot</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{l.contact_name} {l.phone ? `· ${l.phone}` : ''} {l.estimated_value ? `· $${l.estimated_value.toLocaleString()}` : ''}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(l); setShowCreate(true); }}>Edit</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDialog open={showCreate} onOpenChange={setShowCreate} editing={editing} onSaved={() => qc.invalidateQueries({ queryKey: ['leads-list'] })} />
    </div>
  );
}

function LeadDialog({ open, onOpenChange, editing, onSaved }) {
  const blank = { company_name: '', contact_name: '', email: '', phone: '', lead_source: 'referral', project_type: '', estimated_value: '', status: 'new', priority: 'warm', description: '', follow_up_date: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { setForm(editing ? { ...blank, ...editing } : blank); }, [editing, open]);

  const submit = async () => {
    if (!form.contact_name) { toast.error('Contact name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined };
      if (editing) await base44.entities.Lead.update(editing.id, payload);
      else await base44.entities.Lead.create(payload);
      toast.success(editing ? 'Lead updated' : 'Lead created');
      onSaved(); onOpenChange(false);
    } catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'New Lead'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Company</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>Contact Name *</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Source</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.lead_source} onChange={(e) => setForm({ ...form, lead_source: e.target.value })}>
                {['referral', 'website', 'social_media', 'advertisement', 'cold_call', 'trade_show', 'other'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><Label>Stage</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><Label>Priority</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['cold', 'warm', 'hot'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Est. Value ($)</Label><Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} /></div>
            <div><Label>Follow-up Date</Label><Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></div>
          </div>
          <div><Label>Project Type</Label><Input value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editing ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KPI({ label, value, icon: Icon, tone }) {
  const tones = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-100 text-blue-600', red: 'bg-red-100 text-red-600', green: 'bg-green-100 text-green-600' };
  return (
    <Card><CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
      </div>
    </CardContent></Card>
  );
}