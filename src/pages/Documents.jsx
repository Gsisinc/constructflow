import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download, Trash2, GitCompare, History, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createAuditLog } from '@/lib/auditLog';
import { hasPermission, loadPolicy } from '@/lib/permissions';

async function safeCreateDocumentVersion(payload) {
  try {
    return await base44.entities.DocumentVersion.create(payload);
  } catch (error) {
    console.warn('DocumentVersion entity unavailable. Skipping version record.', error);
    return null;
  }
}

async function safeListDocumentVersions(documentId) {
  try {
    return await base44.entities.DocumentVersion.filter({ document_id: documentId }, '-version_number');
  } catch (error) {
    console.warn('DocumentVersion entity unavailable. Returning empty list.', error);
    return [];
  }
}

export default function Documents() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState(null);
  const [compareLeft, setCompareLeft] = useState('');
  const [compareRight, setCompareRight] = useState('');
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [newVersionDoc, setNewVersionDoc] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'drawing',
    status: 'draft'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser', 'documents-page'],
    queryFn: () => base44.auth.me()
  });

  const { data: policy } = useQuery({
    queryKey: ['permissionPolicy', user?.organization_id],
    queryFn: () => loadPolicy({ organizationId: user.organization_id }),
    enabled: !!user?.organization_id
  });

  const role = user?.role || user?.user_role || 'viewer';
  const canCreateDocuments = hasPermission({ policy, role, module: 'documents', action: 'create' });
  const canDeleteDocuments = hasPermission({ policy, role, module: 'documents', action: 'delete' });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', selectedProject],
    queryFn: () => (selectedProject ? base44.entities.Document.filter({ project_id: selectedProject }, '-created_date') : Promise.resolve([])),
    enabled: !!selectedProject
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['documentVersions', selectedDocForHistory?.id],
    queryFn: () => safeListDocumentVersions(selectedDocForHistory.id),
    enabled: !!selectedDocForHistory?.id
  });

  const compareSelection = useMemo(() => {
    const left = versions.find((v) => v.id === compareLeft);
    const right = versions.find((v) => v.id === compareRight);
    return { left, right };
  }, [versions, compareLeft, compareRight]);

  const createMutation = useMutation({
    mutationFn: async () => {
      let fileMeta = null;
      if (selectedFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
        fileMeta = {
          file_url,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size
        };
      }

      const document = await base44.entities.Document.create({
        ...formData,
        ...fileMeta,
        project_id: selectedProject,
        organization_id: user?.organization_id || null,
        version: 1
      });

      await safeCreateDocumentVersion({
        document_id: document.id,
        organization_id: user?.organization_id || null,
        version_number: 1,
        file_url: fileMeta?.file_url || null,
        notes: 'Initial upload',
        created_by: user?.id || null
      });

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'document_created',
        entityType: 'Document',
        entityId: document.id,
        after: document,
        metadata: { project_id: selectedProject }
      });

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedProject] });
      setFormData({ name: '', type: 'drawing', status: 'draft' });
      setSelectedFile(null);
      setShowForm(false);
      toast.success('Document uploaded and versioned successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Failed to upload document');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc) => {
      await base44.entities.Document.delete(doc.id);
      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'document_deleted',
        entityType: 'Document',
        entityId: doc.id,
        before: doc,
        metadata: { project_id: doc.project_id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedProject] });
      toast.success('Document deleted');
    }
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async () => {
      const doc = documents.find((item) => item.id === newVersionDoc);
      if (!doc || !newVersionFile) return;

      const { file_url } = await base44.integrations.Core.UploadFile({ file: newVersionFile });
      const nextVersion = Number(doc.version || 1) + 1;

      const updatedDoc = await base44.entities.Document.update(doc.id, {
        file_url,
        file_name: newVersionFile.name,
        file_type: newVersionFile.type,
        file_size: newVersionFile.size,
        version: nextVersion,
        status: 'pending_review'
      });

      await safeCreateDocumentVersion({
        document_id: doc.id,
        organization_id: user?.organization_id || null,
        version_number: nextVersion,
        file_url,
        notes: 'Uploaded new version',
        created_by: user?.id || null
      });

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: 'document_version_uploaded',
        entityType: 'Document',
        entityId: doc.id,
        before: doc,
        after: updatedDoc,
        metadata: { version: nextVersion }
      });

      return doc.id;
    },
    onSuccess: (docId) => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedProject] });
      queryClient.invalidateQueries({ queryKey: ['documentVersions', docId] });
      setNewVersionDoc('');
      setNewVersionFile(null);
      toast.success('New version uploaded');
    },
    onError: () => toast.error('Failed to upload new version')
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'drawing': return 'bg-blue-100 text-blue-800';
      case 'specification': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-red-100 text-red-800';
      case 'permit': return 'bg-green-100 text-green-800';
      case 'report': return 'bg-orange-100 text-orange-800';
      case 'photo': return 'bg-pink-100 text-pink-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'superseded': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Project Documents</h1>
        <div className="flex gap-2">
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" disabled={!canCreateDocuments}>
                <Plus className="h-4 w-4 mr-2" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Document Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drawing">Drawing</SelectItem>
                    <SelectItem value="specification">Specification</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="permit">Permit</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <label className="block text-sm">
                  <span className="text-slate-700">File</span>
                  <Input type="file" className="mt-1" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!selectedProject || !formData.name || createMutation.isPending || !canCreateDocuments}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {createMutation.isPending ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!canCreateDocuments || !documents.length}>
                <Upload className="h-4 w-4 mr-2" /> Upload New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload New Document Version</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={newVersionDoc} onValueChange={setNewVersionDoc}>
                  <SelectTrigger><SelectValue placeholder="Choose document" /></SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => <SelectItem key={doc.id} value={doc.id}>{doc.name} (v{doc.version || 1})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="file" onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)} />
                <Button
                  className="w-full"
                  disabled={!newVersionDoc || !newVersionFile || uploadVersionMutation.isPending}
                  onClick={() => uploadVersionMutation.mutate()}
                >
                  {uploadVersionMutation.isPending ? 'Uploading...' : 'Upload Version'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-2">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Select a Project" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedProject ? (
        <Card><CardContent className="pt-12 pb-12 text-center"><FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Select a project to view documents</p></CardContent></Card>
      ) : documents.length === 0 ? (
        <Card><CardContent className="pt-12 pb-12 text-center"><FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No documents yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTypeColor(doc.type)}>{doc.type.replace('_', ' ')}</Badge>
                      <Badge className={getStatusColor(doc.status)}>{doc.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline">v{doc.version || 1}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDocForHistory(doc)}>
                      <History className="h-4 w-4" />
                    </Button>
                    {doc.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(doc)} disabled={!canDeleteDocuments}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {doc.notes && <CardContent><p className="text-sm text-slate-600">{doc.notes}</p></CardContent>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDocForHistory} onOpenChange={(open) => !open && setSelectedDocForHistory(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Version History & Compare — {selectedDocForHistory?.name}</DialogTitle>
          </DialogHeader>

          {versions.length === 0 ? (
            <p className="text-sm text-slate-500">No version history available.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <Select value={compareLeft} onValueChange={setCompareLeft}>
                  <SelectTrigger><SelectValue placeholder="Left version" /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>Version {v.version_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={compareRight} onValueChange={setCompareRight}>
                  <SelectTrigger><SelectValue placeholder="Right version" /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>Version {v.version_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><GitCompare className="h-4 w-4" /> Left</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>Version: {compareSelection.left?.version_number || '—'}</p>
                    <p>Created by: {compareSelection.left?.created_by || '—'}</p>
                    <p>Notes: {compareSelection.left?.notes || '—'}</p>
                    {compareSelection.left?.file_url && <a href={compareSelection.left.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open file</a>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><GitCompare className="h-4 w-4" /> Right</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>Version: {compareSelection.right?.version_number || '—'}</p>
                    <p>Created by: {compareSelection.right?.created_by || '—'}</p>
                    <p>Notes: {compareSelection.right?.notes || '—'}</p>
                    {compareSelection.right?.file_url && <a href={compareSelection.right.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open file</a>}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">All Versions</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-auto">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                      <div>
                        <p className="font-medium">Version {v.version_number}</p>
                        <p className="text-slate-500">{v.notes || 'No notes'}</p>
                      </div>
                      {v.file_url && <a className="text-blue-600 underline" href={v.file_url} target="_blank" rel="noreferrer">Open</a>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
