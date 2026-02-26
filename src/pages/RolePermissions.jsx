import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ROLE_DEFINITIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  DEFAULT_POLICY,
  loadPolicy,
  savePolicy
} from '@/lib/permissions';
import { createAuditLog } from '@/lib/auditLog';

const clonePolicy = (policy) => JSON.parse(JSON.stringify(policy));

export default function RolePermissions() {
  const [policy, setPolicy] = useState(clonePolicy(DEFAULT_POLICY));
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser', 'rolePermissions'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    const run = async () => {
      if (!user?.organization_id) return;
      const loaded = await loadPolicy({ organizationId: user.organization_id });
      setPolicy(clonePolicy(loaded));
    };

    run();
  }, [user?.organization_id]);

  const canEdit = useMemo(
    () => ['owner', 'admin'].includes(user?.role || user?.user_role || 'viewer'),
    [user?.role, user?.user_role]
  );

  const togglePermission = ({ role, module, action, value }) => {
    setPolicy((prev) => {
      const next = clonePolicy(prev);
      next[role] ??= {};
      next[role][module] ??= {};
      next[role][module][action] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!user?.organization_id) return;

    try {
      setSaving(true);
      await savePolicy({ organizationId: user.organization_id, policy });
      await createAuditLog({
        organizationId: user.organization_id,
        userId: user?.id,
        action: 'permissions_updated',
        entityType: 'RolePermission',
        entityId: user.organization_id,
        after: policy,
        metadata: { updated_roles: Object.keys(policy) }
      });
      toast.success('Permission matrix saved.');
    } catch (error) {
      toast.error('Failed to save permissions.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Role & Permissions Matrix</h1>
          <p className="text-sm text-slate-600 mt-1">Phase 1 control center for module-level access management.</p>
        </div>
        <Button onClick={handleSave} disabled={!canEdit || saving} className="bg-amber-600 hover:bg-amber-700">
          {saving ? 'Saving...' : 'Save matrix'}
        </Button>
      </div>

      {!canEdit && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-900">
            You can view permissions, but only Owner/Admin can update this matrix.
          </CardContent>
        </Card>
      )}

      {ROLE_DEFINITIONS.map((role) => (
        <Card key={role.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {role.label}
              <Badge variant="outline">{role.id}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold text-slate-700">Module</th>
                    {PERMISSION_ACTIONS.map((action) => (
                      <th key={action} className="text-center p-2 font-semibold text-slate-700 capitalize">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((module) => (
                    <tr key={`${role.id}-${module.id}`} className="border-b last:border-b-0">
                      <td className="p-2 text-slate-700">{module.label}</td>
                      {PERMISSION_ACTIONS.map((action) => (
                        <td key={action} className="p-2 text-center">
                          <Checkbox
                            checked={!!policy?.[role.id]?.[module.id]?.[action]}
                            disabled={!canEdit}
                            onCheckedChange={(checked) =>
                              togglePermission({
                                role: role.id,
                                module: module.id,
                                action,
                                value: Boolean(checked)
                              })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
