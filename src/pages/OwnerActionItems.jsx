import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListChecks, Filter } from 'lucide-react';

const NAVY = '#0F1B2D';
const GOLD = '#E8B547';

const STATUSES = ['Open', 'In Progress', 'Waiting', 'Done'];
const CATEGORIES = ['Accounts', 'Licensing/NICET', 'Decisions', 'Approvals', 'Other'];

const STATUS_STYLE = {
  Open: 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Waiting: 'bg-purple-100 text-purple-700',
  Done: 'bg-emerald-100 text-emerald-700',
};
const CATEGORY_STYLE = {
  Accounts: 'bg-sky-100 text-sky-700',
  'Licensing/NICET': 'bg-indigo-100 text-indigo-700',
  Decisions: 'bg-amber-100 text-amber-700',
  Approvals: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600',
};

const EMPTY = { title: '', category: 'Other', status: 'Open', owner: '', due_date: '', notes: '' };

export default function OwnerActionItems() {
  const { user } = useAuth();
  const orgId = user?.organization_id;
  const qc = useQueryClient();

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // item or null
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['owner-action-items', orgId],
    queryFn: async () => {
      const query = orgId ? { organization_id: orgId } : {};
      const page = await base44.entities.OwnerActionItem.filter(query, { sort: 'sort_order', limit: 500 });
      return page?.items || page || [];
    },
    enabled: !!orgId,
  });

  const counts = useMemo(() => {
    const c = { Open: 0, 'In Progress': 0, Waiting: 0, Done: 0 };
    items.forEach((i) => { if (c[i.status] !== undefined) c[i.status] += 1; });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterStatus !== 'All' && i.status !== filterStatus) return false;
      if (filterCategory !== 'All' && i.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(i.title?.toLowerCase().includes(q) || i.notes?.toLowerCase().includes(q) || i.owner?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [items, filterStatus, filterCategory, search]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY, owner: user?.full_name || 'Kemar' }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title, category: item.category, status: item.status, owner: item.owner || '', due_date: item.due_date || '', notes: item.notes || '' }); setDialogOpen(true); };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, organization_id: orgId };
      if (editing) {
        await base44.entities.OwnerActionItem.update(editing.id, payload);
        toast.success('Action item updated');
      } else {
        await base44.entities.OwnerActionItem.create(payload);
        toast.success('Action item added');
      }
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['owner-action-items', orgId] });
    } catch (e) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item, status) => {
    try {
      await base44.entities.OwnerActionItem.update(item.id, { status });
      qc.invalidateQueries({ queryKey: ['owner-action-items', orgId] });
      toast.success(`Marked "${item.title}" ${status}`);
    } catch (e) {
      toast.error(e?.message || 'Failed to update status');
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await base44.entities.OwnerActionItem.delete(item.id);
      qc.invalidateQueries({ queryKey: ['owner-action-items', orgId] });
      toast.success('Action item deleted');
    } catch (e) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6" style={{ color: NAVY }} /> Owner Action Items
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Kemar's master list: accounts, setup, decisions, approvals</p>
        </div>
        <Button onClick={openNew} className="gap-1.5" style={{ backgroundColor: NAVY, color: '#fff' }}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Status count chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <Card key={s} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[s]}`}>{s}</span>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 leading-none">{counts[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Label className="text-xs text-slate-500">Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, notes, owner..." />
          </div>
          <div className="w-full sm:w-44">
            <Label className="text-xs text-slate-500">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Label className="text-xs text-slate-500">Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-base font-semibold text-slate-900">{filtered.length} items</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <ListChecks className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No items match your filters</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <li key={item.id} className="px-4 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_STYLE[item.category] || CATEGORY_STYLE.Other}`}>{item.category}</span>
                      </div>
                      {item.notes && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{item.notes}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                        {item.owner && <span>Owner: {item.owner}</span>}
                        {item.due_date && <span>Due: {item.due_date}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select value={item.status} onValueChange={(v) => changeStatus(item, v)}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => remove(item)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Action Item' : 'Add Action Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Set up ADI supplier account" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Kemar" />
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Detail / context" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} style={{ backgroundColor: NAVY, color: '#fff' }}>
              {saving ? 'Saving...' : (editing ? 'Save changes' : 'Add item')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}