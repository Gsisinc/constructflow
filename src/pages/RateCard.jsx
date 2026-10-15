import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import CompanyStandardsFloors from '@/components/companyStandards/CompanyStandardsFloors';

const CATEGORIES = ['labor', 'material', 'equipment', 'subcontractor', 'other'];
const DIVISIONS = ['fire_alarm', 'low_voltage', 'drone', 'software', 'other', ''];
const catColor = { labor: 'bg-blue-100 text-blue-700', material: 'bg-amber-100 text-amber-700', equipment: 'bg-purple-100 text-purple-700', subcontractor: 'bg-indigo-100 text-indigo-700', other: 'bg-slate-100 text-slate-600' };

export default function RateCard() {
  const [search, setSearch] = useState('');
  const [fCat, setFCat] = useState('all');
  const [fDiv, setFDiv] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ratecard-list'],
    queryFn: async () => (await base44.entities.RateCard.filter({}, { sort: 'item_name', limit: 500 }))?.items || [],
  });

  const filtered = useMemo(() => items.filter(r => {
    const ms = (r.item_name || '').toLowerCase().includes(search.toLowerCase());
    return ms && (fCat === 'all' || r.category === fCat) && (fDiv === 'all' || r.division === fDiv);
  }), [items, search, fCat, fDiv]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Rate Card</h1>
          <p className="text-sm text-slate-500 mt-1">Standard labor, material & equipment rates</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => { setEditing(null); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> Add Rate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rates</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fCat} onChange={(e) => setFCat(e.target.value)}>
              <option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fDiv} onChange={(e) => setFDiv(e.target.value)}>
              <option value="all">All Divisions</option>{DIVISIONS.map(d => <option key={d || 'none'} value={d}>{d ? d.replace('_', ' ') : 'General'}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No rates yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Division</th>
                    <th className="text-left p-3">Unit</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{r.item_name}</td>
                      <td className="p-3"><Badge className={catColor[r.category] || 'bg-slate-100'}>{r.category}</Badge></td>
                      <td className="p-3 text-slate-600">{r.division ? r.division.replace('_',' ') : 'General'}</td>
                      <td className="p-3 text-slate-600">{r.unit || '—'}</td>
                      <td className="p-3 text-right font-semibold">${(r.unit_price || 0).toLocaleString()}</td>
                      <td className="p-3 text-right"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditing(r); setShowCreate(true); }}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyStandardsFloors />

      <RateDialog open={showCreate} onOpenChange={setShowCreate} editing={editing} onSaved={() => qc.invalidateQueries({ queryKey: ['ratecard-list'] })} />
    </div>
  );
}

function RateDialog({ open, onOpenChange, editing, onSaved }) {
  const blank = { item_name: '', category: 'labor', unit: '', unit_price: '', division: '', notes: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { setForm(editing ? { ...blank, ...editing, unit_price: editing.unit_price ?? '' } : blank); }, [editing, open]);

  const submit = async () => {
    if (!form.item_name) { toast.error('Item name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, unit_price: form.unit_price ? Number(form.unit_price) : 0 };
      if (editing) await base44.entities.RateCard.update(editing.id, payload);
      else await base44.entities.RateCard.create(payload);
      toast.success(editing ? 'Updated' : 'Created'); onSaved(); onOpenChange(false);
    } catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? 'Edit Rate' : 'Add Rate'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Item Name *</Label><Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Division</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })}>
                <option value="">General</option>{DIVISIONS.filter(d => d).map(d => <option key={d} value={d}>{d.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="hr, LF, EA…" /></div>
            <div><Label>Unit Price ($)</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editing ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}