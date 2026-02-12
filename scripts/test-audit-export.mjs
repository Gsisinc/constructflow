import assert from 'node:assert/strict';
import { buildAuditHashChain, verifyAuditHashChain, exportAuditAsCsv, exportAuditAsJsonl } from '../src/lib/auditExport.js';

const logs = [
  { id: '1', action: 'a', entity_type: 'X', entity_id: '11', created_date: '2026-01-01T00:00:00Z' },
  { id: '2', action: 'b', entity_type: 'Y', entity_id: '22', created_date: '2026-01-02T00:00:00Z' }
];

const chain = buildAuditHashChain(logs);
assert.equal(chain.length, 2);
assert.equal(chain[0].previous_hash, 'GENESIS');
assert.equal(verifyAuditHashChain(chain).valid, true);

const tampered = [...chain];
tampered[1] = { ...tampered[1], previous_hash: 'fake' };
assert.equal(verifyAuditHashChain(tampered).valid, false);

assert.ok(exportAuditAsCsv(chain).includes('previous_hash'));
assert.equal(exportAuditAsJsonl(chain).split('\n').length, 2);

console.log('✅ Audit export hash-chain tests passed.');
