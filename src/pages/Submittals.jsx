import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function Submittals() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'materials',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
    submitted_by: ''
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: submittals = [] } = useQuery({
    queryKey: ['submittals', selectedProject],
    queryFn: () => selectedProject ? base44.entities.Submittal.filter({ project_id: selectedProject }, '-due_date') : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Submittal.create({
      ...data,
      project_id: selectedProject
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      setFormData({
        title: '',
        description: '',
        category: 'materials',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending',
        submitted_by: ''
      });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Submittal.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submittals'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Submittal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submittals'] })
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const pending = submittals.filter(s => s.status === 'pending').length;
  const approved = submittals.filter(s => s.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Submittals</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" /> New Submittal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Submittal</DialogTitle>
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
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="materials">Materials</option>
                <option value="equipment">Equipment</option>
                <option value="plans">Plans & Drawings</option>
                <option value="specifications">Specifications</option>
                <option value="compliance">Compliance</option>
              </select>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
              <Input
                placeholder="Submitted By"
                value={formData.submitted_by}
                onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700">
                Create Submittal
              </Button>
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

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{approved}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {submittals.map(submittal => (
          <Card key={submittal.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">{submittal.title}</CardTitle>
                    <Badge className={getStatusColor(submittal.status)}>
                      {submittal.status.charAt(0).toUpperCase() + submittal.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{submittal.category}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(submittal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-700">{submittal.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  Due: {format(new Date(submittal.due_date), 'MMM d, yyyy')}
                </div>
                {submittal.submitted_by && (
                  <div className="text-slate-600">By: {submittal.submitted_by}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {submittals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No submittals yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}