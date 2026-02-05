import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Lock, Unlock, FileText, Image as ImageIcon, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PHASES = [
  { value: 'preconstruction', label: 'Preconstruction' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'superstructure', label: 'Superstructure' },
  { value: 'enclosure', label: 'Enclosure' },
  { value: 'mep_rough', label: 'MEP Rough-In' },
  { value: 'interior_finishes', label: 'Interior Finishes' },
  { value: 'commissioning', label: 'Commissioning' },
  { value: 'closeout', label: 'Closeout' }
];

export default function PhaseManager({ projectId, currentPhase }) {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase || 'preconstruction');
  const queryClient = useQueryClient();

  const { data: requirements = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId, selectedPhase],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId, phase_name: selectedPhase }),
    enabled: !!projectId
  });

  const { data: files = [] } = useQuery({
    queryKey: ['phaseFiles', projectId, selectedPhase],
    queryFn: () => base44.entities.PhaseFile.filter({ project_id: projectId, phase_name: selectedPhase }),
    enabled: !!projectId
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['phaseNotes', projectId, selectedPhase],
    queryFn: () => base44.entities.PhaseNote.filter({ project_id: projectId, phase_name: selectedPhase }),
    enabled: !!projectId
  });

  const { data: budget } = useQuery({
    queryKey: ['phaseBudget', projectId, selectedPhase],
    queryFn: async () => {
      const budgets = await base44.entities.PhaseBudget.filter({ project_id: projectId, phase_name: selectedPhase });
      return budgets[0];
    },
    enabled: !!projectId
  });

  const toggleRequirement = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.PhaseRequirement.update(id, {
      status: completed ? 'completed' : 'pending',
      completed_date: completed ? new Date().toISOString().split('T')[0] : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
    }
  });

  const toggleBudgetLock = useMutation({
    mutationFn: (isLocked) => {
      if (budget) {
        return base44.entities.PhaseBudget.update(budget.id, {
          is_locked: isLocked,
          locked_date: isLocked ? new Date().toISOString().split('T')[0] : null
        });
      } else {
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseBudget'] });
      toast.success(budget?.is_locked ? 'Budget unlocked' : 'Budget locked');
    }
  });

  const completedReqs = requirements.filter(r => r.status === 'completed').length;
  const progressPercent = requirements.length > 0 ? (completedReqs / requirements.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Phase Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PHASES.map(phase => (
          <Button
            key={phase.value}
            variant={selectedPhase === phase.value ? 'default' : 'outline'}
            onClick={() => setSelectedPhase(phase.value)}
            className="whitespace-nowrap"
          >
            {phase.label}
            {phase.value === currentPhase && (
              <Badge variant="secondary" className="ml-2">Current</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Phase Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{PHASES.find(p => p.value === selectedPhase)?.label} Phase</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{completedReqs}/{requirements.length} complete</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="requirements" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="mt-6">
          <RequirementsTab projectId={projectId} phaseName={selectedPhase} requirements={requirements} onToggle={toggleRequirement} />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <FilesTab projectId={projectId} phaseName={selectedPhase} files={files} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab projectId={projectId} phaseName={selectedPhase} notes={notes} />
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <BudgetTab 
            projectId={projectId} 
            phaseName={selectedPhase} 
            budget={budget} 
            onToggleLock={toggleBudgetLock}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequirementsTab({ projectId, phaseName, requirements, onToggle }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseRequirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
      setShowForm(false);
      toast.success('Requirement added');
    }
  });

  const [formData, setFormData] = useState({ requirement_name: '', description: '', is_mandatory: true });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Requirement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Requirement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={formData.requirement_name}
                onChange={(e) => setFormData({ ...formData, requirement_name: e.target.value })}
                placeholder="Requirement name"
              />
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_mandatory}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                />
                <Label>Mandatory</Label>
              </div>
              <Button onClick={() => createMutation.mutate({ project_id: projectId, phase_name: phaseName, ...formData })} className="w-full">
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {requirements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No requirements yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requirements.map(req => (
            <Card key={req.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={req.status === 'completed'}
                    onCheckedChange={(checked) => onToggle.mutate({ id: req.id, completed: checked })}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={req.status === 'completed' ? 'line-through text-slate-500' : ''}>{req.requirement_name}</span>
                      {req.is_mandatory && <Badge variant="outline" className="text-xs">Mandatory</Badge>}
                    </div>
                    {req.description && <p className="text-sm text-slate-500 mt-1">{req.description}</p>}
                    {req.completed_date && (
                      <p className="text-xs text-slate-400 mt-1">Completed {format(new Date(req.completed_date), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilesTab({ projectId, phaseName, files }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.PhaseFile.create({
        project_id: projectId,
        phase_name: phaseName,
        file_name: file.name,
        file_url: file_url,
        file_type: file.type.includes('image') ? 'photo' : 'document'
      });

      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label>
          <Button size="sm" disabled={uploading} asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </span>
          </Button>
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No files uploaded
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map(file => (
            <Card key={file.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {file.file_type === 'photo' ? <ImageIcon className="h-5 w-5 text-slate-400" /> : <FileText className="h-5 w-5 text-slate-400" />}
                  <div className="flex-1 min-w-0">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-blue-600 truncate block">
                      {file.file_name}
                    </a>
                    <p className="text-xs text-slate-500">Uploaded {format(new Date(file.created_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ projectId, phaseName, notes }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseNotes'] });
      setShowForm(false);
      setFormData({ title: '', content: '' });
      toast.success('Note added');
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title (optional)"
              />
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Note content"
                className="h-32"
              />
              <Button onClick={() => createMutation.mutate({ project_id: projectId, phase_name: phaseName, ...formData })} className="w-full">
                Add Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No notes yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <Card key={note.id}>
              <CardHeader>
                {note.title && <CardTitle className="text-base">{note.title}</CardTitle>}
                <p className="text-xs text-slate-500">
                  {format(new Date(note.created_date), 'MMM d, yyyy h:mm a')} • {note.author}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetTab({ projectId, phaseName, budget, onToggleLock }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ budgeted_amount: budget?.budgeted_amount || 0 });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (budget) {
        return base44.entities.PhaseBudget.update(budget.id, data);
      } else {
        return base44.entities.PhaseBudget.create({ project_id: projectId, phase_name: phaseName, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseBudget'] });
      setEditing(false);
      toast.success('Budget saved');
    }
  });

  const remaining = (budget?.budgeted_amount || 0) - (budget?.spent_amount || 0) - (budget?.committed_amount || 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Phase Budget</CardTitle>
            <div className="flex gap-2">
              {budget?.is_locked ? (
                <Button size="sm" variant="outline" onClick={() => onToggleLock.mutate(false)}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onToggleLock.mutate(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock
                </Button>
              )}
              {!budget?.is_locked && (
                <Button size="sm" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label>Budgeted Amount</Label>
                <Input
                  type="number"
                  value={formData.budgeted_amount}
                  onChange={(e) => setFormData({ budgeted_amount: parseFloat(e.target.value) })}
                />
              </div>
              <Button onClick={() => saveMutation.mutate(formData)}>
                Save Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Budgeted:</span>
                <span className="font-semibold">${(budget?.budgeted_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Spent:</span>
                <span className="text-red-600">${(budget?.spent_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Committed:</span>
                <span className="text-yellow-600">${(budget?.committed_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-600 font-medium">Remaining:</span>
                <span className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${remaining.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}