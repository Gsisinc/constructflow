import React from "react";
import { useAuth } from "@/lib/AuthContext";
import ResourceAllocationBoard from "@/components/ops/ResourceAllocationBoard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ResourceBoard() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Resource Allocation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Assign techs and equipment to projects and phases. Overlapping bookings show a red conflict flag.
        </p>
      </div>
      <Card>
        <CardHeader className="border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Allocation board</h2>
        </CardHeader>
        <CardContent className="p-4">
          {orgId ? (
            <ResourceAllocationBoard organizationId={orgId} />
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">No organization set for your account.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}