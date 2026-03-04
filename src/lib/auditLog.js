import constructflowClient from '@/api/constructflowClient';

export async function createAuditLog({ organizationId, userId, action, entityType, entityId, before = null, after = null, metadata = {} }) {
  try {
    await constructflowClient.post('/audit-logs', {
      organization_id: organizationId || null,
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_state: before,
      after_state: after,
      metadata,
      logged_at: new Date().toISOString()
    });
  } catch (error) {
    console.warn('AuditLog entity unavailable, skipping audit log write.', error);
  }
}
