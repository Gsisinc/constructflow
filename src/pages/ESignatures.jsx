import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenLine, Plus, Clock, CheckCircle2, XCircle, Send, FileText, Upload, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-500',
};

const DOC_TYPES = ['Contract', 'Change Order', 'Subcontract', 'Lien Waiver', 'NDA', 'Proposal', 'Other'];

export default function ESignatures() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '', recipient_name: '', recipient_email: '', document_type: 'Contract', project: '', notes: ''
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Use Document entity to track e-signature requests
  const { data: docs = [] } = useQuery({
    queryKey: ['esignDocs'],
    queryFn: () => base44.entities.Document.filter({ type: 'contract' }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create({
      name: data.name,
      type: 'contract',
      status: 'pending_review',
      notes: `ESIGN|recipient:${data.recipient_name}|email:${data.recipient_email}|doctype:${data.document_type}|project:${data.project}|${data.notes}`,
      project_id: data.project || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esignDocs'] });
      setShowForm(false);
      setFormData({ name: '', recipient_name: '', recipient_email: '', document_type: 'Contract', project: '', notes: '' });
      toast.success('E-signature request created and sent');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Document.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esignDocs'] }),
  });

  // Parse esign docs (notes field contains metadata)
  const esignDocs = docs.filter(d => d.notes?.startsWith('ESIGN|')).map(d => {
    const parts = Object.fromEntries(
      d.notes.replace('ESIGN|', '').split('|').map(p => { const [k, v] = p.split(':'); return [k, v]; })
    );
    return { ...d, ...parts, signStatus: d.status === 'approved' ? 'signed' : d.status === 'rejected' ? 'declined' : d.status === 'draft' ? 'draft' : 'sent' };
  });

  const filtered = tab === 'all' ? esignDocs : esignDocs.filter(d => d.signStatus === tab);

  const stats = {
    all: esignDocs.length,
    sent: esignDocs.filter(d => d.signStatus === 'sent').length,
    signed: esignDocs.filter(d => d.signStatus === 'signed').length,
    declined: esignDocs.filter(d => d.signStatus === 'declined').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">E-Signature Collection</h1>
          <p className="text-slate-500 mt-1">Send contracts for e-signature and track signing status</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Signature Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.all, icon: FileText, color: 'text-slate-600' },
          { label: 'Awaiting', value: stats.sent, icon: Clock, color: 'text-blue-600' },
          { label: 'Signed', value: stats.signed, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Declined', value: stats.declined, icon: XCircle, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
          <TabsTrigger value="sent">Pending ({stats.sent})</TabsTrigger>
          <TabsTrigger value="signed">Signed ({stats.signed})</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <PenLine className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No signature requests yet</p>
                <p className="text-sm text-slate-400 mt-1">Send your first document for e-signature</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(doc => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 px-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                          <p className="text-sm text-slate-500">
                            To: {doc.recipient_name || 'Unknown'} ({doc.email || 'No email'})
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {doc.doctype} • {format(new Date(doc.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={STATUS_COLORS[doc.signStatus] || 'bg-slate-100 text-slate-700'}>
                          {doc.signStatus}
                        </Badge>
                        {doc.signStatus === 'sent' && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => {
                              updateMutation.mutate({ id: doc.id, status: 'approved' });
                              toast.success('Marked as signed');
                            }}>
                              <CheckCircle2 className="h-3 w-3" /> Signed
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-xs text-red-600" onClick={() => {
                              updateMutation.mutate({ id: doc.id, status: 'rejected' });
                            }}>
                              <XCircle className="h-3 w-3" /> Declined
                            </Button>
                          </>
                        )}
                        {doc.signStatus === 'draft' && (
                          <Button size="sm" className="gap-1 text-xs" onClick={() => {
                            updateMutation.mutate({ id: doc.id, status: 'pending_review' });
                            toast.success('Sent for signature');
                          }}>
                            <Send className="h-3 w-3" /> Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New E-Signature Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input placeholder="e.g. Subcontract Agreement - Phase 2"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={formData.document_type} onValueChange={v => setFormData({ ...formData, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formData.project} onValueChange={v => setFormData({ ...formData, project: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Name *</Label>
                <Input placeholder="John Smith"
                  value={formData.recipient_name}
                  onChange={e => setFormData({ ...formData, recipient_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Recipient Email *</Label>
                <Input type="email" placeholder="john@company.com"
                  value={formData.recipient_email}
                  onChange={e => setFormData({ ...formData, recipient_email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Any special instructions..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.name || !formData.recipient_name || !formData.recipient_email || createMutation.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" /> Send for Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}