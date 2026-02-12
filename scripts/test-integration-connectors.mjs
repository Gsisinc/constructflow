import assert from 'node:assert/strict';
import {
  listConnectorCapabilities,
  detectReconciliationConflicts
} from '../src/lib/integrationCore.js';

const connectors = listConnectorCapabilities();
assert.ok(connectors.length >= 5, 'expected connector registry entries');
assert.ok(connectors.some((c) => c.provider === 'quickbooks'), 'quickbooks missing');
assert.ok(connectors.some((c) => c.provider === 'autodesk_acc'), 'autodesk_acc missing');

const conflicts = detectReconciliationConflicts({
  sourceRecords: [{ external_id: 'A1', budget: 120000, status: 'active' }],
  targetRecords: [{ external_id: 'A1', budget: 115000, status: 'active' }]
});

assert.equal(conflicts.length, 1, 'should detect one conflict');
assert.deepEqual(conflicts[0].diff_fields, ['budget']);

console.log('test-integration-connectors: ok');
