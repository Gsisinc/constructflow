import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Wrench, User } from "lucide-react";
import ResourceAssignmentDialog from "./ResourceAssignmentDialog";
import {
  buildConflictMap, isConflicted, startOfWeek, addWeeks, fmtWeekLabel, allocationInWeek,
} from "@/lib/resourceConflicts";

const WEEKS = 6;

/**
 * Ops resource allocation board — grid by resource (rows) × week (columns).
 * Overlapping assignments for the same resource show a red conflict flag on both.
 * props: organizationId, projectId (scope to one project; still loads org allocations for conflict detection)
 */
export default function ResourceAllocationBoard({ organizationId, projectId, phasesForProject: phasesProp = [] }) {
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [showAdd, setShowAdd] = useState(false);

  const weeks = useMemo(
    () => Array.from({ length: WEEKS }, (_, i) => addWeeks(anchor, i)),
    [anchor]
  );

  const { data: allocations = [] } = useQuery({
    queryKey: ["resourceAllocations", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await base44.entities.ResourceAllocation.filter(
        { organization_id: organizationId },
        { sort: "start_date", limit: 500 }
      );
      return res?.items || res || [];
    },
    enabled: !!organizationId,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["boardWorkers", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await base44.entities.Worker.filter({ organization_id: organizationId }, { limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!organizationId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["boardProjects", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await base44.entities.Project.filter({ organization_id: organizationId }, { limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!organizationId,
  });

  const visibleAllocations = useMemo(
    () => projectId ? allocations.filter((a) => a.project_id === projectId) : allocations,
    [allocations, projectId]
  );

  const conflictMap = useMemo(() => buildConflictMap(allocations), [allocations]);

  // Rows: every resource that has an allocation in view, plus all org workers (so techs with no assignments still show).
  const rows = useMemo(() => {
    const map = new Map(); // key -> { key, type, name, email }
    allocations.forEach((a) => {
      const key = `${a.resource_type}::${a.resource_id}`;
      if (!map.has(key)) map.set(key, { key, type: a.resource_type, name: a.resource_name, email: a.resource_email, id: a.resource_id });
    });
    workers.forEach((w) => {
      const key = `tech::${w.id}`;
      if (!map.has(key)) map.set(key, { key, type: "tech", name: w.name, email: w.email, id: w.id });
    });
    return Array.from(map.values()).filter((r) => r.type === "tech" || !!r.id);
  }, [allocations, workers]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["resourceAllocations", organizationId] });
  }, [queryClient, organizationId]);

  const phasesForProject = phasesProp;

  const conflictedCount = allocations.filter((a) => isConflicted(conflictMap, a.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnchor(addWeeks(anchor, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700">
            {fmtWeekLabel(weeks[0])} – {fmtWeekLabel(weeks[weeks.length - 1])}
          </span>
          <Button variant="outline" size="sm" onClick={() => setAnchor(addWeeks(anchor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAnchor(startOfWeek(new Date()))}>Today</Button>
        </div>
        <div className="flex items-center gap-3">
          {conflictedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {conflictedCount} conflict{conflictedCount === 1 ? "" : "s"}
            </Badge>
          )}
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Assign
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky left-0 z-10 bg-slate-50 text-left text-xs font-semibold text-slate-600 px-4 py-3 w-56">Resource</th>
                {weeks.map((w) => (
                  <th key={w.toISOString()} className="text-left text-xs font-semibold text-slate-600 px-3 py-3 border-l border-slate-200 min-w-[140px]">
                    {fmtWeekLabel(w)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={WEEKS + 1} className="px-4 py-10 text-center text-sm text-slate-400">
                    No resources yet. Click <span className="font-medium text-slate-600">Assign</span> to add a tech or piece of equipment.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const rowAllocs = allocations.filter((a) => `${a.resource_type}::${a.resource_id}` === row.key);
                return (
                  <tr key={row.key} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${row.type === "tech" ? "bg-navy-100 text-navy-700" : "bg-amber-100 text-amber-700"}`}>
                          {row.type === "tech" ? <User className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{row.name}</p>
                          <p className="text-xs text-slate-400 truncate">{row.type === "tech" ? row.email || "Tech" : "Equipment"}</p>
                        </div>
                      </div>
                    </td>
                    {weeks.map((w) => {
                      const cellAllocs = rowAllocs.filter((a) => allocationInWeek(a, w));
                      const visibleHere = projectId ? cellAllocs.filter((a) => a.project_id === projectId) : cellAllocs;
                      return (
                        <td key={w.toISOString()} className="px-2 py-2 border-l border-slate-200 align-top">
                          <div className="space-y-1">
                            {visibleHere.map((a) => {
                              const conflicted = isConflicted(conflictMap, a.id);
                              return (
                                <div
                                  key={a.id}
                                  className={`rounded-md border px-2 py-1.5 text-xs ${
                                    conflicted
                                      ? "border-red-400 bg-red-50 text-red-800"
                                      : "border-navy-200 bg-navy-50 text-navy-800"
                                  }`}
                                  title={conflicted ? "Double-booked — overlaps another assignment" : a.project_name}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-medium truncate">{a.project_name || "Unassigned"}</span>
                                    {conflicted && <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {a.start_date?.slice(5)} – {a.end_date?.slice(5)}
                                    {a.phase_name ? ` · ${a.phase_name}` : ""}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ResourceAssignmentDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        organizationId={organizationId}
        onSaved={refresh}
        projects={projects}
        workers={workers}
        projectId={projectId}
        phasesForProject={phasesForProject}
      />
    </div>
  );
}