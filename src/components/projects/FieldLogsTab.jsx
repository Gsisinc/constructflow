import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Route, Car } from 'lucide-react';
import { fmtDate } from '@/lib/dates';

export default function FieldLogsTab({ projectId }) {
  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['projectDailyLogs', projectId],
    queryFn: async () => {
      const res = await base44.entities.DailyLog.filter({ project_id: projectId }, { sort: '-log_date', limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!projectId,
  });

  const { data: mileage = [] } = useQuery({
    queryKey: ['projectVehicleLogs', projectId],
    queryFn: async () => {
      const res = await base44.entities.VehicleLog.filter({ project_id: projectId }, { sort: '-log_date', limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!projectId,
  });

  const totalMiles = (mileage || []).reduce((s, m) => s + (m.total_miles || 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" style={{ color: '#C9A227' }} /> Daily Logs
            <Badge className="ml-auto bg-slate-100 text-slate-600 border-0">{dailyLogs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[28rem] overflow-y-auto">
          {dailyLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No daily logs for this project yet.</p>
          ) : dailyLogs.map(l => (
            <div key={l.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 text-sm">{fmtDate(l.log_date)}</span>
                <span className="text-xs text-slate-500">Entered by {l.entered_by || l.submitted_by || '—'}</span>
              </div>
              {l.work_performed && <p className="text-sm text-slate-700 mt-1">{l.work_performed}</p>}
              {l.notes && <p className="text-xs text-slate-500 mt-1">{l.notes}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4" style={{ color: '#C9A227' }} /> Mileage
            <Badge className="ml-auto bg-slate-100 text-slate-600 border-0">{totalMiles.toLocaleString()} mi</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[28rem] overflow-y-auto">
          {mileage.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No mileage entries for this project yet.</p>
          ) : mileage.map(m => (
            <div key={m.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 text-sm flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-slate-400" />{m.vehicle_name || '—'}</span>
                <Badge className="bg-amber-50 text-amber-700 border-0">{m.total_miles || 0} mi</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{fmtDate(m.log_date)} · Entered by {m.entered_by || '—'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}