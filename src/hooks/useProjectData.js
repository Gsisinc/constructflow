// ONE shared source of project + billing data for Projects, Dashboard and Billing.
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DEMO_NAMES = ['Downtown Plaza', 'Highway 101', 'Springfield'];
const BILLING_STATUSES = ['awarded', 'in_progress', 'completed'];

export function useOrgProjects(orgId) {
  return useQuery({
    queryKey: ['org-projects', orgId],
    queryFn: async () => {
      const res = await base44.entities.Project.filter(
        { organization_id: orgId },
        { sort: '-created_date', limit: 500 }
      );
      const items = res?.items || res || [];
      return items.filter((p) => !DEMO_NAMES.some((d) => p.name?.includes(d)));
    },
    enabled: !!orgId,
  });
}

// All SalesInvoices for the org (actual billed amounts, by project).
export function useOrgInvoices(orgId) {
  return useQuery({
    queryKey: ['org-invoices', orgId],
    queryFn: async () => {
      const res = await base44.entities.SalesInvoice.filter(
        { organization_id: orgId },
        { sort: '-invoice_date', limit: 1000, fields: ['invoice_number', 'total_amount', 'status', 'project_id', 'invoice_date'] }
      );
      return res?.items || res || [];
    },
    enabled: !!orgId,
  });
}

const safe = (n) => (Number.isFinite(n) ? n : 0);

// Billed = sum of invoice totals (status != draft) grouped by project.
function billedByProject(invoices) {
  const map = {};
  invoices.forEach((inv) => {
    if (!inv.project_id || inv.status === 'draft') return;
    map[inv.project_id] = safe(map[inv.project_id]) + safe(inv.total_amount);
  });
  return map;
}

// Shared billing rows + totals for Billing and Dashboard.
export function useProjectBilling(orgId, retentionPct = 10) {
  const projectsQ = useOrgProjects(orgId);
  const invoicesQ = useOrgInvoices(orgId);
  const projects = projectsQ.data || [];
  const invoices = invoicesQ.data || [];
  const billedMap = billedByProject(invoices);

  const rows = projects.map((p) => {
    const contract = safe(p.budget);
    const billed = safe(billedMap[p.id]);
    const retention = Math.round(contract * (retentionPct / 100));
    const outstanding = Math.max(0, contract - billed);
    const status = contract > 0 && billed >= contract ? 'complete' : billed > 0 ? 'partial' : 'unbilled';
    return {
      id: p.id,
      name: p.name,
      client: p.client_name || '',
      status: p.status,
      contract,
      billed,
      retention,
      outstanding,
      billStatus: status,
    };
  });

  const totals = {
    contract: rows.reduce((s, r) => s + r.contract, 0),
    billed: rows.reduce((s, r) => s + r.billed, 0),
    outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
    retention: rows.reduce((s, r) => s + r.retention, 0),
    count: rows.length,
    billingCount: rows.filter((r) => BILLING_STATUSES.includes(r.status)).length,
  };

  return { projects, invoices, rows, totals, isLoading: projectsQ.isLoading || invoicesQ.isLoading };
}