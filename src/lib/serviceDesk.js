export function buildSlaTag({ priority = 'medium', dueAt = null }) {
  const now = Date.now();
  const defaultHoursByPriority = {
    low: 72,
    medium: 24,
    high: 8,
    critical: 2
  };

  const hours = defaultHoursByPriority[priority] || 24;
  const dueAtIso = dueAt || new Date(now + hours * 60 * 60 * 1000).toISOString();
  const msRemaining = new Date(dueAtIso).getTime() - now;

  if (msRemaining < 0) {
    return { label: 'SLA breached', badgeClass: 'bg-red-100 text-red-700', due_at: dueAtIso };
  }

  if (msRemaining <= 2 * 60 * 60 * 1000) {
    return { label: 'SLA at risk', badgeClass: 'bg-amber-100 text-amber-700', due_at: dueAtIso };
  }

  return { label: 'SLA healthy', badgeClass: 'bg-green-100 text-green-700', due_at: dueAtIso };
}

export function sortTicketsByUrgency(tickets = []) {
  const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...tickets].sort((a, b) => {
    const pa = priorityRank[(a.priority || a.severity || 'medium').toLowerCase()] || 2;
    const pb = priorityRank[(b.priority || b.severity || 'medium').toLowerCase()] || 2;
    if (pb !== pa) return pb - pa;
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });
}

export function buildTicketMetrics(tickets = []) {
  const open = tickets.filter((t) => !['resolved', 'closed'].includes((t.status || '').toLowerCase()));
  const critical = open.filter((t) => ['critical'].includes((t.priority || t.severity || '').toLowerCase()));
  const breached = open.filter((t) => buildSlaTag({ priority: t.priority || t.severity || 'medium', dueAt: t.sla_due_at || t.due_date }).label === 'SLA breached');
  return {
    total: tickets.length,
    open: open.length,
    critical_open: critical.length,
    sla_breached: breached.length
  };
}
