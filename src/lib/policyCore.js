export const TENANT_SCOPED_ENTITIES = new Set([
  'BidOpportunity',
  'BidRequirement',
  'BidDocument',
  'Document',
  'Project',
  'Task',
  'Expense',
  'Invoice',
  'PurchaseOrder',
  'AgentConversation',
  'AgentMessage',
  'RolePermission',
  'ServiceTicket',
  'IntegrationConfig',
  'IntegrationSyncJob',
  'IntegrationReconciliation',
  'AuditLog'
]);

export function enforceTenantScope({ entityName, organizationId, payload }) {
  if (!TENANT_SCOPED_ENTITIES.has(entityName)) return payload;
  if (!organizationId) return payload;

  if (payload.organization_id && payload.organization_id !== organizationId) {
    throw new Error(`Cross-tenant write blocked for ${entityName}.`);
  }

  return {
    ...payload,
    organization_id: payload.organization_id || organizationId
  };
}
