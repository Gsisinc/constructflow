import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getPhaseTemplate } from '@/components/projects/projectTemplates';
import { seedRequirementsIdempotent } from '@/lib/phaseStageLink';
import DualTrackTracker from '@/components/projects/DualTrackTracker';
import PhaseNavigator from '@/components/phases/PhaseNavigator';
import PhaseManager from '@/components/phases/PhaseManager';
import PhaseRequirementManager from '@/components/phases/PhaseRequirementManager';
import PhaseGateChecklist from '@/components/phases/PhaseGateChecklist';
const seededBids = new Set();

// Mirror a bid's project_id-scoped phase entities by treating bid.id as the
// project_id while the bid is open. On conversion these same records are
// re-pointed to the real project id (see bidConversion.js) — nothing is recreated.
// B-SEED 2026-11-18 (Kemar): phases follow the bid's trade. Fire Alarm bids get
// Fire Alarm phases, Low Voltage bids get Low Voltage phases. Accepts the stored
// value or its label ("Fire Alarm"). Unknown/blank Division returns null so the
// tab never seeds a guessed template.
const divisionToProjectType = (d) => {
  const k = String(d || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!k) return null;
  if (k === 'fa' || k.startsWith('fire')) return 'fire_alarm_new_construction';
  if (k === 'lv' || k.startsWith('low_volt')) return 'low_voltage_structured_cabling';
  if (k === 'drone' || k === 'software' || k === 'other') return 'other';
  return null;
};

export default function BidPhaseWorkspace({ bid, organizationId }) {
  const qc = useQueryClient();
  const bidId = bid.id;
  const projectType = divisionToProjectType(bid.division);

  const [seeding, setSeeding] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [showGateChecklist, setShowGateChecklist] = useState(false);

  const { data: customPhases = [], isFetched: phasesFetched } = useQuery({
    queryKey: ['customPhases', bidId],
    queryFn: () => base44.entities.CustomPhase.filter({ project_id: bidId }, 'order'),
    enabled: !!bidId,
  });

  const { data: phaseGates = [] } = useQuery({
    queryKey: ['phaseGates', bidId],
    queryFn: () => base44.entities.PhaseGate.filter({ project_id: bidId }),
    enabled: !!bidId,
  });

  // Lazy-seed the default phase template for this bid (mirrors a new project).
  // The Phases 12 stages / 3 phases auto-seed themselves inside DualTrackTracker.
  useEffect(() => {
    if (seeding || !bidId || !phasesFetched) return;
    if (!projectType) return; // B-SEED: never seed while the bid's Division is unset
    if (customPhases.length > 0) return;
    if (seededBids.has(bidId)) return;
    seededBids.add(bidId);
    setSeeding(true);
    (async () => {
      try {
        const tpl = getPhaseTemplate(projectType);
        const phases = tpl.map((phase, idx) => ({
          project_id: bidId,
          phase_name: phase.phase,
          display_name: phase.phase,
          order: idx,
          status: 'pending',
        }));
        // Entered by: Sales
        if (phases.length) await base44.entities.CustomPhase.bulkCreate(phases);
        await seedRequirementsIdempotent(base44, bidId, tpl);
        qc.invalidateQueries({ queryKey: ['customPhases', bidId] });
      } catch (e) {
        console.error('bid phase seed failed', e);
      }
      setSeeding(false);
    })();
  }, [bidId, projectType, customPhases, seeding, qc, phasesFetched]);

  const createGateMutation = useMutation({
    // Entered by: Sales
    mutationFn: (data) => base44.entities.PhaseGate.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phaseGates', bidId] }),
  });

  const handleInitiateGate = (fromPhase, toPhase) => {
    createGateMutation.mutate({
      project_id: bidId,
      from_phase: fromPhase,
      to_phase: toPhase,
      status: 'in_review',
      checklist_items: [
        { item: 'All required inspections passed', required: true, completed: false },
        { item: 'Documentation complete and approved', required: true, completed: false },
        { item: 'Budget reconciliation complete', required: true, completed: false },
        { item: 'Safety audit passed', required: true, completed: false },
        { item: 'Quality control sign-off', required: false, completed: false },
      ],
      required_signoffs: [
        { role: 'Superintendent', name: '', signed: false },
        { role: 'Project Manager', name: bid.owner_name || '', signed: false },
        { role: 'Owner Representative', name: '', signed: false },
      ],
      initiated_date: new Date().toISOString().split('T')[0],
    });
  };

  // B-SEED: flag phases that came from the other trade's template (e.g. Low
  // Voltage phases on a Fire Alarm bid). Read-only warning; nothing is changed.
  const tradePhaseNames = (t) => new Set((getPhaseTemplate(t) || []).map((p) => p.phase));
  const otherTrade = projectType === 'fire_alarm_new_construction' ? 'low_voltage_structured_cabling'
    : projectType === 'low_voltage_structured_cabling' ? 'fire_alarm_new_construction' : null;
  const ownNames = projectType ? tradePhaseNames(projectType) : new Set();
  const otherNames = otherTrade ? tradePhaseNames(otherTrade) : new Set();
  const phaseList = Array.isArray(customPhases) ? customPhases : [];
  const wrongTradePhases = phaseList.filter((p) => otherNames.has(p.phase_name) && !ownNames.has(p.phase_name));
  const divisionLabel = projectType === 'fire_alarm_new_construction' ? 'Fire Alarm'
    : projectType === 'low_voltage_structured_cabling' ? 'Low Voltage' : '';

  return (
    <div className="space-y-4">
    {!projectType && phaseList.length === 0 && (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Set this bid's Division (Overview, Edit details) to load its phases. Fire Alarm bids get Fire Alarm phases; Low Voltage bids get Low Voltage phases.
      </div>
    )}
    {wrongTradePhases.length > 0 && (
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        {wrongTradePhases.length} phase(s) on this bid belong to a different trade than its Division ({divisionLabel}). Nothing was changed automatically. Once they are removed, {divisionLabel} phases load the next time this tab opens.
      </div>
    )}
    <Tabs defaultValue="tracker" className="w-full">
      <TabsList className="w-full sm:w-auto justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 bg-muted rounded-lg">
        <TabsTrigger value="tracker" className="flex-shrink-0">Phases/Stages</TabsTrigger>
        <TabsTrigger value="gates" className="flex-shrink-0">Gates</TabsTrigger>
        <TabsTrigger value="requirements" className="flex-shrink-0">Requirements</TabsTrigger>
      </TabsList>

      <TabsContent value="tracker" className="mt-6">
        <DualTrackTracker projectId={bidId} project={{ id: bidId, organization_id: organizationId }} />
      </TabsContent>

      <TabsContent value="gates" className="mt-6">
        <div className="space-y-6">
          <PhaseNavigator
            projectId={bidId}
            currentPhase={customPhases[0]?.phase_name || 'preconstruction'}
            phaseGates={phaseGates}
            customPhases={customPhases}
            onInitiateGate={handleInitiateGate}
            onViewGate={(gate) => { setSelectedGate(gate); setShowGateChecklist(true); }}
            onPhaseChange={() => {}}
          />
          <PhaseManager projectId={bidId} currentPhase={customPhases[0]?.phase_name || 'preconstruction'} bid={bid} />
        </div>
      </TabsContent>

      <TabsContent value="requirements" className="mt-6">
        <PhaseRequirementManager projectId={bidId} />
      </TabsContent>

      <PhaseGateChecklist
        gate={selectedGate}
        open={showGateChecklist}
        onOpenChange={setShowGateChecklist}
      />
    </Tabs>
    </div>
  );
}