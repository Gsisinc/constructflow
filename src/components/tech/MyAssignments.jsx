import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarDays, MapPin } from "lucide-react";
import { buildConflictMap, isConflicted } from "@/lib/resourceConflicts";

/**
 * Tech Portal section — shows the logged-in tech's resource assignments.
 * Loads allocations by resource_email === user.email, with org-wide conflict detection.
 * props: user
 */
export default function MyAssignments({ user, targetEmail, targetName, isAdmin }) {
  const orgId = user?.organization_id;

  const { data: mine = [] } = useQuery({
    queryKey: ["myAssignments", targetEmail, orgId],
    queryFn: async () => {
      if (targetEmail) {
        const res = await base44.entities.ResourceAllocation.filter({ resource_email: targetEmail }, { sort: "start_date", limit: 100 });
        return res?.items || res || [];
      }
      if (orgId) {
        const res = await base44.entities.ResourceAllocation.filter({ organization_id: orgId }, { sort: "start_date", limit: 500 });
        return res?.items || res || [];
      }
      return [];
    },
    enabled: !!targetEmail || !!orgId,
  });

  const { data: orgAllocations = [] } = useQuery({
    queryKey: ["resourceAllocations", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await base44.entities.ResourceAllocation.filter({ organization_id: orgId }, { sort: "start_date", limit: 500 });
      return res?.items || res || [];
    },
    enabled: !!orgId,
  });

  const conflictMap = useMemo(() => buildConflictMap(orgAllocations), [orgAllocations]);
  const myConflicts = useMemo(() => mine.filter((a) => isConflicted(conflictMap, a.id)), [mine, conflictMap]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-300">{mine.length} assignment{mine.length === 1 ? "" : "s"} {isAdmin ? (targetEmail ? `for ${targetName || targetEmail}` : "across all techs") : "on your calendar"}.</p>
        {myConflicts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {myConflicts.length} double-booked
          </Badge>
        )}
      </div>

      {mine.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
          No assignments yet. Your supervisor can assign you to projects and phases from the Resource Allocation board.
        </p>
      ) : (
        <div className="space-y-2">
          {mine.map((a) => {
            const conflicted = isConflicted(conflictMap, a.id);
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${
                  conflicted ? "border-red-400/60 bg-red-500/10" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{a.project_name || "Unassigned"}</span>
                      {a.phase_name && <Badge className="border-0 bg-white/10 text-slate-200 hover:bg-white/10">{a.phase_name}</Badge>}
                      {a.role && <Badge className="border-0 bg-[#CBAE63]/15 text-[#E8D39B] hover:bg-[#CBAE63]/15">{a.role}</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {a.start_date} – {a.end_date}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {a.project_name || "—"}</span>
                    </div>
                  </div>
                  {conflicted && (
                    <Badge variant="destructive" className="gap-1 flex-shrink-0">
                      <AlertTriangle className="h-3 w-3" /> Conflict
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}