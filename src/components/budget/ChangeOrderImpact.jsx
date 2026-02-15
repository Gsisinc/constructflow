import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors = {
  draft: 'bg-slate-50 text-slate-700 border-slate-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  client_review: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  executed: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function ChangeOrderImpact({ changeOrders = [], onViewDetails }) {
  const pendingImpact = changeOrders
    .filter(co => ['pending_review', 'client_review'].includes(co.status))
    .reduce((sum, co) => sum + (co.cost_impact || 0), 0);

  const approvedImpact = changeOrders
    .filter(co => ['approved', 'executed'].includes(co.status))
    .reduce((sum, co) => sum + (co.cost_impact || 0), 0);

  const totalScheduleImpact = changeOrders
    .filter(co => co.status !== 'rejected')
    .reduce((sum, co) => sum + (co.schedule_impact_days || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Change Order Impact Radar</h3>
          <p className="text-sm text-slate-500">Triple impact analysis: Cost, Schedule, Scope</p>
        </div>
        <Badge variant="outline" className="text-slate-600">
          {changeOrders.length} Total
        </Badge>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Cost Impact</span>
          </div>
          <p className={cn(
            "text-xl font-semibold",
            approvedImpact + pendingImpact >= 0 ? "text-red-600" : "text-green-600"
          )}>
            {approvedImpact + pendingImpact >= 0 ? '+' : ''}${(approvedImpact + pendingImpact).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ${pendingImpact.toLocaleString()} pending
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Schedule Impact</span>
          </div>
          <p className={cn(
            "text-xl font-semibold",
            totalScheduleImpact > 0 ? "text-red-600" : totalScheduleImpact < 0 ? "text-green-600" : "text-slate-900"
          )}>
            {totalScheduleImpact > 0 ? '+' : ''}{totalScheduleImpact} days
          </p>
          <p className="text-xs text-slate-500 mt-1">Net schedule change</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Scope Changes</span>
          </div>
          <p className="text-xl font-semibold text-slate-900">
            {changeOrders.filter(co => co.scope_description).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Documented changes</p>
        </div>
      </div>

      {/* Recent Change Orders */}
      <div className="space-y-3">
        {changeOrders.slice(0, 5).map((co) => (
          <div
            key={co.id}
            onClick={() => onViewDetails?.(co)}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                co.cost_impact > 0 ? "bg-red-100" : co.cost_impact < 0 ? "bg-green-100" : "bg-slate-100"
              )}>
                {co.status === 'approved' || co.status === 'executed' ? (
                  <CheckCircle className={cn("h-4 w-4", co.cost_impact > 0 ? "text-red-600" : "text-green-600")} />
                ) : co.status === 'rejected' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">{co.title}</p>
                <p className="text-xs text-slate-500">
                  {co.change_order_number} • {co.reason?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={cn("border", statusColors[co.status])}>
                {co.status?.replace('_', ' ')}
              </Badge>
              <p className={cn(
                "text-sm font-medium mt-1",
                co.cost_impact > 0 ? "text-red-600" : co.cost_impact < 0 ? "text-green-600" : "text-slate-600"
              )}>
                {co.cost_impact > 0 ? '+' : ''}{co.cost_impact ? `$${co.cost_impact.toLocaleString()}` : '-'}
              </p>
            </div>
          </div>
        ))}

        {changeOrders.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No change orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}