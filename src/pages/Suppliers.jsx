import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => (await base44.entities.Supplier.filter({}, { sort: 'name', limit: 500 }))?.items || [],
  });

  const filtered = useMemo(() => suppliers.filter(s => {
    const ms = (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.category || '').toLowerCase().includes(search.toLowerCase());
    return ms && (fStatus === 'all' || s.status === fStatus);
  }), [suppliers, search, fStatus]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">Vendor & material supplier master</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => { setEditing(null); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suppliers</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">No suppliers yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(s => (
                <div key={s.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                      {s.category && <p className="text-xs text-slate-500">{s.category}</p>}
                    </div>
                    <Badge className={s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>{s.status}</Badge>
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                    {s.contact_name && <p>{s.contact_name}</p>}
                    {s.phone && <p>{s.phone}</p>}
                    {s.email && <p className="truncate">{s.email}</p>}
                    {s.payment_terms && <p className="text-slate-500">Terms: {s.payment_terms}</p>}
                  </div>
                  <Button size="sm" variant="outline" className="mt-3 h-7 text-xs" onClick={() => { setEditing(s); setShowCreate(true); }}>Edit</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog open={showCreate} onOpenChange={setShowCreate} editing={editing} onSaved={() => qc.invalidateQueries({ queryKey: ['suppliers-list'] })} />
    </div>
  );
}

function SupplierDialog({ open, onOpenChange, editing, onSaved }) {
  const blank = { name: '', category: '', contact_name: '', phone: '', email: '', website: '', address: '', payment_terms: '', status: 'active', notes: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { setForm(editing ? { ...blank, ...editing } : blank); }, [editing, open]);

  const submit = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) await base44.entities.Supplier.update(editing.id, form);
      else await base44.entities.Supplier.create(form);
      toast.success(editing ? 'Updated' : 'Created'); onSaved(); onOpenChange(false);
    } catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto">
          <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="cable, devices, conduit…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Payment Terms</Label><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30, COD…" /></div>
            <div><Label>Status</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
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