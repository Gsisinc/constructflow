import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Owner-set company floors. Defaults reflect the spec:
// contingency min 5%, target 10%, supervision 1 hr/week/active crew.
export const DEFAULT_STANDARDS = {
  contingency_min_pct: 5,
  contingency_target_pct: 10,
  supervision_min_hr_per_week_per_crew: 1,
};

export function normalizeStandards(org) {
  if (!org) return { ...DEFAULT_STANDARDS };
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    contingency_min_pct: num(org.contingency_min_pct, DEFAULT_STANDARDS.contingency_min_pct),
    contingency_target_pct: num(org.contingency_target_pct, DEFAULT_STANDARDS.contingency_target_pct),
    supervision_min_hr_per_week_per_crew: num(org.supervision_min_hr_per_week_per_crew, DEFAULT_STANDARDS.supervision_min_hr_per_week_per_crew),
  };
}

// Loads the current org's standards (cached) for read-only display on any page.
export function useCompanyStandards() {
  const { data, isLoading } = useQuery({
    queryKey: ['company-standards'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user?.organization_id) return { ...DEFAULT_STANDARDS };
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      return normalizeStandards(orgs?.[0]);
    },
    staleTime: 60_000,
  });
  return { standards: data || DEFAULT_STANDARDS, isLoading };
}

// Pure helper: given an estimate-like object and the org standards, compute the
// contingency $ and supervision hours and whether either is below the floor.
//
// estimate shape: { subtotal (direct cost), contingency_percent, crews, weeks,
//                   supervision_hr_per_week_per_crew }
export function computeFloorCheck(estimate, standards) {
  const s = normalizeStandards(standards);
  const directCost = Number(estimate?.subtotal) || 0;
  const contingencyPct = Number(estimate?.contingency_percent) || 0;
  const contingencyAmount = directCost * (contingencyPct / 100);
  const contingencyMinAmount = directCost * (s.contingency_min_pct / 100);
  const belowContingency = contingencyAmount < contingencyMinAmount - 1e-9;

  const crews = Math.max(0, Number(estimate?.crews) || 0);
  const weeks = Math.max(0, Number(estimate?.weeks) || 0);
  const rate = Number(estimate?.supervision_hr_per_week_per_crew) || 0;
  const supervisionHours = crews * weeks * rate;
  const supervisionMinHours = crews * weeks * s.supervision_min_hr_per_week_per_crew;
  const belowSupervision = supervisionHours < supervisionMinHours - 1e-9;

  const reasons = [];
  if (belowContingency) {
    reasons.push(`Contingency ${contingencyPct}% is below the ${s.contingency_min_pct}% floor of direct cost`);
  }
  if (belowSupervision) {
    reasons.push(`Supervision ${supervisionHours.toFixed(1)} hrs is below the ${supervisionMinHours.toFixed(1)} hr minimum (${crews} crew${crews === 1 ? '' : 's'} x ${weeks} wk x ${s.supervision_min_hr_per_week_per_crew} hr)`);
  }

  return {
    directCost,
    contingencyPct,
    contingencyAmount,
    contingencyMinAmount,
    contingencyMinPct: s.contingency_min_pct,
    belowContingency,
    crews,
    weeks,
    supervisionHours,
    supervisionMinHours,
    belowSupervision,
    belowFloor: belowContingency || belowSupervision,
    reasons,
  };
}