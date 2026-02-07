import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Lock, ChevronRight, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const DEFAULT_PHASES = [
  { id: 'preconstruction', label: 'Pre-Construction', icon: '📋', isDefault: true },
  { id: 'foundation', label: 'Foundation', icon: '🏗️', isDefault: true },
  { id: 'superstructure', label: 'Superstructure', icon: '🏢', isDefault: true },
  { id: 'enclosure', label: 'Enclosure', icon: '🪟', isDefault: true },
  { id: 'mep_rough', label: 'MEP Rough-In', icon: '⚡', isDefault: true },
  { id: 'interior_finishes', label: 'Interior Finishes', icon: '🎨', isDefault: true },
  { id: 'commissioning', label: 'Commissioning', icon: '✅', isDefault: true },
  { id: 'closeout', label: 'Closeout', icon: '🔑', isDefault: true },
];

export default function PhaseNavigator({ 
  currentPhase, 
  phaseGates = [], 
  customPhases = [],
  onInitiateGate,
  onViewGate,
  projectId
}) {
  const queryClient = useQueryClient();
  
  // Merge default phases with custom phases, sorted by order
  const hiddenPhaseNames = customPhases.filter(cp => cp.is_hidden).map(cp => cp.phase_name);
  
  const PHASES = [
    ...DEFAULT_PHASES.filter(dp => !hiddenPhaseNames.includes(dp.id)),
    ...customPhases.filter(cp => !cp.is_hidden).map(cp => ({
      id: cp.phase_name,
      label: cp.display_name,
      icon: cp.icon || '📌',
      customPhaseId: cp.id
    }))
  ];
  
  const currentPhaseIndex = PHASES.findIndex(p => p.id === currentPhase);

  const deleteCustomPhaseMutation = useMutation({
    mutationFn: (customPhaseId) => base44.entities.CustomPhase.delete(customPhaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      toast.success('Phase deleted');
    }
  });

  const hideDefaultPhaseMutation = useMutation({
    mutationFn: (phaseId) => base44.entities.CustomPhase.create({
      project_id: projectId,
      phase_name: phaseId,
      display_name: `${phaseId} (hidden)`,
      is_hidden: true,
      order: 999
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      toast.success('Phase removed');
    }
  });

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
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Project Phases</h3>
          <p className="text-sm text-slate-500">Visual phase navigator with gate controls</p>
        </div>
        <Badge className="bg-blue-100 text-blue-700">
          Current: {PHASES.find(p => p.id === currentPhase)?.label}
        </Badge>
      </div>

      {/* Phase Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentPhaseIndex / (PHASES.length - 1)) * 100}%` }}
          />
        </div>

        {/* Phase Nodes */}
        <div className="relative flex justify-between">
          {PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            const gate = index > 0 ? getGateForPhase(PHASES[index - 1].id, phase.id) : null;

            return (
              <div key={phase.id} className="flex flex-col items-center" style={{ width: `${100 / PHASES.length}%` }}>
                {/* Node */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg z-10 transition-all duration-300",
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

                {/* Label */}
                <div className="flex items-center gap-1 mt-2">
                  <p className={cn(
                    "text-xs text-center font-medium",
                    status === 'current' ? "text-blue-600" : 
                    status === 'completed' ? "text-green-600" : "text-slate-500"
                  )}>
                    {phase.label}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm(`Remove "${phase.label}"? This cannot be undone.`)) {
                            if (phase.customPhaseId) {
                              deleteCustomPhaseMutation.mutate(phase.customPhaseId);
                            } else if (phase.isDefault) {
                              hideDefaultPhaseMutation.mutate(phase.id);
                            }
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Phase
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Gate Action */}
                {index === currentPhaseIndex && index < PHASES.length - 1 && (
                  <Button
                    size="sm"
                    className="mt-2 text-xs h-7"
                    variant={gate?.status === 'in_review' ? 'outline' : 'default'}
                    onClick={() => gate ? onViewGate?.(gate) : onInitiateGate?.(phase.id, PHASES[index + 1].id)}
                  >
                    {gate?.status === 'in_review' ? (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Review Gate
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Initiate Gate
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
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
    </div>
  );
}