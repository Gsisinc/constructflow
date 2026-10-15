import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ResourceAllocationBoard from "@/components/ops/ResourceAllocationBoard";

/**
 * Project tab — resource allocations for this project (still loads org-wide allocations
 * so double-bookings across other projects surface as conflicts).
 * props: projectId, project (has organization_id)
 */
export default function ProjectResourcesTab({ projectId, project }) {
  const orgId = project?.organization_id;

  // Phases for the assignment dialog's phase picker.
  const { data: phases = [] } = useQuery({
    queryKey: ["projectPhases", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await base44.entities.CustomPhase.filter({ project_id: projectId }, { sort: "order", limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!projectId,
  });

  const board = useMemo(
    () => (
      <ResourceAllocationBoard
        organizationId={orgId}
        projectId={projectId}
        phasesForProject={phases}
      />
    ),
    [orgId, projectId, phases]
  );

  return <div>{board}</div>;
}