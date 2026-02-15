import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Copy, Download, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'contracts', label: 'Contracts' },
  { value: 'bid_forms', label: 'Bid Forms' },
  { value: 'safety', label: 'Safety Checklists' },
  { value: 'punch_lists', label: 'Punch Lists' },
  { value: 'schedules', label: 'Schedules' },
  { value: 'equipment_logs', label: 'Equipment Logs' },
  { value: 'rfi_forms', label: 'RFI Forms' },
  { value: 'submittals', label: 'Submittals' },
  { value: 'daily_logs', label: 'Daily Logs' },
  { value: 'change_orders', label: 'Change Orders' },
  { value: 'closeout', label: 'Closeout' },
  { value: 'inspection', label: 'Inspection Reports' }
];

export default function TemplateLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('contracts');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TemplateLibrary.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TemplateLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowNewDialog(false);
      toast.success('Template created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TemplateLibrary.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditingTemplate(null);
      toast.success('Template updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TemplateLibrary.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted');
    }
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDuplicate = (template) => {
    const { id, created_date, updated_date, usage_count, ...rest } = template;
    createMutation.mutate({
      ...rest,
      name: `${template.name} (Copy)`
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Template Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Manage construction templates for your projects</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              if (confirm('Generate 1000+ professional templates? This may take a minute.')) {
                toast.info('Generating templates...');
                try {
                  await base44.functions.invoke('generate1000Templates', {});
                  queryClient.invalidateQueries({ queryKey: ['templates'] });
                  toast.success('Templates generated successfully!');
                } catch (err) {
                  toast.error('Failed to generate templates');
                }
              }
            }}
          >
            Generate 1000+ Templates
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <TemplateForm onSubmit={(data) => createMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(category => (
          <TabsContent key={category.value} value={category.value} className="mt-6">
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  No templates in {category.label.toLowerCase()}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {template.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 text-xs text-slate-600">
                          <span>Used: {template.usage_count || 0} times</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => setViewingTemplate(template)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-red-600"
                            onClick={() => {
                              if (confirm('Delete this template?')) {
                                deleteMutation.mutate(template.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {viewingTemplate && (
        <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
                <p className="text-sm">{viewingTemplate.description}</p>
              </div>
              {viewingTemplate.sections && viewingTemplate.sections.length > 0 ? (
                <div className="space-y-3">
                  {viewingTemplate.sections.map((section, i) => (
                    <div key={i} className="border rounded p-3">
                      <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
                      <p className="text-sm whitespace-pre-wrap text-slate-600">{section.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded p-4 bg-slate-50">
                  <p className="text-sm whitespace-pre-wrap text-slate-600">{viewingTemplate.content}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const response = await base44.functions.invoke('generateTemplateFile', {
                        templateId: viewingTemplate.id,
                        format: 'word'
                      });
                      const blob = new Blob([response.data], { type: 'application/msword' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${viewingTemplate.name}.doc`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('Template downloaded');
                    } catch (err) {
                      toast.error('Download failed');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Word
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const response = await base44.functions.invoke('generateTemplateFile', {
                        templateId: viewingTemplate.id,
                        format: 'excel'
                      });
                      const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${viewingTemplate.name}.xls`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('Template downloaded');
                    } catch (err) {
                      toast.error('Download failed');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <TemplateForm 
              template={editingTemplate} 
              onSubmit={(data) => updateMutation.mutate({ id: editingTemplate.id, data })} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TemplateForm({ template, onSubmit }) {
  const [formData, setFormData] = useState(template || { 
    category: 'contracts',
    name: '',
    description: '',
    content: '',
    tags: []
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Template name"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full border rounded p-2"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What is this template for?"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Template content..."
          className="w-full border rounded p-2 h-48 font-mono text-xs"
        />
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full">
        {template ? 'Update Template' : 'Create Template'}
      </Button>
    </div>
  );
}