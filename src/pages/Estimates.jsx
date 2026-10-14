import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Search, Plus, Loader2, FileText, History, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

const safeNum = (n) => (Number.isFinite(n) ? n : 0);
const fmt = (n) => `$${safeNum(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const DIVISIONS = ['fire_alarm', 'low_voltage', 'drone', 'software', 'other'];
const STATUSES = ['draft', 'estimating', 'ready_for_bid', 'submitted', 'won', 'lost', 'archived'];

export default function Estimates() {
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('all');
  const [fBid, setFBid] = useState('all');
  const [fDivision, setFDivision] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fOwner, setFOwner] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['estimates-list'],
    queryFn: async () => (await base44.entities.Estimate.filter({}, { sort: '-created_date', limit: 200 }))?.items || [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['estimates-projects'],
    queryFn: async () => (await base44.entities.Project.filter({}, { limit: 200, fields: ['name'] }))?.items || [],
  });
  const { data: bids = [] } = useQuery({
    queryKey: ['estimates-bids'],
    queryFn: async () => (await base44.entities.BidOpportunity.filter({}, { limit: 200, fields: ['title', 'project_name'] }))?.items || [],
  });

  const owners = useMemo(() => {
    const set = new Set(estimates.map(e => e.owner_name).filter(Boolean));
    return Array.from(set);
  }, [estimates]);

  const filtered = useMemo(() => estimates.filter(e => {
    const ms = (e.project_name || '').toLowerCase().includes(search.toLowerCase()) || (e.estimate_number || '').toLowerCase().includes(search.toLowerCase());
    const mProj = fProject === 'all' || e.linked_project_id === fProject;
    const mBid = fBid === 'all' || e.linked_bid_id === fBid;
    const mDiv = fDivision === 'all' || e.division === fDivision;
    const mStat = fStatus === 'all' || e.status === fStatus;
    const mOwn = fOwner === 'all' || e.owner_name === fOwner;
    return ms && mProj && mBid && mDiv && mStat && mOwn;
  }), [estimates, search, fProject, fBid, fDivision, fStatus, fOwner]);

  // Group by bid/job to show "current" + version history
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(e => {
      const key = e.linked_bid_id || e.linked_project_id || e.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    Array.from(map.values()).forEach(arr => arr.sort((a, b) => (b.version || 1) - (a.version || 1)));
    return Array.from(map.entries());
  }, [filtered]);

  const totalCurrent = filtered.filter(e => e.is_current).reduce((s, e) => s + safeNum(e.total_bid_amount), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Estimates</h1>
          <p className="text-sm text-slate-500 mt-1">One current estimate per bid/job, with full version history</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Estimate
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total Estimates" value={estimates.length} icon={FileText} tone="slate" />
        <KPI label="Current Value" value={fmt(totalCurrent)} icon={DollarSign} tone="green" />
        <KPI label="Drafts" value={estimates.filter(e => e.status === 'draft').length} icon={History} tone="amber" />
        <KPI label="Submitted" value={estimates.filter(e => e.status === 'submitted').length} icon={ArrowRight} tone="blue" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={fProject} onValueChange={setFProject}>
              <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Projects</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fBid} onValueChange={setFBid}>
              <SelectTrigger><SelectValue placeholder="Bid" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Bids</SelectItem>{bids.map(b => <SelectItem key={b.id} value={b.id}>{b.title || b.project_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fDivision} onValueChange={setFDivision}>
              <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Divisions</SelectItem>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fOwner} onValueChange={setFOwner}>
              <SelectTrigger><SelectValue placeholder="Owner" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Owners</SelectItem>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : grouped.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No estimates yet. Create one from a bid or project.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([key, versions]) => {
                const current = versions.find(v => v.is_current) || versions[0];
                return (
                  <div key={key} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{current.project_name || current.estimate_number || 'Untitled'}</h3>
                          {current.is_current && <Badge className="bg-green-100 text-green-700">Current</Badge>}
                          {current.division && <Badge variant="outline">{current.division.replace('_', ' ')}</Badge>}
                          {current.status && <Badge variant="secondary">{current.status.replace('_', ' ')}</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {current.owner_name ? `Owner: ${current.owner_name} · ` : ''}v{current.version || 1} · {current.created_date ? format(new Date(current.created_date), 'MMM d, yyyy') : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Total</p>
                          <p className="text-lg font-bold text-slate-900">{fmt(current.total_bid_amount)}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl('EstimatorWizard'))}>Open</Button>
                      </div>
                    </div>
                    {versions.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><History className="h-3.5 w-3.5" /> Version history ({versions.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {versions.map(v => (
                            <span key={v.id} className={`text-xs px-2 py-1 rounded ${v.is_current ? 'bg-green-50 text-green-700 font-medium' : 'bg-slate-50 text-slate-500'}`}>
                              v{v.version || 1} · {fmt(v.total_bid_amount)} {v.is_current ? '· current' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEstimateDialog open={showCreate} onOpenChange={setShowCreate} projects={projects} bids={bids} onCreated={() => qc.invalidateQueries({ queryKey: ['estimates-list'] })} />
    </div>
  );
}

function CreateEstimateDialog({ open, onOpenChange, projects, bids, onCreated }) {
  const [form, setForm] = useState({ project_name: '', linked_bid_id: '', linked_project_id: '', division: '', owner_name: '', total_bid_amount: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.project_name) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      await base44.entities.Estimate.create({
        project_name: form.project_name,
        linked_bid_id: form.linked_bid_id || undefined,
        linked_project_id: form.linked_project_id || undefined,
        division: form.division || undefined,
        owner_name: form.owner_name || undefined,
        total_bid_amount: form.total_bid_amount ? Number(form.total_bid_amount) : 0,
        notes: form.notes || undefined,
        status: 'draft',
        version: 1,
        is_current: true,
      });
      toast.success('Estimate created');
      onCreated();
      onOpenChange(false);
      setForm({ project_name: '', linked_bid_id: '', linked_project_id: '', division: '', owner_name: '', total_bid_amount: '', notes: '' });
    } catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Estimate</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label>Project Name *</Label><Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Link to Bid</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.linked_bid_id} onChange={(e) => setForm({ ...form, linked_bid_id: e.target.value })}>
                <option value="">— None —</option>
                {bids.map(b => <option key={b.id} value={b.id}>{b.title || b.project_name}</option>)}
              </select>
            </div>
            <div><Label>Link to Project</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.linked_project_id} onChange={(e) => setForm({ ...form, linked_project_id: e.target.value })}>
                <option value="">— None —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Division</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })}>
                <option value="">— Select —</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><Label>Owner</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></div>
          </div>
          <div><Label>Total Bid Amount</Label><Input type="number" value={form.total_bid_amount} onChange={(e) => setForm({ ...form, total_bid_amount: e.target.value })} /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={handleSubmit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KPI({ label, value, icon: Icon, tone }) {
  const tones = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', green: 'bg-green-100 text-green-600' };
  return (
    <Card><CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${tones[tone] || tones.slate}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
      </div>
    </CardContent></Card>
  );
}