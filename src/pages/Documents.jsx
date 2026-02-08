import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Documents() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'drawing',
    status: 'draft'
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', selectedProject],
    queryFn: () => selectedProject ? base44.entities.Document.filter({ project_id: selectedProject }, '-created_date') : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create({
      ...data,
      project_id: selectedProject
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedProject] });
      setFormData({ name: '', type: 'drawing', status: 'draft' });
      setSelectedFile(null);
      setShowForm(false);
      toast.success('Document created successfully');
    },
    onError: () => toast.error('Failed to create document')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedProject] });
      toast.success('Document deleted');
    }
  });

  const getTypeColor = (type) => {
    switch(type) {
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
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'superseded': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Project Documents</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Document Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="superseded">Superseded</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => {
                  if (selectedProject && formData.name && formData.type) {
                    createMutation.mutate(formData);
                  }
                }}
                disabled={!selectedProject || !formData.name || createMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {createMutation.isPending ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a Project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedProject ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Select a project to view documents</p>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No documents yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map(doc => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTypeColor(doc.type)}>
                        {doc.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status.replace('_', ' ')}
                      </Badge>
                      {doc.version && (
                        <Badge variant="outline">v{doc.version}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {doc.notes && (
                <CardContent>
                  <p className="text-sm text-slate-600">{doc.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}