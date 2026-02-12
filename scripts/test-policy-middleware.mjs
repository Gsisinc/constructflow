import assert from 'node:assert/strict';
import { enforceTenantScope } from '../src/lib/policyCore.js';

const scoped = enforceTenantScope({
  entityName: 'Project',
  organizationId: 'org1',
  payload: { name: 'Test Project' }
});
assert.equal(scoped.organization_id, 'org1');

let threw = false;
try {
  enforceTenantScope({
    entityName: 'Project',
    organizationId: 'org1',
    payload: { organization_id: 'org2' }
  });
} catch {
  threw = true;
}
assert.equal(threw, true, 'expected cross-tenant write to throw');

const passthrough = enforceTenantScope({
  entityName: 'UnknownEntity',
  organizationId: 'org1',
  payload: { hello: 'world' }
});
assert.equal(passthrough.organization_id, undefined);

console.log('test-policy-middleware: ok');
