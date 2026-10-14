import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Loader2, Building2, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const COUNTIES = ['Alameda', 'Contra Costa', 'El Dorado', 'Marin', 'Napa', 'Placer', 'Sacramento', 'San Francisco', 'San Mateo', 'Santa Clara', 'Solano', 'Sonoma', 'Yolo', 'Yuba', 'Butte', 'Shasta', 'Humboldt', 'Mendocino', 'Other'];
const REGIONS = ['Bay Area', 'Sacramento', 'North State', 'Wine Country', 'Sierra', 'Other'];
const DIVISIONS = ['fire_alarm', 'low_voltage', 'drone', 'software', 'other'];
const STATUSES = ['active', 'prospect', 'do_not_use', 'inactive'];
const statusColor = { active: 'bg-green-100 text-green-700', prospect: 'bg-blue-100 text-blue-700', do_not_use: 'bg-red-100 text-red-700', inactive: 'bg-slate-100 text-slate-600' };

export default function ContractorDirectory() {
  const [search, setSearch] = useState('');
  const [fRegion, setFRegion] = useState('all');
  const [fCounty, setFCounty] = useState('all');
  const [fDivision, setFDivision] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors-list'],
    queryFn: async () => (await base44.entities.Contractor.filter({}, { sort: 'name', limit: 500 }))?.items || [],
  });

  const filtered = useMemo(() => contractors.filter(c => {
    const ms = (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.cslb_license || '').toLowerCase().includes(search.toLowerCase());
    const mR = fRegion === 'all' || c.region === fRegion;
    const mC = fCounty === 'all' || c.county === fCounty;
    const mD = fDivision === 'all' || (c.division_fit || []).includes(fDivision);
    const mS = fStatus === 'all' || c.status === fStatus;
    return ms && mR && mC && mD && mS;
  }), [contractors, search, fRegion, fCounty, fDivision, fStatus]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) { toast.error('No rows found in CSV'); setImporting(false); return; }
      const records = rows.map(r => ({
        name: r.name, website: r.website, city: r.city, county: r.county, region: r.region,
        cslb_license: r.cslb_license, classification: r.classification, phone: r.phone, email: r.email,
        source_link: r.source_link,
        division_fit: (r.division_fit || '').split('|').map(s => s.trim()).filter(Boolean),
        status: r.status || 'active', notes: r.notes,
      })).filter(r => r.name);
      const res = await base44.entities.Contractor.bulkCreate(records);
      toast.success(`Imported ${res?.length || records.length} contractors`);
      qc.invalidateQueries({ queryKey: ['contractors-list'] });
    } catch (err) { toast.error('Import failed: ' + (err.message || 'error')); }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Contractor Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Northern California contractors & GCs</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => { setEditing(null); setShowCreate(true); }}>
            <Plus className="h-4 w-4" /> Add Contractor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search name or license…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fRegion} onChange={(e) => setFRegion(e.target.value)}>
              <option value="all">All Regions</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fCounty} onChange={(e) => setFCounty(e.target.value)}>
              <option value="all">All Counties</option>{COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fDivision} onChange={(e) => setFDivision(e.target.value)}>
              <option value="all">All Divisions</option>{DIVISIONS.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="all">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">No contractors yet. Add one or import a CSV.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(c => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.city ? `${c.city}, ` : ''}{c.county || ''}</p>
                    </div>
                    <Badge className={statusColor[c.status] || 'bg-slate-100'}>{c.status}</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    {c.cslb_license && <p>CSLB: <span className="font-medium">{c.cslb_license}</span> {c.classification ? `(${c.classification})` : ''}</p>}
                    {c.phone && <p>{c.phone}</p>}
                    {c.email && <p className="truncate">{c.email}</p>}
                    {c.division_fit?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">{c.division_fit.map(d => <Badge key={d} variant="outline" className="text-[10px]">{d.replace('_',' ')}</Badge>)}</div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Site</a>}
                    {c.source_link && <a href={c.source_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Source</a>}
                    <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => { setEditing(c); setShowCreate(true); }}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ContractorDialog open={showCreate} onOpenChange={setShowCreate} editing={editing} onSaved={() => qc.invalidateQueries({ queryKey: ['contractors-list'] })} />
    </div>
  );
}

function ContractorDialog({ open, onOpenChange, editing, onSaved }) {
  const blank = { name: '', website: '', city: '', county: '', region: '', cslb_license: '', classification: '', phone: '', email: '', source_link: '', division_fit: [], status: 'active', notes: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { setForm(editing ? { ...blank, ...editing, division_fit: editing.division_fit || [] } : blank); }, [editing, open]);

  const toggleDiv = (d) => setForm({ ...form, division_fit: form.division_fit.includes(d) ? form.division_fit.filter(x => x !== d) : [...form.division_fit, d] });

  const submit = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) await base44.entities.Contractor.update(editing.id, form);
      else await base44.entities.Contractor.create(form);
      toast.success(editing ? 'Updated' : 'Created'); onSaved(); onOpenChange(false);
    } catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Edit Contractor' : 'Add Contractor'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto">
          <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>County</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}>
                <option value="">—</option>{COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Region</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                <option value="">—</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><Label>Status</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CSLB License #</Label><Input value={form.cslb_license} onChange={(e) => setForm({ ...form, cslb_license: e.target.value })} /></div>
            <div><Label>Classification</Label><Input value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} placeholder="A, B, C10, C7…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div><Label>Source Link</Label><Input value={form.source_link} onChange={(e) => setForm({ ...form, source_link: e.target.value })} /></div>
          <div>
            <Label>Division Fit</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DIVISIONS.map(d => (
                <button key={d} type="button" onClick={() => toggleDiv(d)} className={`text-xs px-2.5 py-1 rounded-full border ${form.division_fit.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-slate-600 border-slate-300'}`}>{d.replace('_',' ')}</button>
              ))}
            </div>
          </div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editing ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Minimal CSV parser with basic quoted-field support
function parseCsv(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]).map(h => h.trim().toLowerCase());
  return lines.slice(1).map(l => {
    const cells = splitLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
    return obj;
  });
}
function splitLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { q = !q; }
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}