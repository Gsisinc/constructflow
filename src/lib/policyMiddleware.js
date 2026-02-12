import { loadPolicy, requirePermission } from './permissions';
import { TENANT_SCOPED_ENTITIES, enforceTenantScope } from './policyCore';

const ENTITY_MODULE_MAP = {
  BidOpportunity: 'bids',
  BidRequirement: 'bids',
  BidDocument: 'documents',
  Document: 'documents',
  Project: 'projects',
  Task: 'projects',
  Expense: 'budget',
  Invoice: 'budget',
  PurchaseOrder: 'budget',
  AgentConversation: 'agents',
  AgentMessage: 'agents',
  RolePermission: 'settings',
  Organization: 'settings',
  UserProfile: 'team',
  TeamMember: 'team',
  ServiceTicket: 'projects',
  AuditLog: 'settings',
  IntegrationConfig: 'settings',
  IntegrationSyncJob: 'settings',
  IntegrationReconciliation: 'settings'
};


const METHOD_TO_ACTION = {
  list: 'view',
  filter: 'view',
  get: 'view',
  create: 'create',
  update: 'edit',
  delete: 'delete'
};

export function shouldEnforce() {
  return (import.meta.env.VITE_ENFORCE_POLICY ?? 'true') === 'true';
}

function normalizeRole(user) {
  return user?.role || user?.user_role || 'viewer';
}

async function getSecurityContext(client) {
  const user = await client.auth.me();
  const organizationId = user?.organization_id || null;
  const policy = await loadPolicy({ organizationId });
  return { user, organizationId, role: normalizeRole(user), policy };
}

export function withPolicyEnforcement(client) {
  if (!shouldEnforce() || !client?.entities) return client;

  const wrappedEntities = new Proxy(client.entities, {
    get(target, entityName) {
      const entityClient = target[entityName];
      if (!entityClient || typeof entityClient !== 'object') return entityClient;

      return new Proxy(entityClient, {
        get(methodTarget, methodName) {
          const original = methodTarget[methodName];
          if (typeof original !== 'function') return original;
          const action = METHOD_TO_ACTION[methodName];
          if (!action) return original.bind(methodTarget);

          return async (...args) => {
            const module = ENTITY_MODULE_MAP[entityName] || 'settings';
            const { user, policy, role, organizationId } = await getSecurityContext(client);
            requirePermission({
              policy,
              role,
              module,
              action,
              message: `You do not have permission to ${action} ${entityName}.`
            });

            if (methodName === 'create' && args[0] && typeof args[0] === 'object') {
              args[0] = enforceTenantScope({ entityName, organizationId, payload: args[0] });
            }

            if (methodName === 'filter' && args[0] && typeof args[0] === 'object' && TENANT_SCOPED_ENTITIES.has(entityName) && organizationId) {
              args[0] = { ...args[0], organization_id: args[0].organization_id || organizationId };
            }

            return original.apply(methodTarget, args);
          };
        }
      });
    }
  });

  return {
    ...client,
    entities: wrappedEntities
  };
}
