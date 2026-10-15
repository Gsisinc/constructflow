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

// All PayApplications for the org (actual retention held, by project).
export function useOrgPayApps(orgId) {
  return useQuery({
    queryKey: ['org-payapps', orgId],
    queryFn: async () => {
      const res = await base44.entities.PayApplication.filter(
        { organization_id: orgId },
        { sort: '-created_date', limit: 1000, fields: ['project_id', 'retention_amount', 'status'] }
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

// Paid = sum of invoice totals where status === 'paid' (collected), grouped by project.
function paidByProject(invoices) {
  const map = {};
  invoices.forEach((inv) => {
    if (!inv.project_id || inv.status !== 'paid') return;
    map[inv.project_id] = safe(map[inv.project_id]) + safe(inv.total_amount);
  });
  return map;
}

// Retention held = sum of actual retention_amount on billed (non-draft) pay apps, by project.
function retentionByProject(payApps) {
  const map = {};
  payApps.forEach((pa) => {
    if (!pa.project_id || pa.status === 'draft') return;
    map[pa.project_id] = safe(map[pa.project_id]) + safe(pa.retention_amount);
  });
  return map;
}

// Shared billing rows + totals for Billing and Dashboard.
export function useProjectBilling(orgId) {
  const projectsQ = useOrgProjects(orgId);
  const invoicesQ = useOrgInvoices(orgId);
  const payAppsQ = useOrgPayApps(orgId);
  const projects = projectsQ.data || [];
  const invoices = invoicesQ.data || [];
  const payApps = payAppsQ.data || [];
  const billedMap = billedByProject(invoices);
  const paidMap = paidByProject(invoices);
  const retentionMap = retentionByProject(payApps);

  const rows = projects.map((p) => {
    const contract = safe(p.budget);
    const billed = safe(billedMap[p.id]);
    const paid = safe(paidMap[p.id]);
    const retention = safe(retentionMap[p.id]);
    // Outstanding = billed minus collected, never more than the contract value.
    const outstanding = Math.max(0, Math.min(billed - paid, contract));
    const status = contract > 0 && billed >= contract ? 'complete' : billed > 0 ? 'partial' : 'unbilled';
    return {
      id: p.id,
      name: p.name,
      client: p.client_name || '',
      status: p.status,
      contract,
      billed,
      paid,
      retention,
      outstanding,
      billStatus: status,
    };
  });

  const totals = {
    contract: rows.reduce((s, r) => s + r.contract, 0),
    billed: rows.reduce((s, r) => s + r.billed, 0),
    paid: rows.reduce((s, r) => s + r.paid, 0),
    outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
    retention: rows.reduce((s, r) => s + r.retention, 0),
    count: rows.length,
    billingCount: rows.filter((r) => BILLING_STATUSES.includes(r.status)).length,
  };

  return { projects, invoices, payApps, rows, totals, isLoading: projectsQ.isLoading || invoicesQ.isLoading || payAppsQ.isLoading };
}