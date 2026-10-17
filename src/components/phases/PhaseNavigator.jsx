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



// phases-v2 (2026-10-17): VISUAL-ONLY restyle to phases-cost-progress_v5. All queries/mutations/handlers above `return` are byte-identical to the base.
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
  
  // current_phase may be a legacy value (e.g. 'preconstruction') that isn't one of
  // the carried custom phases. Clamp to the first carried phase so the navigator
  // shows the carried records instead of an empty/undefined current phase.
  const currentPhaseIndex = Math.max(0, PHASES.findIndex(p => p.id === currentPhase));

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
  // CustomPhase entity fields status (not_started|in_progress|completed|locked), start_date, end_date already exist.
  const [newPhaseStatus, setNewPhaseStatus] = useState('not_started');
  const [newPhaseStart, setNewPhaseStart] = useState('');
  const [newPhaseEnd, setNewPhaseEnd] = useState('');

  const createPhaseMutation = useMutation({
    mutationFn: (phaseData) => base44.entities.CustomPhase.create(phaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      setShowNewPhaseDialog(false);
      setNewPhaseName('');
      setNewPhaseIcon('📌');
      setNewPhaseStatus('not_started'); setNewPhaseStart(''); setNewPhaseEnd('');
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


  // ===== v5 visual layer (phases-cost-progress_v5). Display + one rename dialog; every query/mutation above is unchanged. =====
  const [renamePhase, setRenamePhase] = useState(null); // { customPhaseId, name, icon }
  const currentGate = currentPhaseIndex < PHASES.length - 1 ? getGateForPhase(PHASES[currentPhaseIndex]?.id, PHASES[currentPhaseIndex + 1]?.id) : null;

  return (
    <div className="gs5p">
      <style>{GS5_CSS}</style>
      <h1 className="g-title">Phases — Cost &amp; Progress</h1>
      <div className="g-card">
        <div className="g-st">
          <span>Project Phases</span>
          <button className="g-btn" onClick={() => setShowNewPhaseDialog(true)}>+ New Phase</button>
        </div>

        <div className="g-pn">
          {PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            const st = status === 'completed' ? 'done' : status === 'current' ? 'cur' : status === 'pending_gate' ? 'gate' : 'future';
            const locked = getPhaseData(phase.id)?.is_locked;
            const earlier = index < currentPhaseIndex;
            return (
              <div key={phase.id} className={`n ${st}`}>
                <div className="c">{st === 'done' ? '✓' : st === 'cur' ? phase.icon : '🔒'}</div>
                {phase.label}{locked ? ' 🔐' : ''}
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="g-dots sm" aria-label={`Phase menu: ${phase.label}`}>⋯</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="gs5-menu">
                      <div className="mh">⋯ menu: {index + 1}. {phase.label}{status === 'current' ? ' (current)' : ''}</div>
                      <DropdownMenuItem onClick={() => handleSetCurrent(phase)}>📌 Set as Current</DropdownMenuItem>
                      <DropdownMenuItem disabled={!earlier} title={earlier ? undefined : 'Only applies to earlier phases'}
                        onClick={() => { if (earlier && confirm(`Revert the project to "${phase.label}"?`)) handleSetCurrent(phase); }}>
                        <span>↶ Revert to this phase<small>available on earlier phases</small></span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedPhase(phase); setShowRequirementsDialog(true); }}>＋ Add Tasks</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLockToggle(phase)}>{locked ? '🔓 Unlock Phase' : '🔒 Lock Phase'}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRenamePhase({ customPhaseId: phase.customPhaseId, name: phase.label || '', icon: phase.icon || '📌' })}>✎ Rename / Edit Phase</DropdownMenuItem>
                      <div className="hr" />
                      <DropdownMenuItem className="red" onClick={() => {
                        if (confirm(`Delete "${phase.label}"? This cannot be undone.`)) {
                          deleteCustomPhaseMutation.mutate(phase.customPhaseId);
                        }
                      }}>
                        <span>🗑 Delete Phase<small>Asks to confirm</small></span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        {PHASES.length > 0 && (
          <div className="g-cpbar">
            <span>Current Phase: <b>{PHASES[currentPhaseIndex]?.label}</b>, {currentPhaseIndex + 1} of {PHASES.length}</span>
            {currentPhaseIndex < PHASES.length - 1 && (
              <button className="g-btn goldb"
                onClick={() => currentGate ? onViewGate?.(currentGate) : onInitiateGate?.(PHASES[currentPhaseIndex].id, PHASES[currentPhaseIndex + 1].id)}>
                {currentGate?.status === 'in_review' ? 'Review' : 'Gate'}
              </button>
            )}
          </div>
        )}
        <div className="g-muted" style={{ marginTop: 6 }}>Legend: 📌 current (navy + ring) · ✓ completed · 🔒 future.</div>
      </div>

      {/* Rename / Edit Phase: same updatePhaseMutation (CustomPhase.update) as Lock/Unlock */}
      <Dialog open={!!renamePhase} onOpenChange={(o) => { if (!o) setRenamePhase(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename / Edit Phase</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Phase Name</Label><Input value={renamePhase?.name || ''} onChange={(e) => setRenamePhase({ ...renamePhase, name: e.target.value })} /></div>
            <div><Label>Icon</Label><EmojiPicker value={renamePhase?.icon || '📌'} onChange={(v) => setRenamePhase({ ...renamePhase, icon: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamePhase(null)}>Cancel</Button>
            <Button disabled={!renamePhase?.name?.trim()} onClick={() => {
              updatePhaseMutation.mutate({ phaseId: renamePhase.customPhaseId, data: { display_name: renamePhase.name.trim(), icon: renamePhase.icon } });
              setRenamePhase(null);
            }}>Update Phase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div>
              <Label>Status</Label>
              <select value={newPhaseStatus} onChange={(e) => setNewPhaseStatus(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background">
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input type="date" value={newPhaseStart} onChange={(e) => setNewPhaseStart(e.target.value)} />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" value={newPhaseEnd} min={newPhaseStart || undefined} onChange={(e) => setNewPhaseEnd(e.target.value)} />
              </div>
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
                  order: customPhases.length,
                  status: newPhaseStatus,
                  ...(newPhaseStart ? { start_date: newPhaseStart } : {}),
                  ...(newPhaseEnd ? { end_date: newPhaseEnd } : {}),
                  ...(newPhaseStatus === 'completed' ? { completed_date: newPhaseEnd || new Date().toISOString().slice(0, 10) } : {})
                });
              }}
              disabled={!newPhaseName.trim() || (newPhaseStart && newPhaseEnd && newPhaseEnd < newPhaseStart)}
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
                          <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm group py-2 sm:py-3 hover:bg-slate-50 px-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={req.status === 'completed'}
                              onChange={(e) => {
                                updateRequirementMutation.mutate({
                                  id: req.id,
                                  data: { status: e.target.checked ? 'completed' : 'pending' }
                                });
                              }}
                              className="flex-shrink-0 cursor-pointer mt-0.5 accent-navy-700 rounded"
                              style={{ width: '14px', height: '14px', minWidth: '14px', minHeight: '14px' }}
                            />
                            <span className={cn(req.status === 'completed' && 'line-through text-slate-500', 'flex-1 break-words leading-snug text-slate-700')}>
                              {req.requirement_text}
                            </span>
                            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-1.5 sm:h-6 sm:px-2 text-xs opacity-100 hover:bg-navy-50 text-navy-700 whitespace-nowrap"
                                onClick={() => {
                                  setSelectedParentReq(req);
                                  setRequirements('');
                                }}
                              >
                                + Sub
                              </Button>
                            </div>
                          </div>
                          {subReqs.map(subReq => (
                            <div key={subReq.id} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm ml-4 sm:ml-6 py-1 sm:py-2">
                                <input
                                type="checkbox"
                                checked={subReq.status === 'completed'}
                                onChange={(e) => {
                                  updateRequirementMutation.mutate({
                                    id: subReq.id,
                                    data: { status: e.target.checked ? 'completed' : 'pending' }
                                  });
                                }}
                                className="flex-shrink-0 cursor-pointer mt-0.5 accent-navy-700 rounded"
                                style={{ width: '12px', height: '12px', minWidth: '12px', minHeight: '12px' }}
                              />
                              <span className={cn(subReq.status === 'completed' && 'line-through text-slate-500', 'text-xs sm:text-sm text-slate-700 break-words leading-snug')}>
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
// ===== v5 scoped styles (explicit hex; no --primary). Visual only. =====
const GS5_CSS = `
.gs5p{color:#0B1F3A;font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.15}
.gs5p *{box-sizing:border-box}
.gs5p .g-title{font-size:22px;line-height:1.3;font-weight:700;margin:0 0 16px;color:inherit}
.gs5p .g-card{background:#fff;border:1px solid #DDE3EA;border-radius:12px;box-shadow:0 1px 3px rgba(11,31,58,.08);padding:16px;margin-bottom:16px}
.gs5p .g-st{font-size:15px;font-weight:700;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3}
.gs5p .g-muted{color:#5B6B7F;font-size:12px;font-weight:400;line-height:1.35}
.gs5p .g-foot{border-top:1px solid #DDE3EA;margin-top:10px;padding-top:6px}
.gs5p .g-p{margin:16px 0;line-height:1.35}
.gs5p .g-miss{color:#9A6700;font-weight:600;white-space:nowrap}.gs5p .g-miss b{background:#FFF4D6;border:1px solid #C9A227;border-radius:4px;padding:0 4px;font-size:11px;margin-left:4px}
.gs5p .g-badge{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;background:#E8EDF3;color:#16335C;white-space:nowrap}
.gs5p .g-badge.gold{background:#C9A227;color:#0B1F3A}
.gs5p button.g-btn{min-height:44px;min-width:44px;border:1px solid #1E3A5F;background:#0B1F3A;color:#fff;border-radius:8px;padding:0 14px;font:inherit;font-size:16px;cursor:pointer;line-height:1}
.gs5p button.g-btn.o{background:#fff;color:#0B1F3A}
.gs5p button.g-btn.goldb{background:#C9A227;color:#0B1F3A;border-color:#C9A227}
.gs5p button:disabled{opacity:.55;cursor:not-allowed}
.gs5p .g-bar{height:10px;background:#E8EDF3;border-radius:5px;overflow:hidden;margin-top:4px}.gs5p .g-bar i{display:block;height:100%;background:#C9A227;border-radius:5px}
.gs5p .g-bar.over i{background:#B42318}
.gs5p .g-bar.empty{background:repeating-linear-gradient(45deg,#E8EDF3 0 6px,#fff 6px 12px)}
.gs5p .g-ph{cursor:pointer}.gs5p .g-ph.open{border:2px solid #C9A227;cursor:default}
.gs5p .g-ph.cur{box-shadow:0 0 0 4px rgba(201,162,39,.14),0 6px 22px -6px rgba(201,162,39,.45)}
.gs5p .g-phhd{cursor:pointer}
.gs5p input.g-in,.gs5p select.g-in,.gs5p textarea.g-in{min-height:44px;border:1px solid #DDE3EA;border-radius:8px;padding:0 10px;font:inherit;font-size:16px;width:100%;background:#fff;color:#0B1F3A}
.gs5p textarea.g-in{padding:10px;min-height:110px}
.gs5p input.g-in:disabled{background:#F5F7FA}
.gs5p .g-form{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}
.gs5p .g-form label{display:block}
@media(min-width:768px){.gs5p .g-form input.g-in,.gs5p .g-form select.g-in{font-size:12px}}
.gs5p .g-dots{border:1px solid #DDE3EA;background:#fff;border-radius:8px;min-width:36px;min-height:36px;height:36px;font-size:16px;line-height:1;cursor:pointer;color:#0B1F3A;padding:0}
.gs5p .g-dots.sm{min-width:28px;min-height:28px;height:28px;margin-top:4px}
.gs5p .g-dots.on{border-color:#C9A227;background:#FFF4D6}
.gs5p .g-sub{border:1px solid #DDE3EA;background:#fff;color:#16335C;border-radius:8px;min-height:36px;height:36px;padding:0 10px;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer}
.gs5p .g-menu{position:fixed;z-index:60;background:#fff;border:1px solid #DDE3EA;border-radius:10px;box-shadow:0 10px 24px rgba(11,31,58,.2);min-width:220px;padding:6px;text-align:left;font-size:13px;color:#0B1F3A;font-weight:400}
.gs5p .g-menu .mi{display:block;width:100%;text-align:left;background:none;border:0;font:inherit;font-size:13px;color:inherit;padding:9px 10px;border-radius:6px;min-height:36px;cursor:pointer;line-height:1.2}
.gs5p .g-menu .mi:hover:not(:disabled){background:#F5F7FA}
.gs5p .g-menu .mi:disabled{color:#A0AAB8;opacity:1}
.gs5p .g-menu .mh{font-weight:700;color:#5B6B7F;font-size:11px;padding:9px 10px}
.gs5p .g-menu .red{color:#B42318;font-weight:600}.gs5p .g-menu hr{border:0;border-top:1px solid #DDE3EA;margin:4px 0}
.gs5p .g-menu small{display:block;color:#5B6B7F;font-size:11px;font-weight:400}
.gs5p .g-pn{display:flex;align-items:flex-start;overflow-x:auto;padding:8px 4px 4px}
.gs5p .g-pn .n{flex:1;min-width:76px;text-align:center;position:relative;font-size:11px;color:#5B6B7F;line-height:1.25}
.gs5p .g-pn .n:before{content:"";position:absolute;top:20px;left:-50%;width:100%;height:3px;background:#DDE3EA;z-index:0}.gs5p .g-pn .n:first-child:before{display:none}
.gs5p .g-pn .c{position:relative;z-index:1;width:40px;height:40px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;background:#E8EDF3;border:2px solid #DDE3EA;font-size:16px}
.gs5p .g-pn .cur .c{background:#0B1F3A;border-color:#0B1F3A;box-shadow:0 0 0 4px #fff,0 0 0 7px #C9A227}.gs5p .g-pn .cur{color:#0B1F3A;font-weight:700}
.gs5p .g-pn .done .c{background:#C9A227;color:#0B1F3A}
.gs5p .g-pn .gate .c{border-color:#C9A227}
.gs5p .g-cpbar{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#0B1F3A;color:#fff;border-radius:10px;padding:10px 14px;margin-top:10px;font-size:16px}.gs5p .g-cpbar b{color:#C9A227}
.gs5p .g-note{background:#FFF8E1;border-left:4px solid #C9A227;padding:8px 12px;font-size:13px;border-radius:6px;margin-bottom:12px;line-height:1.35}
.gs5p .g-bars{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:10px 0}
.gs5p .g-bud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0}.gs5p .g-bud>div{background:#F5F7FA;border:1px solid #DDE3EA;border-radius:8px;padding:8px}
.gs5p .g-bud dt{font-size:11px;color:#5B6B7F}.gs5p .g-bud dd{margin:0 0 8px}
.gs5p .g-req{border:1px solid #DDE3EA;border-radius:10px;margin-bottom:10px;overflow:visible;background:#fff}
.gs5p .g-req.child{margin-left:44px;border-left:3px solid #C9A227}
.gs5p .g-req.drag{box-shadow:0 8px 20px rgba(11,31,58,.25);transform:rotate(-1deg);border:2px solid #C9A227;opacity:.95}
.gs5p .g-req.combine{outline:2px dashed #C9A227;outline-offset:2px}
.gs5p .g-tk{display:flex;align-items:center;gap:12px;padding:10px 12px;min-height:52px;background:transparent;border-radius:10px}
.gs5p .g-tk input[type=checkbox]{width:20px;height:20px;min-height:20px;flex:0 0 20px;accent-color:#0B1F3A;margin:0}
.gs5p .g-tk .tx{flex:1;line-height:1.3}
.gs5p .g-tk .tx.done{text-decoration:line-through;color:#5B6B7F}
.gs5p .g-hd{color:#8A99AB;cursor:grab;font-size:18px;letter-spacing:-3px;min-width:24px;user-select:none}
.gs5p .g-clip{border:1px solid #DDE3EA;background:#fff;border-radius:999px;padding:6px 12px;font-size:13px;min-height:36px;height:36px;white-space:nowrap;cursor:pointer;color:#0B1F3A}
.gs5p .g-clip.has{background:#0B1F3A;color:#C9A227;font-weight:700}
.gs5p .g-files{background:#F9F6EA;border-top:1px solid #E9DDB0;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-radius:0 0 10px 10px}
.gs5p .g-files .lbl{font-weight:700;font-size:13px;margin-right:4px}.gs5p .g-files button.g-btn{min-height:40px;font-size:13px}
.gs5p .g-ptabs{display:flex;flex-wrap:nowrap;gap:2px;border-bottom:1px solid #DDE3EA;margin:12px 0;overflow-x:auto}
.gs5p .g-ptabs button{background:none;border:0;border-bottom:3px solid transparent;border-radius:0;padding:10px 18px;font:inherit;font-size:14px;color:#5B6B7F;white-space:nowrap;min-height:44px;cursor:pointer}
.gs5p .g-ptabs button.on{color:#0B1F3A;font-weight:700;border-bottom-color:#C9A227}
.gs5p .g-frames{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.gs5p .g-frame{border:2px dashed #C9A227;border-radius:12px;padding:12px;background:#fff;min-width:0}.gs5p .g-frame h4{margin:0 0 6px;font-size:13px;line-height:1.3;color:#9A6700;font-weight:700}
.gs5p .g-frame .g-bud{grid-template-columns:1fr 1fr}
.gs5p .g-nt{border-bottom:1px solid #DDE3EA;padding:8px 0;font-size:13px;line-height:1.35;word-break:break-word}
.gs5p .g-rb{display:block;background:none;border:0;color:#16335C;font:inherit;font-weight:600;font-size:13px;min-height:36px;padding:0;cursor:pointer}
.gs5p .g-addrow{display:flex;gap:8px;margin:10px 0}
.gs5p .g-addrow button.g-btn{white-space:nowrap}
.gs5p .g-edit{display:flex;gap:6px;flex:1}
@media(max-width:767px){
 .gs5p .g-bars,.gs5p .g-bud{grid-template-columns:1fr 1fr}
 .gs5p .g-form,.gs5p .g-frames{grid-template-columns:1fr}
 .gs5p .g-tk{flex-wrap:wrap;gap:8px 10px}
 .gs5p .g-tk .tx{flex:1 1 calc(100% - 80px)}
 .gs5p .g-tk .g-clip{margin-left:70px}
 .gs5p .g-req.child .g-tk .g-clip{margin-left:auto}
 .gs5p .g-req.child{margin-left:22px}
 .gs5p .g-sub span{display:none}
 .gs5p .g-tk input[type=checkbox]{width:24px;height:24px;min-height:24px;flex-basis:24px}
 .gs5p .g-ptabs button{padding:10px 12px}
}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p{color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-card{background:#0F2340;border-color:rgba(148,178,226,.16);box-shadow:0 10px 30px -12px rgba(0,0,0,.55)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-muted,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bud dt,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu small,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .mh{color:#8193B0}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-foot,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-nt,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ptabs{border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-miss{color:#F5B544}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-miss b{background:rgba(245,181,68,.14);border-color:rgba(212,165,55,.55)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-badge{background:rgba(148,178,226,.14);color:#B7C4DA}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-badge.gold{background:#D4A537;color:#1A1203}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p button.g-btn{background:#16335C;border-color:rgba(148,178,226,.28);color:#fff}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p button.g-btn.o{background:transparent;color:#E9EFF9;border-color:rgba(148,178,226,.28)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p button.g-btn.goldb{background:#D4A537;color:#1A1203;border-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bar{background:rgba(148,178,226,.14)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bar i{background:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bar.empty{background:repeating-linear-gradient(45deg,rgba(148,178,226,.16) 0 6px,transparent 6px 12px)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ph.open{border-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ph.cur{box-shadow:0 0 0 4px rgba(212,165,55,.12),0 0 40px -14px rgba(212,165,55,.6)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p input.g-in,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p select.g-in,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p textarea.g-in{background:rgba(255,255,255,.04);border-color:rgba(148,178,226,.22);color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p input.g-in:disabled{background:rgba(255,255,255,.02)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p select.g-in option{background:#0F2340}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-dots,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-sub,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-clip{background:rgba(255,255,255,.04);border-color:rgba(148,178,226,.22);color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-dots.on{background:rgba(212,165,55,.16);border-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-clip.has{background:#0B1F3A;color:#D4A537;border-color:rgba(212,165,55,.45)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu{background:#102442;border-color:rgba(148,178,226,.2);color:#E9EFF9;box-shadow:0 10px 30px rgba(0,0,0,.5)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .mi:hover:not(:disabled){background:rgba(255,255,255,.06)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .mi:disabled{color:#56698A}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .red{color:#FF6B6B}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu hr{border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .n{color:#8193B0}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .n:before{background:rgba(148,178,226,.2)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .c{background:rgba(148,178,226,.12);border-color:rgba(148,178,226,.22)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .cur{color:#E9EFF9}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .cur .c{background:#0B1F3A;border-color:#0B1F3A;box-shadow:0 0 0 4px #0F2340,0 0 0 7px #D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .done .c{background:#D4A537;color:#1A1203}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-cpbar{background:#0B1F3A;border:1px solid rgba(212,165,55,.3)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-cpbar b{color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-note{background:rgba(212,165,55,.10);border-left-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bud>div{background:rgba(255,255,255,.03);border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-req{background:rgba(255,255,255,.02);border-color:rgba(148,178,226,.18)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-req.child{border-left-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-files{background:rgba(212,165,55,.08);border-top-color:rgba(212,165,55,.25)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-tk input[type=checkbox]{accent-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ptabs button{color:#8193B0}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ptabs button.on{color:#E9EFF9;border-bottom-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-frame{background:transparent;border-color:rgba(212,165,55,.55)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-frame h4{color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-rb{color:#B7C4DA}

.gs5-menu{background:#fff;border:1px solid #DDE3EA;border-radius:10px;box-shadow:0 10px 24px rgba(11,31,58,.2);min-width:220px;padding:6px;font-size:13px;color:#0B1F3A;z-index:60}
.gs5-menu [role=menuitem]{display:block;padding:9px 10px;border-radius:6px;min-height:36px;font-size:13px;line-height:1.2;cursor:pointer}
.gs5-menu [role=menuitem]:hover,.gs5-menu [role=menuitem][data-highlighted]{background:#F5F7FA}
.gs5-menu [role=menuitem][data-disabled]{color:#A0AAB8;opacity:1;pointer-events:none}
.gs5-menu small{display:block;color:#5B6B7F;font-size:11px}
.gs5-menu .mh{font-weight:700;color:#5B6B7F;font-size:11px;padding:9px 10px}
.gs5-menu .red{color:#B42318;font-weight:600}.gs5-menu .hr{border-top:1px solid #DDE3EA;margin:4px 0}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu{background:#102442;border-color:rgba(148,178,226,.2);color:#E9EFF9;box-shadow:0 10px 30px rgba(0,0,0,.5)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu [role=menuitem]:hover,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu [role=menuitem][data-highlighted]{background:rgba(255,255,255,.06)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu [role=menuitem][data-disabled]{color:#56698A}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu small,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu .mh{color:#8193B0}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu .red{color:#FF6B6B}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu .hr{border-color:rgba(148,178,226,.16)}
`;
