export function assertTenantAccess({ user, project, fallback = 'Tenant scope mismatch' }) {
  const userOrg = user?.organization_id || null;
  const projectOrg = project?.organization_id || null;

  if (!userOrg || !projectOrg) return true;
  if (userOrg !== projectOrg) {
    throw new Error(fallback);
  }
  return true;
}

export function attachTenantScope(payload = {}, user = null) {
  return {
    ...payload,
    organization_id: payload.organization_id || user?.organization_id || null
  };
}

export function shouldRunAutomationForTenant({ row, user }) {
  if (!user?.organization_id) return true;
  if (!row?.organization_id) return true;
  return row.organization_id === user.organization_id;
}
