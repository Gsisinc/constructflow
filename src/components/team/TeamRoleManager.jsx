import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Users, Shield, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamRoleManager({ projectId }) {
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['projectTeam', projectId],
    queryFn: () => base44.entities.ProjectTeam.filter({ project_id: projectId })
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['projectRoles'],
    queryFn: () => base44.entities.ProjectRole.list()
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTeam.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTeam', projectId] });
      setShowTeamForm(false);
      setEditingMember(null);
      toast.success('Team member added');
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTeam.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTeam', projectId] });
      toast.success('Team member updated');
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectRoles'] });
      setShowRoleForm(false);
      setEditingRole(null);
      toast.success('Role created');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectRoles'] });
      toast.success('Role updated');
    }
  });

  const handleTeamSubmit = (formData) => {
    if (editingMember) {
      updateTeamMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createTeamMutation.mutate({ project_id: projectId, ...formData });
    }
  };

  const handleRoleSubmit = (formData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const activeMembers = teamMembers.filter(m => m.status === 'active');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">Team Members ({activeMembers.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingMember(null)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
                </DialogHeader>
                <TeamMemberForm
                  member={editingMember}
                  roles={roles}
                  onSubmit={handleTeamSubmit}
                  onCancel={() => {
                    setShowTeamForm(false);
                    setEditingMember(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {teamMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No team members assigned</p>
                </CardContent>
              </Card>
            ) : (
              teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{member.user_name}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{member.user_email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                          {member.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMember(member);
                            setShowTeamForm(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Role:</span>{' '}
                        <Badge className="bg-slate-800 text-white">{member.role_name}</Badge>
                      </div>
                      {member.company && (
                        <div>
                          <span className="text-slate-500">Company:</span>{' '}
                          <span className="font-medium">{member.company}</span>
                        </div>
                      )}
                      {member.responsibilities && (
                        <div>
                          <span className="text-slate-500">Responsibilities:</span>{' '}
                          <p className="text-slate-700 mt-1">{member.responsibilities}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingRole(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
                </DialogHeader>
                <RoleForm
                  role={editingRole}
                  onSubmit={handleRoleSubmit}
                  onCancel={() => {
                    setShowRoleForm(false);
                    setEditingRole(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {roles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No roles defined</p>
                </CardContent>
              </Card>
            ) : (
              roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{role.role_name}</CardTitle>
                        {role.description && (
                          <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {role.is_system_role && (
                          <Badge variant="outline">System Role</Badge>
                        )}
                        {!role.is_system_role && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRole(role);
                              setShowRoleForm(true);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(role.permissions || {}).filter(([_, v]) => v).map(([key]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamMemberForm({ member, roles, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    user_name: member?.user_name || '',
    user_email: member?.user_email || '',
    role_name: member?.role_name || '',
    company: member?.company || '',
    phone: member?.phone || '',
    status: member?.status || 'active',
    responsibilities: member?.responsibilities || '',
    start_date: member?.start_date || new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.user_name}
            onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
            placeholder="Full name"
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.user_email}
            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Role</Label>
          <Select value={formData.role_name} onValueChange={(value) => setFormData({ ...formData, role_name: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.role_name}>
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Company</Label>
          <Input
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company name"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />
        </div>
      </div>

      <div>
        <Label>Responsibilities</Label>
        <Textarea
          value={formData.responsibilities}
          onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
          placeholder="Key responsibilities for this team member"
          className="h-24"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {member ? 'Update' : 'Add'} Team Member
        </Button>
      </div>
    </form>
  );
}

function RoleForm({ role, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    role_name: role?.role_name || '',
    description: role?.description || '',
    permissions: role?.permissions || {
      view_project: true,
      edit_project: false,
      manage_tasks: false,
      approve_change_orders: false,
      manage_safety: false,
      make_decisions: false,
      manage_team: false,
      view_financials: false,
      approve_expenses: false
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const permissionLabels = {
    view_project: 'View Project',
    edit_project: 'Edit Project',
    manage_tasks: 'Manage Tasks',
    approve_change_orders: 'Approve Change Orders',
    manage_safety: 'Manage Safety',
    make_decisions: 'Make Decisions',
    manage_team: 'Manage Team',
    view_financials: 'View Financials',
    approve_expenses: 'Approve Expenses'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Role Name</Label>
        <Input
          value={formData.role_name}
          onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
          placeholder="e.g., Site Supervisor"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this role"
          className="h-20"
        />
      </div>

      <div>
        <Label className="mb-3 block">Permissions</Label>
        <div className="space-y-3 border rounded-lg p-4 max-h-64 overflow-y-auto">
          {Object.entries(permissionLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={formData.permissions[key] || false}
                onCheckedChange={(checked) => 
                  setFormData({
                    ...formData,
                    permissions: { ...formData.permissions, [key]: checked }
                  })
                }
              />
              <Label htmlFor={key} className="font-normal cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {role ? 'Update' : 'Create'} Role
        </Button>
      </div>
    </form>
  );
}