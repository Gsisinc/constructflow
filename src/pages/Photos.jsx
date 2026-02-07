import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Photos() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['photos', selectedProject],
    queryFn: () => selectedProject ? base44.entities.Document.filter({ project_id: selectedProject, type: 'photo' }) : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] })
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({
        project_id: selectedProject,
        type: 'photo',
        file_url,
        name: file.name,
        size: file.size
      });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      setShowForm(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Photo Gallery</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" /> Upload Photos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                disabled={!selectedProject || uploading}
                className="block w-full text-sm border rounded-lg p-2"
              />
              {uploading && <p className="text-sm text-slate-600">Uploading...</p>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">Select a Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-slate-100 overflow-hidden relative group">
              <img
                src={doc.file_url}
                alt={doc.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <a href={doc.file_url} download className="p-2 bg-white rounded-full text-slate-900 hover:bg-slate-100">
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
              <p className="text-xs text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No photos yet. Upload some to get started!</p>
        </div>
      )}
    </div>
  );
}