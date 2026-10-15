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
import { Plus, Loader2, FileText, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProjectDrawings from './ProjectDrawings';

export const DOC_TYPES = ['drawing', 'specification', 'contract', 'permit', 'report', 'photo', 'invoice', 'log', 'submittal', 'test_report', 'other'];
export const typeColor = {
  drawing: 'bg-blue-100 text-blue-700', specification: 'bg-indigo-100 text-indigo-700',
  contract: 'bg-purple-100 text-purple-700', permit: 'bg-amber-100 text-amber-700',
  report: 'bg-slate-100 text-slate-700', photo: 'bg-emerald-100 text-emerald-700',
  invoice: 'bg-rose-100 text-rose-700', log: 'bg-cyan-100 text-cyan-700',
  submittal: 'bg-teal-100 text-teal-700', test_report: 'bg-orange-100 text-orange-700',
  other: 'bg-slate-100 text-slate-600',
};
export const typeLabel = (t) => (t || 'other').replace('_', ' ');

export default function DocumentsTab({ projectId }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => (await base44.entities.Document.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });

  const remove = async (d) => {
    if (!confirm('Delete this document?')) return;
    try { await base44.entities.Document.delete(d.id); qc.invalidateQueries({ queryKey: ['project-documents', projectId] }); toast.success('Deleted'); }
    catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Document</Button>
      </div>
      {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        : docs.length === 0 ? <div className="text-center py-10"><FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">No documents yet.</p></div>
        : (
          <div className="space-y-2">
            {docs.map(d => <DocRow key={d.id} doc={d} onDelete={remove} />)}
          </div>
        )}
      <ProjectDrawings projectId={projectId} />
      <DocumentDialog open={showCreate} onOpenChange={setShowCreate} projectId={projectId} onSaved={() => qc.invalidateQueries({ queryKey: ['project-documents', projectId] })} />
    </div>
  );
}

export function DocRow({ doc, onDelete }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const open = async () => {
    if (!doc.file_url) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_url });
      window.open(res.signed_url, '_blank');
    } catch (e) { toast.error('Could not open file'); }
    setLoading(false);
  };
  return (
    <Card><CardContent className="pt-4 pb-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeColor[doc.type] || 'bg-slate-100'}>{typeLabel(doc.type)}</Badge>
            <p className="font-semibold text-slate-900 text-sm">{doc.name}</p>
            {doc.version > 1 && <Badge variant="outline" className="text-xs">v{doc.version}</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {doc.doc_date ? format(new Date(doc.doc_date), 'MMM d, yyyy') : ''} {doc.uploaded_by ? `· ${doc.uploaded_by}` : ''}
          </p>
        </div>
        <div className="flex gap-1.5">
          {doc.file_url && <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={open} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Open</Button>}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onDelete(doc)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </CardContent></Card>
  );
}

export function DocumentDialog({ open, onOpenChange, projectId, onSaved, projectOptions }) {
  const [form, setForm] = useState({ name: '', type: 'drawing', doc_date: '', notes: '', project_id: projectId || '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { if (open) { setForm({ name: '', type: 'drawing', doc_date: '', notes: '', project_id: projectId || '' }); setFile(null); } }, [open, projectId]);

  const submit = async () => {
    const pid = form.project_id || projectId;
    if (!form.name) { toast.error('Name is required'); return; }
    if (!pid) { toast.error('A project is required — no loose documents'); return; }
    setSaving(true);
    try {
      let file_uri = '';
      if (file) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file });
        file_uri = up.file_uri;
      }
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.Document.create({
        project_id: pid,
        name: form.name,
        type: form.type,
        doc_date: form.doc_date || new Date().toISOString().split('T')[0],
        uploaded_by: me?.full_name || me?.email || '',
        file_url: file_uri,
        notes: form.notes,
      });
      toast.success('Document added'); onSaved(); onOpenChange(false);
    } catch (e) { toast.error('Failed: ' + (e.message || 'error')); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        {projectOptions && (
          <div><Label>Project *</Label>
            <select className="w-full border rounded p-2 text-sm" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Select project…</option>
              {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Type</Label>
            <select className="w-full border rounded p-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </select>
          </div>
          <div><Label>Date</Label><Input type="date" value={form.doc_date} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} /></div>
        </div>
        <div><Label>File (stored privately)</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
        <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Add</Button></div>
      </div>
    </DialogContent></Dialog>
  );
}