export function buildSlaSummary({ incidents = [], tickets = [] }) {
  const openIncidents = incidents.filter((item) => !['resolved', 'closed'].includes((item.status || '').toLowerCase()));
  const criticalOpen = openIncidents.filter((item) => (item.severity || '').toLowerCase() === 'critical');
  const breachedTickets = tickets.filter((item) => Boolean(item.sla_breached));

  return {
    open_incidents: openIncidents.length,
    critical_open_incidents: criticalOpen.length,
    tickets_total: tickets.length,
    sla_breach_count: breachedTickets.length,
    sla_breach_rate: tickets.length ? Number(((breachedTickets.length / tickets.length) * 100).toFixed(1)) : 0
  };
}

export function buildReleaseQuality({ releases = [], deployments = [] }) {
  const recentReleases = releases.slice(0, 12);
  const failedDeployments = deployments.filter((item) => ['failed', 'rolled_back'].includes((item.status || '').toLowerCase()));
  const successDeployments = deployments.filter((item) => (item.status || '').toLowerCase() === 'succeeded');

  return {
    releases_last_12: recentReleases.length,
    deployment_success_rate: deployments.length ? Number(((successDeployments.length / deployments.length) * 100).toFixed(1)) : 0,
    failed_or_rollback_count: failedDeployments.length,
    change_failure_rate: deployments.length ? Number(((failedDeployments.length / deployments.length) * 100).toFixed(1)) : 0
  };
}

export function buildBackupDrillRows({ drills = [] }) {
  return drills
    .map((row) => ({
      id: row.id,
      executed_at: row.executed_at || row.created_date || null,
      duration_minutes: Number(row.duration_minutes || 0),
      outcome: row.outcome || 'unknown',
      notes: row.notes || ''
    }))
    .sort((a, b) => new Date(b.executed_at || 0) - new Date(a.executed_at || 0));
}

export function defaultPhase6Runbooks() {
  return [
    {
      id: 'runbook-ai-outage',
      title: 'AI provider outage fallback',
      target_mins: 15,
      owner_role: 'Platform Admin',
      checklist: ['Switch to fallback model', 'Disable noncritical automation', 'Notify project managers']
    },
    {
      id: 'runbook-data-restore',
      title: 'Database restore drill',
      target_mins: 45,
      owner_role: 'DevOps',
      checklist: ['Restore latest snapshot', 'Validate project counts', 'Re-enable write traffic']
    },
    {
      id: 'runbook-security-incident',
      title: 'Security incident containment',
      target_mins: 30,
      owner_role: 'Security Admin',
      checklist: ['Revoke leaked credentials', 'Rotate secrets', 'Publish incident summary']
    }
  ];
}
