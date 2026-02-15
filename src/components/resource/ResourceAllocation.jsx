import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceAllocation() {
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'John Smith', role: 'Project Manager', capacity: 40, allocations: [] },
    { id: 2, name: 'Jane Doe', role: 'Electrician', capacity: 40, allocations: [] },
    { id: 3, name: 'Mike Johnson', role: 'Foreman', capacity: 40, allocations: [] }
  ]);

  const [projects, setProjects] = useState([
    { id: 1, name: 'School Retrofit', duration: 12, startDate: '2026-03-01' },
    { id: 2, name: 'Hospital Modernization', duration: 16, startDate: '2026-02-15' }
  ]);

  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    memberId: '',
    projectId: '',
    hoursPerWeek: 40,
    weeks: 4
  });

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    capacity: 40
  });

  const addTeamMember = () => {
    if (!newMember.name || !newMember.role) {
      toast.error('Please fill in name and role');
      return;
    }
    setTeamMembers([...teamMembers, {
      ...newMember,
      id: Date.now(),
      capacity: parseInt(newMember.capacity) || 40,
      allocations: []
    }]);
    setNewMember({ name: '', role: '', capacity: 40 });
    setShowAddMember(false);
    toast.success('Team member added');
  };

  const addAllocation = () => {
    if (!newAllocation.memberId || !newAllocation.projectId) {
      toast.error('Please select member and project');
      return;
    }

    const totalHours = parseInt(newAllocation.hoursPerWeek) * parseInt(newAllocation.weeks);

    setTeamMembers(teamMembers.map(m =>
      m.id === parseInt(newAllocation.memberId)
        ? {
          ...m,
          allocations: [...m.allocations, {
            id: Date.now(),
            projectId: parseInt(newAllocation.projectId),
            hoursPerWeek: parseInt(newAllocation.hoursPerWeek),
            weeks: parseInt(newAllocation.weeks),
            totalHours
          }]
        }
        : m
    ));

    setNewAllocation({ memberId: '', projectId: '', hoursPerWeek: 40, weeks: 4 });
    setShowAddAllocation(false);
    toast.success('Resource allocated');
  };

  const removeAllocation = (memberId, allocationId) => {
    setTeamMembers(teamMembers.map(m =>
      m.id === memberId
        ? { ...m, allocations: m.allocations.filter(a => a.id !== allocationId) }
        : m
    ));
    toast.success('Allocation removed');
  };

  // Calculate workload analysis
  const workloadAnalysis = useMemo(() => {
    return teamMembers.map(member => {
      const allocatedHours = member.allocations.reduce((sum, a) => sum + a.totalHours, 0);
      const capacityHours = member.capacity * 52; // Annual capacity
      const utilization = (allocatedHours / capacityHours * 100).toFixed(1);
      const isOverallocated = allocatedHours > member.capacity * 4; // More than 4 weeks

      return {
        ...member,
        allocatedHours,
        utilization,
        isOverallocated,
        available: Math.max(0, member.capacity * 4 - allocatedHours)
      };
    });
  }, [teamMembers]);

  // Calculate project resource needs
  const projectResources = useMemo(() => {
    return projects.map(project => {
      const allocations = teamMembers.flatMap(m =>
        m.allocations
          .filter(a => a.projectId === project.id)
          .map(a => ({ memberName: m.name, ...a }))
      );

      return {
        ...project,
        allocations,
        totalAllocatedHours: allocations.reduce((sum, a) => sum + a.totalHours, 0),
        teamSize: new Set(allocations.map(a => a.memberName)).size
      };
    });
  }, [projects, teamMembers]);

  const summary = useMemo(() => {
    const totalCapacity = teamMembers.reduce((sum, m) => sum + m.capacity * 4, 0);
    const totalAllocated = workloadAnalysis.reduce((sum, m) => sum + m.allocatedHours, 0);
    const avgUtilization = (totalAllocated / totalCapacity * 100).toFixed(1);
    const overallocatedCount = workloadAnalysis.filter(m => m.isOverallocated).length;

    return {
      totalTeamMembers: teamMembers.length,
      totalCapacity,
      totalAllocated,
      avgUtilization,
      overallocatedCount,
      availableCapacity: totalCapacity - totalAllocated
    };
  }, [workloadAnalysis, teamMembers]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalTeamMembers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalCapacity}</p>
            <p className="text-xs text-slate-600">hours/month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{summary.totalAllocated}</p>
            <p className="text-xs text-slate-600">hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{summary.avgUtilization}%</p>
          </CardContent>
        </Card>

        <Card className={summary.overallocatedCount > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.overallocatedCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {summary.overallocatedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Allocation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Resource Allocation</CardTitle>
          <div className="flex gap-2">
            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                  <Input
                    placeholder="Role"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Weekly capacity (hours)"
                    value={newMember.capacity}
                    onChange={(e) => setNewMember({ ...newMember, capacity: e.target.value })}
                  />
                  <Button onClick={addTeamMember} className="w-full">Add</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddAllocation} onOpenChange={setShowAddAllocation}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Allocate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Allocate Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Member</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newAllocation.memberId}
                      onChange={(e) => setNewAllocation({ ...newAllocation, memberId: e.target.value })}
                    >
                      <option value="">Select member</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Project</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newAllocation.projectId}
                      onChange={(e) => setNewAllocation({ ...newAllocation, projectId: e.target.value })}
                    >
                      <option value="">Select project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Hours/Week</label>
                      <Input
                        type="number"
                        value={newAllocation.hoursPerWeek}
                        onChange={(e) => setNewAllocation({ ...newAllocation, hoursPerWeek: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Weeks</label>
                      <Input
                        type="number"
                        value={newAllocation.weeks}
                        onChange={(e) => setNewAllocation({ ...newAllocation, weeks: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={addAllocation} className="w-full">Allocate</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {workloadAnalysis.map(member => (
              <div key={member.id} className={`border rounded-lg p-4 ${member.isOverallocated ? 'border-orange-300 bg-orange-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{member.name}</h3>
                    <p className="text-sm text-slate-600">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {member.utilization}% Utilized
                    </p>
                    {member.isOverallocated && (
                      <div className="flex items-center gap-1 text-orange-600 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Overallocated
                      </div>
                    )}
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, member.utilization)}%` }}
                    className={`h-full ${member.isOverallocated ? 'bg-orange-500' : 'bg-blue-500'}`}
                  />
                </div>

                <p className="text-xs text-slate-600 mb-2">
                  Capacity: {member.capacity}h/week • Allocated: {member.allocatedHours}h total • Available: {member.available}h
                </p>

                {/* Allocations */}
                {member.allocations.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {member.allocations.map(alloc => {
                      const project = projects.find(p => p.id === alloc.projectId);
                      return (
                        <div key={alloc.id} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                          <div>
                            <p className="font-medium">{project?.name}</p>
                            <p className="text-xs text-slate-600">
                              {alloc.hoursPerWeek}h/week × {alloc.weeks} weeks = {alloc.totalHours}h
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAllocation(member.id, alloc.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Resource Needs */}
      <Card>
        <CardHeader>
          <CardTitle>Project Resource Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectResources.map(project => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{project.name}</h3>
                    <p className="text-sm text-slate-600">
                      {project.teamSize} team members • {project.duration} weeks
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {project.totalAllocatedHours}h
                    </p>
                  </div>
                </div>

                {project.allocations.length > 0 && (
                  <div className="bg-slate-50 rounded p-2 mt-2">
                    {project.allocations.map((alloc, idx) => (
                      <p key={idx} className="text-xs text-slate-600">
                        {alloc.memberName}: {alloc.totalHours}h
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leveling Recommendations */}
      {summary.overallocatedCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Resource Leveling Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workloadAnalysis.filter(m => m.isOverallocated).map(member => (
              <div key={member.id} className="p-2 bg-white rounded">
                <p className="text-sm font-medium text-orange-900">
                  {member.name} is overallocated by {(member.allocatedHours - member.capacity * 4)} hours
                </p>
                <p className="text-xs text-orange-700">
                  Consider: Extending timeline, adding resources, or deferring lower-priority work
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
