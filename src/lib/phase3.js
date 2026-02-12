export function buildPortfolioMetrics({ projects = [], bids = [], expenses = [] }) {
  const activeProjects = projects.filter((p) => !['completed', 'cancelled', 'archived'].includes((p.status || '').toLowerCase()));
  const wonBids = bids.filter((b) => (b.status || '').toLowerCase() === 'won');
  const submittedBids = bids.filter((b) => ['submitted', 'won', 'lost'].includes((b.status || '').toLowerCase()));

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || p.total_budget || 0), 0);
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const profitProjection = totalBudget - totalSpend;
  const winRate = submittedBids.length ? (wonBids.length / submittedBids.length) * 100 : 0;

  return {
    total_projects: projects.length,
    active_projects: activeProjects.length,
    total_budget: totalBudget,
    total_spend: totalSpend,
    projected_profit: profitProjection,
    bid_win_rate: Number(winRate.toFixed(1))
  };
}

export function buildPortfolioRows({ projects = [], expenses = [] }) {
  return projects.map((project) => {
    const projectExpenses = expenses.filter((e) => e.project_id === project.id);
    const spend = projectExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const budget = Number(project.budget || project.total_budget || 0);
    const variance = budget - spend;

    return {
      project_id: project.id,
      project_name: project.name || project.title || 'Untitled Project',
      status: project.status || 'unknown',
      budget,
      spend,
      variance,
      variance_percent: budget > 0 ? Number(((variance / budget) * 100).toFixed(1)) : 0
    };
  });
}

export function toCsv(rows = []) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header];
      const escaped = String(value ?? '').replaceAll('"', '""');
      return `"${escaped}"`;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

export function normalizeIntegrationState(raw = {}) {
  const providers = ['quickbooks', 'sage', 'netsuite', 'google_calendar', 'microsoft_teams', 'slack'];
  return providers.reduce((acc, key) => {
    acc[key] = {
      connected: Boolean(raw?.[key]?.connected),
      account_name: raw?.[key]?.account_name || '',
      last_sync_at: raw?.[key]?.last_sync_at || null
    };
    return acc;
  }, {});
}
