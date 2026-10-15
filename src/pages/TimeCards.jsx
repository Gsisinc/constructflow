import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/skeleton/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import ClockIn from '@/components/dashboard/ClockIn';

export default function TimeCards() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['currentUser', 'timecards'],
    queryFn: () => base44.auth.me(),
  });

  const { data: fieldHours = [] } = useQuery({
    queryKey: ['fieldHoursLog', user?.email],
    queryFn: () => (user?.email ? base44.entities.FieldHoursLog.filter({ technician_email: user.email }, '-date').catch(() => []) : []),
    enabled: !!user?.email,
  });

    const queryClient = useQueryClient();
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), project_id: '', task_type: '', task_description: '', hours: '' });
  const [logError, setLogError] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'timecards'],
    queryFn: () => base44.entities.Project.list().catch(() => []),
    enabled: showLog,
  });

  const logHours = useMutation({
    mutationFn: (data) => base44.entities.FieldHoursLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldHoursLog'] });
      setShowLog(false);
      setLogForm({ date: format(new Date(), 'yyyy-MM-dd'), project_id: '', task_type: '', task_description: '', hours: '' });
    },
    onError: (e) => setLogError(e?.message || 'Save failed'),
  });

  const submitLog = (e) => {
    e.preventDefault();
    setLogError('');
    const hrs = parseFloat(logForm.hours);
    if (!logForm.date || !logForm.project_id || !(hrs > 0) || hrs > 24) {
      setLogError('Date, project, and hours (0-24) are required.');
      return;
    }
    const proj = projects.find((p) => p.id === logForm.project_id);
    logHours.mutate({
      organization_id: user?.organization_id,
      technician_email: user?.email,
      technician_name: user?.full_name,
      date: logForm.date,
      project_id: logForm.project_id,
      project_name: proj?.name || proj?.project_name || '',
      task_type: logForm.task_type,
      task_description: logForm.task_description,
      hours: hrs,
      approved: false,
      notes: 'TEST, Entered by: Ops Manager',
    });
  };

  const hoursThisWeek = Array.isArray(fieldHours)
    ? fieldHours
        .filter((e) => e.date) // optional: filter to current week
        .reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 break-words">Time Cards</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Track and manage your time</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Time Card</Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Crew Card</Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Crew Sheet</Button>
          <Button size="sm" className="text-xs sm:text-sm h-9 sm:h-10" onClick={() => setShowLog(!showLog)}>Log Hours</Button>
          <Button size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Weekly Sheet</Button>
        </div>
      </div>

      <ClockIn />   
         {showLog && (
        <Card>
          <CardHeader><CardTitle className="text-base">Log Hours</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitLog} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">Date
                <input type="date" className="border rounded-md h-9 px-2" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">Project
                <select className="border rounded-md h-9 px-2" value={logForm.project_id} onChange={(e) => setLogForm({ ...logForm, project_id: e.target.value })}>
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.project_name || p.id}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">Task type
                <select className="border rounded-md h-9 px-2" value={logForm.task_type} onChange={(e) => setLogForm({ ...logForm, task_type: e.target.value })}>
                  <option value="">Select</option>
                  <option>Rough-in</option><option>Trim/Device</option><option>Programming</option><option>Testing</option><option>Service</option><option>Travel</option><option>Other</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">Hours
                <input type="number" step="0.25" min="0" max="24" className="border rounded-md h-9 px-2" value={logForm.hours} onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">Description
                <textarea className="border rounded-md p-2" rows={2} value={logForm.task_description} onChange={(e) => setLogForm({ ...logForm, task_description: e.target.value })} />
              </label>
              {logError && <p className="text-red-600 sm:col-span-2">{logError}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" size="sm" disabled={logHours.isPending}>{logHours.isPending ? 'Saving...' : 'Save Entry'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLog(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 lg:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedMonth, 'MMMM yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-slate-600">Injury</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-slate-600">Modified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-600">Location</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-slate-600">Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Cards Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-2">Last Week vs This Week</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl sm:text-lg sm:text-xl md:text-2xl font-bold">{hoursThisWeek.toFixed(1)}</span>
                    <span className="text-xs sm:text-sm text-slate-600">Me (hrs)</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-lg sm:text-xl md:text-2xl font-bold">0:00</span>
                    <span className="text-xs sm:text-sm text-slate-600">Team</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-2">Total (Hrs)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-slate-600">Regular Time</span>
                      <span className="text-xs sm:text-sm font-medium">0:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-slate-600">Overtime</span>
                      <span className="text-xs sm:text-sm font-medium">0:00</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total (Hrs)</span>
                      <span>0:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Days Off</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p>No cards for the selected period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Spent on Current Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p>No time entries</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Current Week Timesheet
                </CardTitle>
                <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                  {format(new Date(), 'MMM dd')} - {format(new Date(), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">Current Week Timesheet</Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">Detailed Activity Log</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto text-xs sm:text-sm">
                <table className="w-full sm:w-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Employee</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Mon</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Tue</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Wed</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Thu</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Fri</th>
                       <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                       <td className="py-2 sm:py-3 px-2 sm:px-4">
                         <div className="font-medium text-xs sm:text-sm">Total Hours</div>
                       </td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">00:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}