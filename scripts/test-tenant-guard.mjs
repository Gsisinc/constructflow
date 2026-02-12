import assert from 'node:assert/strict';
import { assertTenantAccess, attachTenantScope, shouldRunAutomationForTenant } from '../src/lib/tenantGuard.js';

assert.equal(assertTenantAccess({ user: { organization_id: 'o1' }, project: { organization_id: 'o1' } }), true);
let threw = false;
try {
  assertTenantAccess({ user: { organization_id: 'o1' }, project: { organization_id: 'o2' } });
} catch {
  threw = true;
}
assert.equal(threw, true);

const scoped = attachTenantScope({ name: 'r' }, { organization_id: 'o9' });
assert.equal(scoped.organization_id, 'o9');
assert.equal(shouldRunAutomationForTenant({ row: { organization_id: 'o9' }, user: { organization_id: 'o9' } }), true);
assert.equal(shouldRunAutomationForTenant({ row: { organization_id: 'o2' }, user: { organization_id: 'o9' } }), false);

console.log('✅ Tenant guard utility tests passed.');
