import React, { useState, useEffect } from 'react';
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
import { Plus, Upload, Lock, Unlock, FileText, Image as ImageIcon, CheckCircle, Circle, MoreVertical, Trash2, Edit, GripVertical, Folder } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PhaseBudgetManager from '../budget/PhaseBudgetManager';

export default function PhaseManager({ projectId, currentPhase }) {
  const queryClient = useQueryClient();

  const { data: customPhases = [] } = useQuery({
    queryKey: ['customPhases', projectId],
    queryFn: () => base44.entities.CustomPhase.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId
  });

  const allPhases = customPhases
    .filter(cp => !cp.is_hidden)
    .map(cp => ({ value: cp.phase_name, label: cp.display_name, customPhaseId: cp.id }));

  const [selectedPhase, setSelectedPhase] = useState(currentPhase || allPhases[0]?.value);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);

  const { data: phaseData } = useQuery({
    queryKey: ['customPhase', projectId, selectedPhase],
    queryFn: async () => {
      const phases = await base44.entities.CustomPhase.filter({ project_id: projectId, phase_name: selectedPhase });
      return phases[0];
    },
    enabled: !!projectId && !!selectedPhase
  });

  const createPhaseMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomPhase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      setShowCreateDialog(false);
      setEditingPhase(null);
      toast.success('Phase created');
    }
  });

  const deletePhaseMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomPhase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      toast.success('Phase deleted');
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomPhase.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhase'] });
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
    }
  });

  const togglePhaseLock = () => {
    if (phaseData) {
      updatePhaseMutation.mutate({
        id: phaseData.id,
        data: {
          is_locked: !phaseData.is_locked,
          locked_date: !phaseData.is_locked ? new Date().toISOString().split('T')[0] : null
        }
      });
      toast.success(phaseData.is_locked ? 'Phase unlocked' : 'Phase locked');
    }
  };

  const closePhase = () => {
    if (phaseData) {
      updatePhaseMutation.mutate({
        id: phaseData.id,
        data: {
          status: 'completed',
          progress_percent: 100,
          completed_date: new Date().toISOString().split('T')[0],
          is_locked: true
        }
      });
      toast.success('Phase completed and locked');
      
      // Auto-select next phase
      const currentIndex = allPhases.findIndex(p => p.value === selectedPhase);
      if (currentIndex !== -1 && currentIndex < allPhases.length - 1) {
        setSelectedPhase(allPhases[currentIndex + 1].value);
      }
    }
  };

  const [createForm, setCreateForm] = useState({ phase_name: '', display_name: '', order: customPhases.length });

  const handleEditPhase = (phase) => {
    setEditingPhase(phase);
    setCreateForm({
      phase_name: phase.phase_name,
      display_name: phase.display_name,
      order: phase.order
    });
    setShowCreateDialog(true);
  };

  const handleSavePhase = () => {
    if (editingPhase) {
      updatePhaseMutation.mutate({
        id: editingPhase.id,
        data: createForm
      });
    } else {
      createPhaseMutation.mutate({ project_id: projectId, ...createForm });
    }
  };

  const handleDeletePhase = (phase) => {
    if (confirm(`Delete phase "${phase.display_name}"? This will also delete all associated requirements, files, notes, and budget data.`)) {
      deletePhaseMutation.mutate(phase.id);
      if (selectedPhase === phase.phase_name && allPhases.length > 1) {
        setSelectedPhase(allPhases[0]?.value);
      }
    }
  };

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
  const currentPhaseLabel = allPhases.find(p => p.value === selectedPhase)?.label;
  const isLocked = phaseData?.is_locked || false;

  return (
    <div className="space-y-6">
      {/* Phase Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {allPhases.map(phase => {
          const customPhase = customPhases.find(p => p.phase_name === phase.value);
          return (
            <div key={phase.value} className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant={selectedPhase === phase.value ? 'default' : 'outline'}
                onClick={() => setSelectedPhase(phase.value)}
                className="whitespace-nowrap flex-shrink-0"
              >
                <span className="text-sm">{phase.label}</span>
                {phase.value === currentPhase && (
                  <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">Current</Badge>
                )}
              </Button>
              {phase.customPhaseId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEditPhase(customPhases.find(cp => cp.id === phase.customPhaseId))}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePhase(customPhases.find(cp => cp.id === phase.customPhaseId))}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingPhase(null);
            setCreateForm({ phase_name: '', display_name: '', order: customPhases.length });
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Phase</span>
              <span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPhase ? 'Edit Phase' : 'Create Custom Phase'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Phase ID (lowercase, no spaces)</Label>
                <Input
                  value={createForm.phase_name}
                  onChange={(e) => setCreateForm({ ...createForm, phase_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., electrical_rough_in"
                  disabled={!!editingPhase}
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={createForm.display_name}
                  onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                  placeholder="e.g., Electrical Rough-In"
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={createForm.order}
                  onChange={(e) => setCreateForm({ ...createForm, order: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleSavePhase} className="w-full">
                {editingPhase ? 'Update Phase' : 'Create Phase'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Phase Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>{currentPhaseLabel} Phase</CardTitle>
              {phaseData?.status && (
                <Badge variant={phaseData.status === 'completed' ? 'default' : 'secondary'}>
                  {phaseData.status.replace('_', ' ')}
                </Badge>
              )}
              {isLocked && <Lock className="h-4 w-4 text-slate-400" />}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{completedReqs}/{requirements.length} complete</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${progressPercent}%` }} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {phaseData && !isLocked && phaseData.status !== 'completed' && (
                    <DropdownMenuItem onClick={closePhase}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Close Phase
                    </DropdownMenuItem>
                  )}
                  {phaseData && (
                    <DropdownMenuItem onClick={togglePhaseLock}>
                      {isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      {isLocked ? 'Unlock Phase' : 'Lock Phase'}
                    </DropdownMenuItem>
                  )}

                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLocked ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">This phase is locked. Unlock it to make changes.</p>
          </CardContent>
        </Card>
      ) : (
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
            <PhaseBudgetManager projectId={projectId} phaseName={selectedPhase} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function RequirementsTab({ projectId, phaseName, requirements, onToggle }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedParentReq, setSelectedParentReq] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const req = await base44.entities.PhaseRequirement.create(data);
      // Create a folder only for main requirements (not sub-requirements)
      if (!data.parent_requirement_id) {
        await base44.entities.PhaseFile.create({
          project_id: data.project_id,
          phase_name: data.phase_name,
          file_name: `[Folder] ${data.requirement_text}`,
          file_url: `folder://${req.id}`,
          file_type: 'other',
          description: `Folder for requirement: ${data.requirement_text}`
        });
      }
      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      setShowForm(false);
      setSelectedParentReq(null);
      toast.success('Requirement added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PhaseRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
      toast.success('Requirement deleted');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, order, parent_requirement_id }) => {
      const updateData = { order };
      if (parent_requirement_id !== undefined) {
        updateData.parent_requirement_id = parent_requirement_id;
      }
      return base44.entities.PhaseRequirement.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
    }
  });

  const updateRequirementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PhaseRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Check if dragging from main list to sub list (converting to sub-requirement)
    if (source.droppableId === 'requirements' && destination.droppableId.startsWith('sub-')) {
      const newParentId = destination.droppableId.replace('sub-', '');
      const draggedReq = requirements.find(r => r.id === draggableId);
      
      // Don't allow making a requirement its own child or creating circular dependencies
      if (draggedReq?.id === newParentId) return;
      
      // Update the parent_requirement_id
      updateRequirementMutation.mutate({ 
        id: draggableId, 
        data: {
          parent_requirement_id: newParentId,
          order: destination.index
        }
      });
      return;
    }

    // Check if dragging from sub list to main list (converting to main requirement)
    if (source.droppableId.startsWith('sub-') && destination.droppableId === 'requirements') {
      updateRequirementMutation.mutate({ 
        id: draggableId, 
        data: {
          parent_requirement_id: null,
          order: destination.index
        }
      });
      return;
    }

    // Same droppable reordering
    if (source.droppableId !== destination.droppableId) return;
    if (source.index === destination.index) return;

    const isSubList = source.droppableId.startsWith('sub-');
    const parentId = isSubList ? source.droppableId.replace('sub-', '') : null;
    
    const items = parentId 
      ? requirements.filter(r => r.parent_requirement_id === parentId).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      : requirements.filter(r => !r.parent_requirement_id).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    const reordered = Array.from(items);
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);

    // Update orders
    reordered.forEach((item, index) => {
      if (item.order !== index) {
        updateOrderMutation.mutate({ id: item.id, order: index });
      }
    });
  };

  const [formData, setFormData] = useState({ requirement_text: '', is_mandatory: true });

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
              {selectedParentReq && (
                <div className="text-sm text-slate-600 mb-2">
                  Adding sub-requirement to: <span className="font-medium">{selectedParentReq.requirement_text}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2"
                    onClick={() => setSelectedParentReq(null)}
                  >
                    ← Back
                  </Button>
                </div>
              )}
              <Input
                value={formData.requirement_text}
                onChange={(e) => setFormData({ ...formData, requirement_text: e.target.value })}
                placeholder={selectedParentReq ? "Sub-requirement text" : "Requirement text"}
              />
              <Button 
                onClick={() => createMutation.mutate({ 
                  project_id: projectId, 
                  phase_name: phaseName, 
                  parent_requirement_id: selectedParentReq?.id || null,
                  ...formData 
                })} 
                className="w-full"
              >
                Add {selectedParentReq ? 'Sub-Requirement' : 'Requirement'}
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="requirements" type="main">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {requirements
                  .filter(r => !r.parent_requirement_id)
                  .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                  .map((req, index) => {
                    const subReqs = requirements
                      .filter(sr => sr.parent_requirement_id === req.id)
                      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
                    return (
                      <Draggable key={req.id} draggableId={req.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="space-y-2"
                          >
                            <Card>
                              <CardContent className="py-4">
                                <div className="flex items-start gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                  </div>
                                  <Checkbox
                                    checked={req.status === 'completed'}
                                    onCheckedChange={(checked) => onToggle.mutate({ id: req.id, completed: checked })}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={req.status === 'completed' ? 'line-through text-slate-500' : ''}>{req.requirement_text}</span>
                                      {req.is_mandatory && <Badge variant="outline" className="text-xs">Mandatory</Badge>}
                                    </div>
                                    {req.completed_date && (
                                      <p className="text-xs text-slate-400 mt-1">Completed {format(new Date(req.completed_date), 'MMM d, yyyy')}</p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setSelectedParentReq(req);
                                      setShowForm(true);
                                    }}
                                  >
                                    + Sub
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Delete this requirement and all its sub-requirements?')) {
                                        deleteMutation.mutate(req.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                            <Droppable droppableId={`sub-${req.id}`} type="main">
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={cn(
                                    "ml-8 space-y-2 min-h-[8px] rounded-lg transition-colors",
                                    snapshot.isDraggingOver && "bg-blue-50"
                                  )}
                                >
                                  {subReqs.map((subReq, subIndex) => (
                                      <Draggable key={subReq.id} draggableId={subReq.id} index={subIndex}>
                                        {(provided) => (
                                          <Card
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="bg-slate-50"
                                          >
                                            <CardContent className="py-3">
                                              <div className="flex items-start gap-3">
                                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                  <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                                </div>
                                                <Checkbox
                                                  checked={subReq.status === 'completed'}
                                                  onCheckedChange={(checked) => onToggle.mutate({ id: subReq.id, completed: checked })}
                                                  className="mt-0.5"
                                                />
                                                <div className="flex-1">
                                                  <span className={cn("text-sm", subReq.status === 'completed' && 'line-through text-slate-500')}>
                                                    {subReq.requirement_text}
                                                  </span>
                                                  {subReq.completed_date && (
                                                    <p className="text-xs text-slate-400 mt-1">Completed {format(new Date(subReq.completed_date), 'MMM d, yyyy')}</p>
                                                  )}
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                                                  onClick={() => {
                                                    if (confirm('Delete this sub-requirement?')) {
                                                      deleteMutation.mutate(subReq.id);
                                                    }
                                                  }}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        )}
                                      </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

function FilesTab({ projectId, phaseName, files }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const queryClient = useQueryClient();

  // Query requirements to create missing folders
  const { data: requirements = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId, phaseName],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId, phase_name: phaseName }),
    enabled: !!projectId && !!phaseName
  });

  // Sync folders: only keep folders for main requirements, delete all others
  useEffect(() => {
    const syncFolders = async () => {
      const mainRequirements = requirements.filter(r => !r.parent_requirement_id);
      const mainReqIds = mainRequirements.map(r => r.id);
      const existingFolders = files.filter(f => f.file_url?.startsWith('folder://'));
      
      let needsRefresh = false;
      
      // Delete folders that are NOT for main requirements
      for (const folder of existingFolders) {
        const reqId = folder.file_url.replace('folder://', '').replace('custom_', '');
        // Delete if it's not a main requirement and not a custom folder
        if (!mainReqIds.includes(reqId) && !folder.file_url.includes('custom_')) {
          await base44.entities.PhaseFile.delete(folder.id);
          needsRefresh = true;
        }
      }
      
      // Create folders for main requirements that don't have them
      const existingFolderUrls = existingFolders.map(f => f.file_url);
      for (const req of mainRequirements) {
        const folderUrl = `folder://${req.id}`;
        if (!existingFolderUrls.includes(folderUrl)) {
          await base44.entities.PhaseFile.create({
            project_id: projectId,
            phase_name: phaseName,
            file_name: `[Folder] ${req.requirement_text}`,
            file_url: folderUrl,
            file_type: 'other',
            description: `Folder for requirement: ${req.requirement_text}`,
            order: req.order || 0
          });
          needsRefresh = true;
        }
      }
      
      if (needsRefresh) {
        queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      }
    };

    if (requirements.length > 0 && files) {
      syncFolders();
    }
  }, [requirements, files, projectId, phaseName]);

  const createFolderMutation = useMutation({
    mutationFn: async (name) => {
      const maxOrder = Math.max(...folders.map(f => f.order || 0), 0);
      return base44.entities.PhaseFile.create({
        project_id: projectId,
        phase_name: phaseName,
        file_name: `[Folder] ${name}`,
        file_url: `folder://custom_${Date.now()}`,
        file_type: 'other',
        description: 'Custom folder',
        order: maxOrder + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      setShowCreateFolder(false);
      setFolderName('');
      toast.success('Folder created');
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      // Delete all files in the folder first
      const folderFiles = files.filter(f => f.parent_folder_id === folderId);
      for (const file of folderFiles) {
        await base44.entities.PhaseFile.delete(file.id);
      }
      // Delete the folder
      await base44.entities.PhaseFile.delete(folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      setSelectedFolder(null);
      toast.success('Folder deleted');
    }
  });

  const updateFolderOrderMutation = useMutation({
    mutationFn: ({ id, order }) => base44.entities.PhaseFile.update(id, { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
    }
  });

  const handleFolderDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = Array.from(folders);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    reordered.forEach((folder, index) => {
      if (folder.order !== index) {
        updateFolderOrderMutation.mutate({ id: folder.id, order: index });
      }
    });
  };

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
        file_type: file.type.includes('image') ? 'photo' : 'document',
        parent_folder_id: selectedFolder?.id || null
      });

      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Get folders and sort them by order
  const folders = files
    .filter(f => f.file_url?.startsWith('folder://'))
    .map(folder => {
      const reqId = folder.file_url.replace('folder://', '').replace('custom_', '');
      const req = requirements.find(r => r.id === reqId);
      return { ...folder, requirement: req };
    })
    .sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

  const currentFiles = selectedFolder 
    ? files.filter(f => f.parent_folder_id === selectedFolder.id && !f.file_url?.startsWith('folder://')).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {selectedFolder && (
          <Button size="sm" variant="outline" onClick={() => setSelectedFolder(null)}>
            ← Back to Folders
          </Button>
        )}
        <div className={cn("flex gap-2", !selectedFolder && "ml-auto")}>
          {selectedFolder && (
            <>
              <Badge variant="secondary" className="text-sm">
                {selectedFolder.file_name.replace('[Folder] ', '')}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Delete this folder and all its files?')) {
                    deleteFolderMutation.mutate(selectedFolder.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {!selectedFolder && (
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                  />
                  <Button onClick={() => createFolderMutation.mutate(folderName)} className="w-full">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <label>
            <Button size="sm" disabled={uploading || !selectedFolder} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload File'}
              </span>
            </Button>
            <input type="file" className="hidden" onChange={handleUpload} disabled={!selectedFolder} />
          </label>
        </div>
      </div>

      {!selectedFolder && (
        <DragDropContext onDragEnd={handleFolderDragEnd}>
          <Droppable droppableId="folders">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {folders.length === 0 ? (
                  <Card className="md:col-span-2">
                    <CardContent className="py-12 text-center text-slate-500">
                      No folders yet. Create one to get started.
                    </CardContent>
                  </Card>
                ) : (
                  folders.map((folder, index) => (
                    <Draggable key={folder.id} draggableId={folder.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-5 w-5 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => setSelectedFolder(folder)}>
                                <div className="flex items-center gap-2">
                                  <Folder className="h-5 w-5 text-amber-500" />
                                  <p className="text-sm font-medium truncate">
                                    {folder.file_name.replace('[Folder] ', '')}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 ml-7">
                                  {files.filter(f => f.parent_folder_id === folder.id).length} files
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this folder and all its files?')) {
                                    deleteFolderMutation.mutate(folder.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {currentFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            {selectedFolder ? 'No files in this folder' : 'No files uploaded'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFiles.map(file => (
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