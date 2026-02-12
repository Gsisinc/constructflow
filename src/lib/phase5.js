export function getPhase5Providers() {
  return [
    { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', tier: 'core', supports_webhook: true },
    { id: 'sage', name: 'Sage', category: 'Accounting', tier: 'core', supports_webhook: true },
    { id: 'netsuite', name: 'NetSuite', category: 'Accounting', tier: 'enterprise', supports_webhook: true },
    { id: 'procore', name: 'Procore Connector', category: 'Construction', tier: 'enterprise', supports_webhook: false },
    { id: 'autodesk_acc', name: 'Autodesk ACC', category: 'Construction', tier: 'enterprise', supports_webhook: false },
    { id: 'google_calendar', name: 'Google Calendar', category: 'Collaboration', tier: 'core', supports_webhook: true },
    { id: 'microsoft_teams', name: 'Microsoft Teams', category: 'Collaboration', tier: 'core', supports_webhook: true },
    { id: 'slack', name: 'Slack', category: 'Collaboration', tier: 'core', supports_webhook: true }
  ];
}

export function normalizeTenantPolicy(raw = {}) {
  return {
    tenant_slug: raw.tenant_slug || '',
    region: raw.region || 'us-east',
    data_residency_required: Boolean(raw.data_residency_required),
    retention_days: Math.max(30, Number(raw.retention_days ?? 365)),
    seat_limit: Math.max(1, Number(raw.seat_limit ?? 25)),
    storage_limit_gb: Math.max(5, Number(raw.storage_limit_gb ?? 100)),
    ai_monthly_token_limit: Math.max(1000, Number(raw.ai_monthly_token_limit ?? 1_000_000))
  };
}

export function buildTenantUsageSummary({ users = [], documents = [], aiLogs = [] }) {
  const activeUsers = users.filter((u) => (u.status || 'active') === 'active').length;
  const totalStorageMb = documents.reduce((sum, doc) => sum + Number(doc.file_size_mb || doc.size_mb || 0), 0);
  const aiTokens = aiLogs.reduce((sum, row) => sum + Number(row.token_estimate || row.tokens || 0), 0);

  return {
    active_users: activeUsers,
    documents_count: documents.length,
    storage_gb_used: Number((totalStorageMb / 1024).toFixed(2)),
    ai_tokens_used: Math.round(aiTokens)
  };
}

export function buildExecutiveKpis({ projects = [], expenses = [], bids = [] }) {
  const activeProjects = projects.filter((p) => !['completed', 'archived', 'cancelled'].includes((p.status || '').toLowerCase()));
  const budget = projects.reduce((sum, p) => sum + Number(p.budget || p.total_budget || 0), 0);
  const spend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const submitted = bids.filter((b) => ['submitted', 'won', 'lost'].includes((b.status || '').toLowerCase()));
  const won = submitted.filter((b) => (b.status || '').toLowerCase() === 'won');
  const winRate = submitted.length ? (won.length / submitted.length) * 100 : 0;

  return {
    active_projects: activeProjects.length,
    total_budget: budget,
    total_spend: spend,
    margin_projection: budget - spend,
    bid_win_rate: Number(winRate.toFixed(1))
  };
}

export function buildRevenueForecast({ projects = [] }) {
  const byMonth = {};
  for (const project of projects) {
    const start = project.start_date ? new Date(project.start_date) : new Date();
    const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + Number(project.budget || project.total_budget || 0);
  }

  return Object.entries(byMonth)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
