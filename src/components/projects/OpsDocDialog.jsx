import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { OPS_TYPES, TYPE_CONFIG } from './OpsDocsTab';

export default function OpsDocDialog({ open, onOpenChange, projectId, organizationId, phaseOptions, onSaved }) {
  const [form, setForm] = useState({ title: '', type: 'dispatch_packet', linked_phase: '', notes: '', hours: '', labor_budget: '' });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enteredBy, setEnteredBy] = useState('');

  React.useEffect(() => {
    if (open) {
      setForm({ title: '', type: 'dispatch_packet', linked_phase: '', notes: '', hours: '', labor_budget: '' });
      setFiles([]);
      base44.auth.me().catch(() => null).then((me) => setEnteredBy(me?.full_name || me?.email || ''));
    }
  }, [open]);

  const isResourcePlan = form.type === 'resource_plan';

  const submit = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const file_uris = [];
      for (const f of files) {
        setUploading(true);
        const up = await base44.integrations.Core.UploadPrivateFile({ file: f.file });
        file_uris.push(up.file_uri);
        setUploading(false);
      }
      await base44.entities.OpsDoc.create({
        organization_id: organizationId,
        project_id: projectId,
        type: form.type,
        title: form.title,
        linked_phase: form.linked_phase || '',
        notes: form.notes || '',
        file_attachments: file_uris,
        entered_by: enteredBy,
        hours: isResourcePlan ? Number(form.hours) || 0 : 0,
        labor_budget: isResourcePlan ? Number(form.labor_budget) || 0 : 0,
      });
      toast.success('Ops doc created');
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed: ' + (e.message || 'error'));
    }
    setSaving(false);
    setUploading(false);
  };

  const pickFiles = (list) => {
    const picked = Array.from(list || []).map((file) => ({ file, name: file.name }));
    setFiles((prev) => [...prev, ...picked]);
  };
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Ops / Field Doc</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Type</Label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {OPS_TYPES.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
            </select>
          </div>
          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label>Linked Phase</Label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={form.linked_phase}
              onChange={(e) => setForm({ ...form, linked_phase: e.target.value })}
            >
              <option value="">— None —</option>
              {phaseOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {isResourcePlan && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hours</Label><Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="212" /></div>
              <div><Label>Labor Budget ($)</Label><Input type="number" value={form.labor_budget} onChange={(e) => setForm({ ...form, labor_budget: e.target.value })} placeholder="53000" /></div>
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <Label>File attachments (stored privately)</Label>
            <Input type="file" multiple onChange={(e) => pickFiles(e.target.files)} />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border rounded px-2 py-1 text-xs">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500">Entered by: <span className="font-medium">{enteredBy || '—'}</span></div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>
              {(saving || uploading) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {uploading ? 'Uploading…' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}