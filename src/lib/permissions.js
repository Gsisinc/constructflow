import { rawBase44 } from '@/api/rawBase44Client';

export const ROLE_DEFINITIONS = [
  { id: 'owner', label: 'Owner' },
  { id: 'admin', label: 'Admin' },
  { id: 'project_manager', label: 'Project Manager' },
  { id: 'estimator', label: 'Estimator' },
  { id: 'field_lead', label: 'Field Lead' },
  { id: 'finance', label: 'Finance' },
  { id: 'viewer', label: 'Viewer' }
];

export const PERMISSION_MODULES = [
  { id: 'bids', label: 'Bids' },
  { id: 'projects', label: 'Projects' },
  { id: 'documents', label: 'Documents' },
  { id: 'budget', label: 'Budget & Financials' },
  { id: 'team', label: 'Team & Directory' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'settings', label: 'Settings' }
];

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

function buildDefaultPolicy() {
  const policy = {};

  for (const role of ROLE_DEFINITIONS) {
    policy[role.id] = {};
    for (const module of PERMISSION_MODULES) {
      policy[role.id][module.id] = {
        view: true,
        create: role.id !== 'viewer',
        edit: ['owner', 'admin', 'project_manager', 'estimator', 'field_lead', 'finance'].includes(role.id),
        delete: ['owner', 'admin'].includes(role.id),
        approve: ['owner', 'admin', 'project_manager', 'finance'].includes(role.id),
        export: role.id !== 'viewer'
      };
    }
  }

  return policy;
}

export const DEFAULT_POLICY = buildDefaultPolicy();

export async function loadPolicy({ organizationId }) {
  if (!organizationId) return DEFAULT_POLICY;

  try {
    const rows = await rawBase44.entities.RolePermission.filter({ organization_id: organizationId });
    if (!rows?.length) return DEFAULT_POLICY;

    return rows.reduce((acc, row) => {
      if (!acc[row.role]) acc[row.role] = {};
      acc[row.role][row.module] = {
        view: !!row.view,
        create: !!row.create,
        edit: !!row.edit,
        delete: !!row.delete,
        approve: !!row.approve,
        export: !!row.export
      };
      return acc;
    }, {});
  } catch (error) {
    console.warn('RolePermission entity unavailable, using defaults.', error);
    return DEFAULT_POLICY;
  }
}

export async function savePolicy({ organizationId, policy }) {
  if (!organizationId) return;

  try {
    const existing = await rawBase44.entities.RolePermission.filter({ organization_id: organizationId });

    await Promise.all(existing.map((row) => rawBase44.entities.RolePermission.delete(row.id)));

    const records = [];
    for (const role of Object.keys(policy)) {
      for (const module of Object.keys(policy[role] || {})) {
        records.push({
          organization_id: organizationId,
          role,
          module,
          ...policy[role][module]
        });
      }
    }

    await Promise.all(records.map((record) => rawBase44.entities.RolePermission.create(record)));
  } catch (error) {
    console.warn('Unable to save role permissions.', error);
    throw error;
  }
}

export function hasPermission({ policy, role = 'viewer', module, action = 'view' }) {
  const scopedRolePolicy = policy?.[role] || DEFAULT_POLICY[role] || DEFAULT_POLICY.viewer;
  const modulePolicy = scopedRolePolicy?.[module];
  if (!modulePolicy) return false;
  return !!modulePolicy[action];
}


export function requirePermission({ policy, role = 'viewer', module, action = 'view', message = 'Permission denied' }) {
  const allowed = hasPermission({ policy, role, module, action });
  if (!allowed) throw new Error(message);
  return true;
}
