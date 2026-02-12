export function levelSubcontractorBids(bids = []) {
  const normalized = bids
    .filter((bid) => bid)
    .map((bid) => {
      const amount = Number(bid.bid_amount || bid.amount || 0);
      const scheduleDays = Number(bid.schedule_days || 0);
      const riskScore = Number(bid.risk_score || 0);
      const compliance = Number(bid.compliance_score || 0);

      const normalizedCost = amount > 0 ? amount : 0;
      const normalizedSchedule = scheduleDays > 0 ? scheduleDays : 0;

      const weightedScore =
        (compliance * 0.35) +
        (Math.max(0, 100 - riskScore) * 0.25) +
        (Math.max(0, 100 - normalizedSchedule) * 0.2) +
        (Math.max(0, 100 - normalizedCost / 1000) * 0.2);

      return {
        ...bid,
        bid_amount: amount,
        schedule_days: scheduleDays,
        risk_score: riskScore,
        compliance_score: compliance,
        weighted_score: Number(weightedScore.toFixed(2))
      };
    })
    .sort((a, b) => b.weighted_score - a.weighted_score);

  return normalized;
}

export function buildVendorScorecards(purchaseOrders = [], invoices = []) {
  const byVendor = new Map();

  for (const po of purchaseOrders) {
    const vendor = po.vendor || 'Unknown Vendor';
    const row = byVendor.get(vendor) || {
      vendor,
      po_count: 0,
      po_total: 0,
      on_time_deliveries: 0,
      late_deliveries: 0,
      invoice_total: 0,
      score: 0
    };

    row.po_count += 1;
    row.po_total += Number(po.amount || 0);
    if (po.delivery_status === 'on_time' || po.status === 'received') {
      row.on_time_deliveries += 1;
    } else if (po.delivery_status === 'late') {
      row.late_deliveries += 1;
    }

    byVendor.set(vendor, row);
  }

  for (const invoice of invoices) {
    const vendor = invoice.vendor || 'Unknown Vendor';
    const row = byVendor.get(vendor) || {
      vendor,
      po_count: 0,
      po_total: 0,
      on_time_deliveries: 0,
      late_deliveries: 0,
      invoice_total: 0,
      score: 0
    };
    row.invoice_total += Number(invoice.amount || 0);
    byVendor.set(vendor, row);
  }

  return Array.from(byVendor.values())
    .map((row) => {
      const deliveryRate = row.po_count > 0 ? row.on_time_deliveries / row.po_count : 0;
      const spendControl = row.po_total > 0 ? Math.max(0, 1 - Math.abs(row.invoice_total - row.po_total) / row.po_total) : 1;
      const score = ((deliveryRate * 0.6) + (spendControl * 0.4)) * 100;
      return { ...row, score: Number(score.toFixed(1)) };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildCostToComplete({ projects = [], expenses = [], changeOrders = [] }) {
  return projects.map((project) => {
    const projectExpenses = expenses.filter((e) => e.project_id === project.id);
    const projectChangeOrders = changeOrders.filter((c) => c.project_id === project.id);

    const budget = Number(project.budget || project.total_budget || 0);
    const spent = projectExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const coImpact = projectChangeOrders.reduce((sum, row) => sum + Number(row.cost_impact || 0), 0);
    const committed = Number(project.committed_cost || 0);
    const forecastTotal = spent + committed + coImpact;
    const costToComplete = Math.max(0, budget - spent);
    const variance = budget - forecastTotal;

    return {
      project_id: project.id,
      project_name: project.name || project.title || 'Unnamed project',
      budget,
      spent,
      committed,
      change_order_impact: coImpact,
      forecast_total: forecastTotal,
      cost_to_complete: costToComplete,
      variance,
      variance_percent: budget > 0 ? Number(((variance / budget) * 100).toFixed(1)) : 0
    };
  });
}
