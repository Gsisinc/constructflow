import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Loader2, FileStack, FolderKanban, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DocRow, DocumentDialog, DOC_TYPES, typeColor, typeLabel } from '@/components/projects/DocumentsTab';

export default function Documents() {
  const qc = useQueryClient();
  const [fProject, setFProject] = useState('all');
  const [fType, setFType] = useState('all');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects = [], isLoading: lp } = useQuery({
    queryKey: ['projects-all-docs'],
    queryFn: async () => (await base44.entities.Project.filter({}, { limit: 500, fields: ['name', 'organization_id'] }))?.items || [],
  });
  const projName = (id) => projects.find(p => p.id === id)?.name || 'Unknown project';

  const { data: docs = [], isLoading: ld } = useQuery({
    queryKey: ['all-documents'],
    queryFn: async () => (await base44.entities.Document.filter({}, { sort: '-created_date', limit: 500 }))?.items || [],
  });

  const filtered = useMemo(() => docs.filter(d => {
    if (fProject !== 'all' && d.project_id !== fProject) return false;
    if (fType !== 'all' && d.type !== fType) return false;
    const dd = d.doc_date || (d.created_date ? d.created_date.split('T')[0] : '');
    if (fFrom && dd < fFrom) return false;
    if (fTo && dd > fTo) return false;
    if (search && !(d.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [docs, fProject, fType, fFrom, fTo, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(d => { (map[d.project_id] = map[d.project_id] || []).push(d); });
    return map;
  }, [filtered]);

  const projectIds = Object.keys(grouped);
  const counts = useMemo(() => {
    const byType = {};
    docs.forEach(d => { byType[d.type] = (byType[d.type] || 0) + 1; });
    return byType;
  }, [docs]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">All project documents, grouped by project · {docs.length} total</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Document</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fProject} onChange={(e) => setFProject(e.target.value)}>
              <option value="all">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={fType} onChange={(e) => setFType(e.target.value)}>
              <option value="all">All Types</option>{DOC_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </select>
            <div><Label className="text-xs">From</Label><Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {lp || ld ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><FileStack className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">No documents match your filters.</p></div>
          ) : (
            <div className="space-y-4">
              {projectIds.map(pid => {
                const items = grouped[pid];
                const isCol = collapsed[pid];
                return (
                  <div key={pid} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button type="button" onClick={() => setCollapsed({ ...collapsed, [pid]: !isCol })} className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left">
                      {isCol ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                      <FolderKanban className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-slate-900 text-sm">{projName(pid)}</span>
                      <span className="text-xs text-slate-500 ml-1">({items.length})</span>
                    </button>
                    {!isCol && (
                      <div className="p-2 space-y-2 bg-white">
                        {items.map(d => <DocRow key={d.id} doc={d} onDelete={async (doc) => { try { await base44.entities.Document.delete(doc.id); qc.invalidateQueries({ queryKey: ['all-documents'] }); toast.success('Deleted'); } catch (e) { toast.error('Delete failed'); } }} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentDialog open={showCreate} onOpenChange={setShowCreate} onSaved={() => qc.invalidateQueries({ queryKey: ['all-documents'] })} projectOptions={projects} />
    </div>
  );
}