import assert from 'node:assert/strict';
import { buildSlaTag, buildTicketMetrics, sortTicketsByUrgency } from '../src/lib/serviceDesk.js';

const breached = buildSlaTag({ priority: 'critical', dueAt: new Date(Date.now() - 60_000).toISOString() });
assert.equal(breached.label, 'SLA breached');

const healthy = buildSlaTag({ priority: 'low' });
assert.equal(healthy.label, 'SLA healthy');

const sorted = sortTicketsByUrgency([
  { id: '1', priority: 'low', created_date: '2026-02-01T00:00:00Z' },
  { id: '2', priority: 'critical', created_date: '2026-02-01T00:00:00Z' },
  { id: '3', priority: 'high', created_date: '2026-02-02T00:00:00Z' }
]);
assert.deepEqual(sorted.map((t) => t.id), ['2', '3', '1']);

const metrics = buildTicketMetrics([
  { status: 'open', priority: 'critical', due_date: new Date(Date.now() - 1000).toISOString() },
  { status: 'resolved', priority: 'high' },
  { status: 'in_progress', priority: 'medium' }
]);
assert.equal(metrics.total, 3);
assert.equal(metrics.open, 2);
assert.equal(metrics.critical_open, 1);
assert.equal(metrics.sla_breached, 1);

console.log('✅ Service desk utility tests passed.');
