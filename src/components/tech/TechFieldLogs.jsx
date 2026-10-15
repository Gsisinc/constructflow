import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Route, Plus } from 'lucide-react';
import { toast } from 'sonner';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (s) => s ? new Date(String(s).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

export default function TechFieldLogs({ user, projects, targetEmail, targetName, isAdmin }) {
  const qc = useQueryClient();
  const projOptions = projects || [];

  // Daily log form state
  const [dlProject, setDlProject] = useState(projOptions[0]?.id || '');
  const [dlDate, setDlDate] = useState(today());
  const [dlWork, setDlWork] = useState('');
  const [dlNotes, setDlNotes] = useState('');

  // Mileage form state
  const [mlProject, setMlProject] = useState(projOptions[0]?.id || '');
  const [mlDate, setMlDate] = useState(today());
  const [mlMiles, setMlMiles] = useState(0);
  const [mlVehicle, setMlVehicle] = useState('');

  const { data: myDailyLogs = [] } = useQuery({
    queryKey: ['techDailyLogs', targetEmail, user?.organization_id],
    queryFn: async () => {
      if (targetEmail) {
        const res = await base44.entities.DailyLog.filter({ entered_by: targetEmail }, { sort: '-log_date', limit: 100 });
        return res?.items || res || [];
      }
      if (user?.organization_id) {
        const res = await base44.entities.DailyLog.filter({ organization_id: user.organization_id }, { sort: '-log_date', limit: 100 });
        return res?.items || res || [];
      }
      return [];
    },
    enabled: !!targetEmail || !!user?.organization_id,
  });

  const { data: myMileage = [] } = useQuery({
    queryKey: ['techMileage', targetEmail, user?.organization_id],
    queryFn: async () => {
      if (targetEmail) {
        const res = await base44.entities.VehicleLog.filter({ entered_by: targetEmail }, { sort: '-log_date', limit: 100 });
        return res?.items || res || [];
      }
      if (user?.organization_id) {
        const res = await base44.entities.VehicleLog.filter({ organization_id: user.organization_id }, { sort: '-log_date', limit: 100 });
        return res?.items || res || [];
      }
      return [];
    },
    enabled: !!targetEmail || !!user?.organization_id,
  });

  const createDaily = useMutation({
    mutationFn: (data) => base44.entities.DailyLog.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['techDailyLogs'] });
      setDlWork(''); setDlNotes('');
      toast.success('Daily log saved');
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || '')),
  });

  const createMileage = useMutation({
    mutationFn: (data) => base44.entities.VehicleLog.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['techMileage'] });
      setMlMiles(0); setMlVehicle('');
      toast.success('Mileage entry saved');
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || '')),
  });

  const byEmail = targetEmail || user?.email;
  const byName = targetName || user?.full_name || user?.email;

  const submitDaily = () => {
    if (!dlProject) { toast.error('Select a project'); return; }
    createDaily.mutate({
      organization_id: user?.organization_id,
      project_id: dlProject,
      log_date: dlDate,
      work_performed: dlWork,
      notes: dlNotes,
      submitted_by: byEmail,
      entered_by: byEmail,
    });
  };

  const submitMileage = () => {
    if (!mlProject) { toast.error('Select a project'); return; }
    if (!mlVehicle) { toast.error('Enter a vehicle'); return; }
    createMileage.mutate({
      organization_id: user?.organization_id,
      project_id: mlProject,
      log_date: mlDate,
      total_miles: Number(mlMiles) || 0,
      vehicle_name: mlVehicle,
      driver: byName,
      entered_by: byEmail,
      purpose: 'job_site',
    });
  };

  const projName = (id) => projOptions.find(p => p.id === id)?.name || '—';

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* Daily Logs */}
      <Card className="border border-white/10 bg-white/[0.04] text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <ClipboardList className="h-4 w-4 text-[#CBAE63]" /> Daily Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Project</Label>
              <Select value={dlProject} onValueChange={setDlProject}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Date</Label>
              <Input type="date" value={dlDate} onChange={e => setDlDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Work performed</Label>
            <Textarea value={dlWork} onChange={e => setDlWork(e.target.value)} className="h-16 bg-white/5 border-white/10 text-white" placeholder="What did you do today?" />
          </div>
          <div>
            <Label className="text-slate-300">Notes</Label>
            <Input value={dlNotes} onChange={e => setDlNotes(e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Entered by {byEmail || '—'}</span>
            <Button size="sm" onClick={submitDaily} loading={createDaily.isPending} className="bg-[#CBAE63] text-[#08111F] hover:opacity-95">
              <Plus className="h-4 w-4 mr-1" /> Log
            </Button>
          </div>
          <div className="space-y-2 pt-2 border-t border-white/10">
            {myDailyLogs.length === 0 ? (
              <p className="text-sm text-slate-400 py-3 text-center">No daily logs yet.</p>
            ) : myDailyLogs.map(l => (
              <div key={l.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{projName(l.project_id)}</span>
                  <span className="text-xs text-slate-400">{fmtDate(l.log_date)}</span>
                </div>
                {l.work_performed && <p className="text-sm text-slate-300 mt-1">{l.work_performed}</p>}
                <p className="text-[11px] text-slate-500 mt-1">Entered by {l.entered_by || l.submitted_by || '—'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mileage */}
      <Card className="border border-white/10 bg-white/[0.04] text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Route className="h-4 w-4 text-[#CBAE63]" /> Mileage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Project</Label>
              <Select value={mlProject} onValueChange={setMlProject}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Date</Label>
              <Input type="date" value={mlDate} onChange={e => setMlDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Vehicle</Label>
              <Input value={mlVehicle} onChange={e => setMlVehicle(e.target.value)} placeholder="Truck #1" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Miles</Label>
              <Input type="number" value={mlMiles} onChange={e => setMlMiles(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Entered by {byEmail || '—'}</span>
            <Button size="sm" onClick={submitMileage} loading={createMileage.isPending} className="bg-[#CBAE63] text-[#08111F] hover:opacity-95">
              <Plus className="h-4 w-4 mr-1" /> Log
            </Button>
          </div>
          <div className="space-y-2 pt-2 border-t border-white/10">
            {myMileage.length === 0 ? (
              <p className="text-sm text-slate-400 py-3 text-center">No mileage entries yet.</p>
            ) : myMileage.map(m => (
              <div key={m.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{projName(m.project_id)}</span>
                  <Badge className="bg-[#CBAE63]/15 text-[#E8D39B] border-0">{m.total_miles || 0} mi</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">{m.vehicle_name} · {fmtDate(m.log_date)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Entered by {m.entered_by || '—'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}