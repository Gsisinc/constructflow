import assert from 'node:assert/strict';
import { buildBackupDrillRows, buildReleaseQuality, buildSlaSummary, defaultPhase6Runbooks } from '../src/lib/phase6.js';

const sla = buildSlaSummary({
  incidents: [
    { status: 'open', severity: 'critical' },
    { status: 'resolved', severity: 'high' },
    { status: 'investigating', severity: 'critical' }
  ],
  tickets: [
    { sla_breached: true },
    { sla_breached: false },
    { sla_breached: true }
  ]
});
assert.equal(sla.open_incidents, 2);
assert.equal(sla.critical_open_incidents, 2);
assert.equal(sla.sla_breach_rate, 66.7);

const release = buildReleaseQuality({
  releases: [{}, {}, {}],
  deployments: [{ status: 'succeeded' }, { status: 'failed' }, { status: 'rolled_back' }, { status: 'succeeded' }]
});
assert.equal(release.releases_last_12, 3);
assert.equal(release.deployment_success_rate, 50);
assert.equal(release.change_failure_rate, 50);

const drills = buildBackupDrillRows({
  drills: [
    { id: 'a', executed_at: '2026-02-01T10:00:00Z', duration_minutes: 30, outcome: 'success' },
    { id: 'b', executed_at: '2026-02-02T10:00:00Z', duration_minutes: 50, outcome: 'warning' }
  ]
});
assert.equal(drills[0].id, 'b');

const runbooks = defaultPhase6Runbooks();
assert.ok(runbooks.length >= 3);
assert.ok(runbooks[0].checklist.length >= 3);

console.log('✅ Phase 6 reliability/customer-ops utility tests passed.');
