import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Unlock, ChevronRight, AlertTriangle, MoreVertical, Trash2, Plus, Target, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { useQuery } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';



export default function PhaseNavigator({ 
  currentPhase, 
  phaseGates = [], 
  customPhases = [],
  onInitiateGate,
  onViewGate,
  projectId,
  onPhaseChange
}) {
  const queryClient = useQueryClient();
  
  const [showRequirementsDialog, setShowRequirementsDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [requirements, setRequirements] = useState('');
  const [selectedParentReq, setSelectedParentReq] = useState(null);
  
  const { data: allRequirements = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId }),
    enabled: !!projectId,
  });
  
  const PHASES = customPhases
    .filter(cp => !cp.is_hidden)
    .map(cp => ({
      id: cp.phase_name,
      label: cp.display_name,
      icon: cp.icon || '📌',
      customPhaseId: cp.id
    }));
  
  const currentPhaseIndex = PHASES.findIndex(p => p.id === currentPhase);

  const deleteCustomPhaseMutation = useMutation({
    mutationFn: (customPhaseId) => base44.entities.CustomPhase.delete(customPhaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      toast.success('Phase deleted');
    }
  });



  const [showNewPhaseDialog, setShowNewPhaseDialog] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseIcon, setNewPhaseIcon] = useState('📌');

  const createPhaseMutation = useMutation({
    mutationFn: (phaseData) => base44.entities.CustomPhase.create(phaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      setShowNewPhaseDialog(false);
      setNewPhaseName('');
      setNewPhaseIcon('📌');
      toast.success('Phase created');
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ phaseId, data }) => base44.entities.CustomPhase.update(phaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      toast.success('Phase updated');
    }
  });

  const addRequirementsMutation = useMutation({
    mutationFn: async (dataArray) => {
      // Create all requirements in parallel
      const promises = dataArray.map(data => base44.entities.PhaseRequirement.create(data));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements', projectId] });
      setRequirements('');
      setSelectedParentReq(null);
      toast.success('Requirements added');
    }
  });

  const updateRequirementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PhaseRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements', projectId] });
    }
  });

  const getPhaseProgress = (phaseId) => {
    const phaseReqs = allRequirements.filter(r => r.phase_name === phaseId);
    if (phaseReqs.length === 0) return 0;
    const completed = phaseReqs.filter(r => r.status === 'completed').length;
    return Math.round((completed / phaseReqs.length) * 100);
  };

  const getPhaseData = (phaseId) => {
    return customPhases.find(cp => cp.phase_name === phaseId);
  };

  const handleLockToggle = (phase) => {
    const phaseData = getPhaseData(phase.id);
    if (phaseData) {
      updatePhaseMutation.mutate({
        phaseId: phaseData.id,
        data: { is_locked: !phaseData.is_locked }
      });
    }
  };

  const handleSetCurrent = (phase) => {
    onPhaseChange?.(phase.id);
  };



  const getPhaseStatus = (phaseId) => {
    const phaseIndex = PHASES.findIndex(p => p.id === phaseId);
    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'current';
    
    // Check if there's a pending gate to this phase
    const pendingGate = phaseGates.find(g => g.to_phase === phaseId && g.status !== 'approved');
    if (pendingGate) return 'pending_gate';
    
    return 'locked';
  };

  const getGateForPhase = (fromPhase, toPhase) => {
    return phaseGates.find(g => g.from_phase === fromPhase && g.to_phase === toPhase);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Project Phases</h3>
          <p className="text-sm text-slate-500 hidden sm:block">Visual phase navigator with gate controls</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setShowNewPhaseDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Phase</span>
            <span className="sm:hidden">New</span>
          </Button>
          <Badge className="bg-blue-100 text-blue-700 whitespace-nowrap">
            Current: {PHASES.find(p => p.id === currentPhase)?.label}
          </Badge>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="relative overflow-x-auto pb-4">
        <div className="min-w-max">
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentPhaseIndex / (PHASES.length - 1)) * 100}%` }}
            />
          </div>

          {/* Phase Nodes */}
          <div className="relative flex" style={{ gap: '1rem' }}>
            {PHASES.map((phase, index) => {
              const status = getPhaseStatus(phase.id);
              const gate = index > 0 ? getGateForPhase(PHASES[index - 1].id, phase.id) : null;

              return (
                <div key={phase.id} className="flex flex-col items-center flex-shrink-0" style={{ width: '120px' }}>
                  {/* Node */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-lg z-10 transition-all duration-300 flex-shrink-0",
                      status === 'completed' && "bg-green-500 text-white shadow-lg shadow-green-200",
                      status === 'current' && "bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100",
                      status === 'pending_gate' && "bg-amber-100 text-amber-600 border-2 border-amber-300",
                      status === 'locked' && "bg-slate-100 text-slate-400"
                    )}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : status === 'locked' ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      phase.icon
                    )}
                  </div>

                  {/* Label and Progress */}
                  <div className="flex flex-col items-center gap-1 mt-2 w-full">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <p className={cn(
                        "text-xs text-center font-medium break-words",
                        status === 'current' ? "text-blue-600" : 
                        status === 'completed' ? "text-green-600" : "text-slate-500"
                      )}>
                        {phase.label}
                      </p>
                      {getPhaseData(phase.id)?.is_locked && (
                        <Lock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 flex-shrink-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem onClick={() => handleSetCurrent(phase)}>
                          <Target className="h-4 w-4 mr-2" />
                          Set as Current
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPhase(phase);
                            setShowRequirementsDialog(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Add Requirements
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleLockToggle(phase)}>
                          {getPhaseData(phase.id)?.is_locked ? (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Unlock Phase
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Lock Phase
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm(`Delete "${phase.label}"? This cannot be undone.`)) {
                              deleteCustomPhaseMutation.mutate(phase.customPhaseId);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Phase
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {allRequirements.filter(r => r.phase_name === phase.id).length > 0 && (
                      <div className="w-full px-2">
                        <Progress value={getPhaseProgress(phase.id)} className="h-1" />
                        <p className="text-[10px] text-slate-400 text-center mt-0.5">
                          {getPhaseProgress(phase.id)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Gate Action */}
                  {index === currentPhaseIndex && index < PHASES.length - 1 && (
                    <Button
                      size="sm"
                      className="mt-2 text-xs h-7 whitespace-nowrap"
                      variant={gate?.status === 'in_review' ? 'outline' : 'default'}
                      onClick={() => gate ? onViewGate?.(gate) : onInitiateGate?.(phase.id, PHASES[index + 1].id)}
                    >
                      {gate?.status === 'in_review' ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Review
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3 w-3 mr-1" />
                          Gate
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Phase Details */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Current Phase</p>
            <p className="text-lg font-semibold text-slate-900">
              {PHASES.find(p => p.id === currentPhase)?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Phase Progress</p>
            <p className="text-lg font-semibold text-blue-600">
              {currentPhaseIndex + 1} of {PHASES.length}
            </p>
          </div>
        </div>
        <Progress 
          value={((currentPhaseIndex + 1) / PHASES.length) * 100} 
          className="h-2 mt-3" 
        />
      </div>

      {/* New Phase Dialog */}
      <Dialog open={showNewPhaseDialog} onOpenChange={setShowNewPhaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Phase Name</Label>
              <Input
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                placeholder="e.g., Site Preparation"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <EmojiPicker value={newPhaseIcon} onChange={setNewPhaseIcon} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPhaseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newPhaseName.trim()) return;
                createPhaseMutation.mutate({
                  project_id: projectId,
                  phase_name: newPhaseName.toLowerCase().replace(/\s+/g, '_'),
                  display_name: newPhaseName,
                  icon: newPhaseIcon,
                  order: customPhases.length
                });
              }}
              disabled={!newPhaseName.trim()}
            >
              Create Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirements Dialog */}
      <Dialog open={showRequirementsDialog} onOpenChange={setShowRequirementsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Requirements to {selectedPhase?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allRequirements.filter(r => r.phase_name === selectedPhase?.id).length > 0 && (
              <div className="space-y-2">
                <Label>Existing Requirements</Label>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {allRequirements
                    .filter(r => r.phase_name === selectedPhase?.id && !r.parent_requirement_id)
                    .map(req => {
                      const subReqs = allRequirements.filter(sr => sr.parent_requirement_id === req.id);
                      return (
                        <div key={req.id} className="space-y-1">
                          <div className="flex items-center gap-2 text-sm group">
                            <input
                              type="checkbox"
                              checked={req.status === 'completed'}
                              onChange={(e) => {
                                updateRequirementMutation.mutate({
                                  id: req.id,
                                  data: { status: e.target.checked ? 'completed' : 'pending' }
                                });
                              }}
                              className="h-4 w-4"
                            />
                            <span className={cn(req.status === 'completed' && 'line-through text-slate-400', 'flex-1')}>
                              {req.requirement_text}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                setSelectedParentReq(req);
                                setRequirements('');
                              }}
                            >
                              + Sub
                            </Button>
                          </div>
                          {subReqs.map(subReq => (
                            <div key={subReq.id} className="flex items-center gap-2 text-sm ml-6">
                              <input
                                type="checkbox"
                                checked={subReq.status === 'completed'}
                                onChange={(e) => {
                                  updateRequirementMutation.mutate({
                                    id: subReq.id,
                                    data: { status: e.target.checked ? 'completed' : 'pending' }
                                  });
                                }}
                                className="h-3.5 w-3.5"
                              />
                              <span className={cn(subReq.status === 'completed' && 'line-through text-slate-400', 'text-xs text-slate-600')}>
                                {subReq.requirement_text}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div>
              <Label>
                {selectedParentReq 
                  ? `Add Sub-Requirements to "${selectedParentReq.requirement_text}"`
                  : 'New Requirements (one per line)'
                }
              </Label>
              {selectedParentReq && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs mb-2"
                  onClick={() => setSelectedParentReq(null)}
                >
                  ← Back to main requirements
                </Button>
              )}
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder={selectedParentReq ? "Enter sub-requirements, one per line..." : "Enter requirements, one per line..."}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequirementsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!requirements.trim()) return;
                const reqLines = requirements.split('\n').filter(r => r.trim());
                const reqData = reqLines.map(req => ({
                  project_id: projectId,
                  phase_name: selectedPhase.id,
                  requirement_text: req.trim(),
                  parent_requirement_id: selectedParentReq?.id || null,
                  status: 'pending'
                }));
                addRequirementsMutation.mutate(reqData);
              }}
              disabled={!requirements.trim() || addRequirementsMutation.isPending}
            >
              {addRequirementsMutation.isPending ? 'Adding...' : (selectedParentReq ? 'Add Sub-Requirements' : 'Add Requirements')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}