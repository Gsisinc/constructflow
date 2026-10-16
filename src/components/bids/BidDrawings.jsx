import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, FileText, Link2, Download, Trash2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BidDrawings({ bidId, organizationId }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['bid-drawings', bidId],
    queryFn: async () => (await base44.entities.Drawing.filter({ bid_id: bidId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!bidId,
  });

  const remove = async (d) => {
    if (!confirm('Delete this drawing?')) return;
    try { await base44.entities.Drawing.delete(d.id); qc.invalidateQueries({ queryKey: ['bid-drawings', bidId] }); toast.success('Drawing removed'); }
    catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-foreground">Drawings</h3>
          <p className="text-xs text-muted-foreground">Upload a drawing (PDF/DWG/image) or add a link to a bidding site / shared drive. These carry over to the project when the bid is won.</p>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Drawing</Button>
      </div>
      {isLoading ? <div className="py-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : items.length === 0 ? <div className="text-center py-8"><PenLine className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm">No drawings yet.</p></div>
        : (
          <div className="space-y-2">
            {items.map((d) => <DrawingRow key={d.id} drawing={d} onDelete={remove} />)}
          </div>
        )}
      <AddDrawingDialog open={showAdd} onOpenChange={setShowAdd} bidId={bidId} organizationId={organizationId} onSaved={() => qc.invalidateQueries({ queryKey: ['bid-drawings', bidId] })} />
    </div>
  );
}

export function DrawingRow({ drawing: d, onDelete }) {
  const [loading, setLoading] = useState(false);
  const openFile = async () => {
    if (!d.file_uri) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: d.file_uri });
      if (res?.signed_url) window.open(res.signed_url, '_blank');
    } catch (e) { toast.error('Could not open file'); }
    setLoading(false);
  };
  return (
    <Card><CardContent className="pt-4 pb-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {d.kind === 'link' ? <Link2 className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
            <p className="font-semibold text-foreground text-sm">{d.title}</p>
            {d.revision && <Badge variant="outline" className="text-xs">Rev {d.revision}</Badge>}
            <Badge variant="secondary" className="text-xs">{d.kind === 'link' ? 'Link' : 'File'}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {d.date ? format(new Date(d.date), 'MMM d, yyyy') : ''}{d.entered_by ? ` · Entered by ${d.entered_by}` : ''}
          </p>
          {d.kind === 'link' && d.link_url && (
            <a href={d.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1 mt-1">
              <Link2 className="h-3 w-3" /> {d.link_label || d.link_url}
            </a>
          )}
          {d.kind === 'file' && d.filename && <p className="text-xs text-muted-foreground mt-1 truncate">{d.filename}</p>}
        </div>
        <div className="flex gap-1.5">
          {d.kind === 'link' ? (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
              <a href={d.link_url} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /> Open</a>
            </Button>
          ) : (
            d.file_uri && <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={openFile} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Open</Button>
          )}
          {onDelete && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onDelete(d)}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>
    </CardContent></Card>
  );
}

function AddDrawingDialog({ open, onOpenChange, bidId, organizationId, onSaved }) {
  const [kind, setKind] = useState('file');
  const [form, setForm] = useState({ title: '', revision: '', date: '', link_url: '', link_label: '' });
  const [file, setFile] = useState(null);
  const [enteredBy, setEnteredBy] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setKind('file');
      setForm({ title: '', revision: '', date: '', link_url: '', link_label: '' });
      setFile(null);
      base44.auth.me().catch(() => null).then((me) => setEnteredBy(me?.full_name || me?.email || ''));
    }
  }, [open]);

  const submit = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    if (kind === 'link' && !form.link_url) { toast.error('Link URL is required'); return; }
    if (kind === 'file' && !file) { toast.error('A file is required'); return; }
    setSaving(true);
    try {
      let file_uri = '';
      let filename = '';
      if (kind === 'file') {
        const up = await base44.integrations.Core.UploadPrivateFile({ file });
        file_uri = up.file_uri;
        filename = file.name;
      }
      // Entered by: Sales
      await base44.entities.Drawing.create({
        organization_id: organizationId,
        bid_id: bidId,
        title: form.title,
        revision: form.revision || '',
        date: form.date || new Date().toISOString().split('T')[0],
        entered_by: enteredBy,
        kind,
        file_uri,
        filename,
        link_url: kind === 'link' ? form.link_url : '',
        link_label: kind === 'link' ? (form.link_label || form.title) : '',
      });
      toast.success('Drawing added');
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed: ' + (e.message || 'error'));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Add Drawing</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div className="flex gap-2">
          <Button size="sm" variant={kind === 'file' ? 'default' : 'outline'} className={kind === 'file' ? 'bg-primary' : ''} onClick={() => setKind('file')}><FileText className="h-4 w-4 mr-1" /> Upload file</Button>
          <Button size="sm" variant={kind === 'link' ? 'default' : 'outline'} className={kind === 'link' ? 'bg-primary' : ''} onClick={() => setKind('link')}><Link2 className="h-4 w-4 mr-1" /> Add link</Button>
        </div>
        <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Site Plan – Level 1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Revision</Label><Input value={form.revision} onChange={(e) => setForm({ ...form, revision: e.target.value })} placeholder="A" /></div>
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        {kind === 'file' ? (
          <div><Label>File — PDF / DWG / image (stored privately)</Label><Input type="file" accept=".pdf,.dwg,.png,.jpg,.jpeg,.tif,.tiff" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
        ) : (
          <div className="space-y-3">
            <div><Label>Link URL *</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://bidding-site.com/... or shared-drive link" /></div>
            <div><Label>Label (optional)</Label><Input value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} placeholder="e.g. Full plan set on Dropbox" /></div>
          </div>
        )}
        <div className="text-xs text-muted-foreground">Entered by: <span className="font-medium">{enteredBy || '—'}</span></div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90" disabled={saving} onClick={submit}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Add Drawing</Button>
        </div>
      </div>
    </DialogContent></Dialog>
  );
}