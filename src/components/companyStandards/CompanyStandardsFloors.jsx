import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { useCompanyStandards } from '@/lib/companyStandards';

// Read-only display of the owner-set company floors. Shown to all roles on the
// Rate Card, Bid detail and Project overview.
export default function CompanyStandardsFloors() {
  const { standards, isLoading } = useCompanyStandards();
  return (
    <Card className="border-slate-200 bg-slate-50/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          Company Standards (Floors)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-700">
        {isLoading ? (
          <p className="text-slate-400">Loading floors…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-slate-500">Contingency min:</span>{' '}
              <span className="font-semibold">{standards.contingency_min_pct}%</span>
            </div>
            <div>
              <span className="text-slate-500">Contingency target:</span>{' '}
              <span className="font-semibold">{standards.contingency_target_pct}%</span>
            </div>
            <div>
              <span className="text-slate-500">Supervision min:</span>{' '}
              <span className="font-semibold">{standards.supervision_min_hr_per_week_per_crew} hr/wk/crew</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}