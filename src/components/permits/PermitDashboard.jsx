import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

const statusColors = {
  not_started: 'bg-slate-50 text-slate-600 border-slate-200',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-purple-50 text-purple-700 border-purple-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
};

const permitTypeIcons = {
  building: '🏗️',
  electrical: '⚡',
  plumbing: '🔧',
  mechanical: '⚙️',
  fire: '🔥',
  demolition: '💥',
  environmental: '🌿',
  occupancy: '🔑',
  other: '📋',
};

export default function PermitDashboard({ permits = [], onViewPermit, onAddPermit }) {
  const totalPermits = permits.length;
  const approvedPermits = permits.filter(p => p.status === 'approved').length;
  const pendingPermits = permits.filter(p => ['submitted', 'under_review'].includes(p.status)).length;
  const overduePermits = permits.filter(p => {
    if (!p.expiry_date || p.status !== 'approved') return false;
    return differenceInDays(new Date(p.expiry_date), new Date()) < 30;
  }).length;

  const upcomingInspections = permits.flatMap(p => 
    (p.inspections || []).filter(i => i.status === 'scheduled')
  ).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Permits</p>
              <p className="text-2xl font-semibold mt-1">{totalPermits}</p>
            </div>
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Approved</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{approvedPermits}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{pendingPermits}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Expiring Soon</p>
              <p className={cn(
                "text-2xl font-semibold mt-1",
                overduePermits > 0 ? "text-red-600" : "text-slate-900"
              )}>{overduePermits}</p>
            </div>
            <AlertTriangle className={cn(
              "h-8 w-8",
              overduePermits > 0 ? "text-red-200" : "text-slate-200"
            )} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permit List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Permits</h3>
            <Button size="sm" onClick={onAddPermit}>
              <Plus className="h-4 w-4 mr-1" />
              Add Permit
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {permits.map(permit => (
              <div
                key={permit.id}
                onClick={() => onViewPermit?.(permit)}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{permitTypeIcons[permit.permit_type] || '📋'}</div>
                  <div>
                    <p className="font-medium text-slate-900">{permit.permit_type?.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500">
                      {permit.permit_number || 'No number assigned'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn("border", statusColors[permit.status])}>
                    {permit.status?.replace('_', ' ')}
                  </Badge>
                  {permit.expiry_date && permit.status === 'approved' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Expires {format(new Date(permit.expiry_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {permits.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No permits yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Inspections */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Upcoming Inspections</h3>
          <div className="space-y-3">
            {upcomingInspections.slice(0, 5).map((inspection, idx) => (
              <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-amber-800 text-sm">{inspection.type}</p>
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  {format(new Date(inspection.scheduled_date), 'EEEE, MMM d, yyyy')}
                </p>
                {inspection.inspector && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-amber-700">
                    <User className="h-3 w-3" />
                    {inspection.inspector}
                  </div>
                )}
              </div>
            ))}
            {upcomingInspections.length === 0 && (
              <div className="text-center py-4 text-slate-500">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No upcoming inspections</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}