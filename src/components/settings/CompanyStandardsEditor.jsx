import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

// Admin-editable company standards. Bound to the Settings orgForm and saved
// with the rest of the org profile. Non-admins see the fields disabled.
export default function CompanyStandardsEditor({ form, setForm, isAdmin }) {
  const num = (v) => (v === '' || v === null || v === undefined ? '' : Number(v));
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          Company Standards
        </CardTitle>
        <p className="text-sm text-slate-500">
          Owner-set floors for contingency and supervision. Shown read-only on the Rate Card, Estimates, Bid detail and Project overview.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Contingency Minimum %</Label>
            <Input
              type="number"
              disabled={!isAdmin}
              value={form.contingency_min_pct ?? 5}
              onChange={(e) => set('contingency_min_pct', num(e.target.value))}
            />
          </div>
          <div>
            <Label>Contingency Target %</Label>
            <Input
              type="number"
              disabled={!isAdmin}
              value={form.contingency_target_pct ?? 10}
              onChange={(e) => set('contingency_target_pct', num(e.target.value))}
            />
          </div>
          <div>
            <Label>Supervision Min (hr/wk/crew)</Label>
            <Input
              type="number"
              disabled={!isAdmin}
              value={form.supervision_min_hr_per_week_per_crew ?? 1}
              onChange={(e) => set('supervision_min_hr_per_week_per_crew', num(e.target.value))}
            />
          </div>
        </div>
        {!isAdmin && (
          <p className="text-xs text-slate-500">Only admins can edit these standards.</p>
        )}
      </CardContent>
    </Card>
  );
}